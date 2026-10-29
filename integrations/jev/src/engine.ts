import { createHash } from 'node:crypto';
import type { PluginInput } from '@open-wa/plugin-sdk';
import type { AgentSettings } from './config';
import type { ChatTurn } from './provider';
import type { Conversation } from './conversation';
import type { ConversationHub } from './hub';
import { actionContext, actionDefinition, invalidActionArguments, selectionAcknowledgement, selectionInstructions, bookingCorrectionAcknowledgement, actionResultAcknowledgement, type AgentActions, type PreparedAction, type BookingInput } from './actions';
import { assertLiteralDestinations } from './facts';
import { JevActionRouter, formatLabels, type ActionDecision, type DecisionContext, type TurnFeedback } from './jev';
const failure = (error: unknown) => error instanceof Error ? error.message : String(error);
export class ActionAgent {
  readonly router: JevActionRouter;
  error?: string;
  private tasks = new Set<Promise<void>>();
  constructor(readonly input: PluginInput, readonly hub: ConversationHub, key: () => string | undefined,
    private environment: { settings: () => AgentSettings; ready: () => boolean; canRespond: (person: Conversation) => boolean; report: (error: unknown) => void }) {
    this.router = new JevActionRouter(key);
  }
  async classify(turns: ChatTurn[], settings: AgentSettings, signal: AbortSignal, selection = false, latestBooking?: BookingInput, cycle?: DecisionContext) {
    if (!this.router.configured()) throw new Error('Set JEV_API_KEY on the Easy API host to enable chat action routing.');
    const license = await this.input.runtime.invoke<{ status?: string; features?: { interactive?: boolean } }>('getLicenseFeatures', []);
    signal.throwIfAborted();
    return this.router.classify(turns, settings.actions.classifierModel, license?.status === 'valid' && license.features?.interactive === true, signal, selection ? 'selection' : 'message', latestBooking, cycle);
  }
  async previewAction(text: string, signal: AbortSignal) {
    const decision = await this.classify([{ role: 'user', content: text }], this.environment.settings(), signal);
    return { ...decision, label: formatLabels[decision.format] };
  }
  async actions(person: Conversation, scope: string, settings: AgentSettings, current: () => boolean, requestSignal: AbortSignal, feedback?: TurnFeedback): Promise<AgentActions | undefined> {
    const source = person.turns.find(turn => turn.id === scope) ?? person.turns.findLast(turn => turn.role === 'user');
    const selectionContext = source?.selection ? selectionInstructions : '';
    const acknowledgement = source?.selection && !feedback ? selectionAcknowledgement(source.text) : undefined;
    if (!settings.actions.sendMessage) return selectionContext ? { tools: [], instructions: selectionContext, acknowledgement, execute: async () => ({ status: 'failed' }) } : undefined;
    let decision: ActionDecision;
    const latestBooking = this.hub.latestBooking(person);
    try {
      const cycle: DecisionContext = { responseChannel: source?.channel ?? person.channel, referenceInstant: source?.at, turnId: source?.id, agreedTimeZone: settings.conversation.timeZone, phase: feedback?.phase ?? 'input', requestedFormats: source?.requestedFormats, proposedReply: feedback?.reply, results: feedback?.results ?? [],
        recentActions: person.turns.filter(turn => turn.action).slice(-10).map(turn => ({ format: turn.classification?.format,
          state: turn.state, delivery: turn.textState, text: turn.text.slice(0, 1500), content: turn.interactive, booking: turn.bookingInput, previousCardRemoval: turn.previousCardRemoval })) };
      decision = await this.classify(person.history, settings, requestSignal, source?.selection, latestBooking?.bookingInput, cycle);
      this.error = undefined;
      if (source) {
        if (!feedback) source.classification = decision;
        source.requestedFormats = decision.requestedFormats;
        source.decisionTrail = [...source.decisionTrail ?? [], { at: Date.now(), phase: cycle.phase, decision }].slice(-16);
      }
      this.hub.changed();
    } catch (error) {
      requestSignal.throwIfAborted();
      this.error = failure(error); this.hub.changed();
      return { tools: [], instructions: `The chat action classifier is unavailable. Continue the conversation, but if asked to send something in chat, explain that chat actions are currently unavailable. Do not claim a send or substitute another message format. ${selectionContext}`, acknowledgement, execute: async () => ({ status: 'failed' }) };
    }
    requestSignal.throwIfAborted();
    if (decision.format === 'correct-booking' && !decision.facts.correctionFields.length) { decision = { ...decision, format: 'clarify', nextStep: 'clarify' }; }
    const original = decision.format === 'correct-booking' ? latestBooking : undefined;
    const definition = decision.nextStep === 'act' ? actionDefinition(decision.format, original?.bookingInput, { buttonKind: decision.buttonKind, facts: decision.facts, timeZone: settings.conversation.timeZone }) : undefined;
    // Fan-out answers that are irrelevant to the executable format stay in
    // decision evidence; they are not facts for the wording model to reuse.
    const grounding = definition ? { selected: decision.facts.selected,
      ...(['booking', 'correct-booking'].includes(decision.format) ? { date: decision.facts.date, correctionFields: decision.facts.correctionFields, referenceInstant: decision.facts.referenceInstant } : {}) } : undefined;
    const instructions = `${actionContext(decision.nextStep === 'act' ? decision.format : decision.nextStep === 'clarify' ? 'clarify' : 'none', decision.facts.referenceInstant, settings.conversation.timeZone ?? latestBooking?.bookingInput?.booking.timeZone)} ${selectionContext}
The channel adapter returns this answer through ${source?.channel ?? person.channel}. Ordinary questions are answered there; chat tools send additional messages only when requested.
Observed host results in this turn, oldest to newest: ${JSON.stringify(feedback?.results ?? [])}. A later submitted result supersedes an earlier failed attempt for that action. These observations are authoritative; earlier rejected drafts are not.
Jev's next step is ${decision.nextStep}. ${grounding ? `Host grounding: ${JSON.stringify(grounding)}. Date and literal values are resolved by the host; never invent a replacement for an absent value.` : ''} ${decision.nextStep === 'reconcile' ? 'Explain the uncertain outcome and ask the person to check their chat. No resend is available.' : ''}
${feedback?.reply && decision.replyVerdict === 'revise' ? `The following draft was NOT spoken and Jev rejected it. Produce an accurate response based on the actual tool results and conversation, or execute the newly selected action first. Rejected draft: ${JSON.stringify(feedback.reply)}` : ''}`;
    const review: NonNullable<AgentActions['review']> = async (nextFeedback, signal) => {
      signal.throwIfAborted();
      const next = await this.actions(person, scope, settings, current, signal, nextFeedback);
      return { accept: Boolean(next?.decision && next.decision.nextStep !== 'act' && next.decision.replyVerdict === 'accept'),
        actions: next ?? { tools: [], instructions: 'Chat actions are unavailable. Explain the observed results without claiming a new action.', execute: async () => ({ status: 'failed' }) } };
    };
    if (!definition) return { tools: [], instructions, decision, review, acknowledgement, execute: async () => ({ status: 'failed' }) };
    let attempt: Promise<unknown> | undefined;
    let correctionScript: string | undefined;
    return { tools: [definition.tool], instructions, decision, review, acknowledgeResult: result => correctionScript ?? actionResultAcknowledgement([...(feedback?.results ?? []).map(entry => entry.result), result]), execute: async (call, signal) => {
      signal.throwIfAborted();
      if (call.function.name !== definition.tool.function.name) return { status: 'failed', reason: 'That chat action is unavailable.' };
      let prepared: PreparedAction;
      try { prepared = definition.prepare(call.function.arguments); }
      catch (error) { return invalidActionArguments(error); }
      const assess = async (candidate: PreparedAction) => {
        const assessed = await this.classify(person.history, settings, signal, source?.selection, latestBooking?.bookingInput, {
          responseChannel: source?.channel ?? person.channel, referenceInstant: source?.at, turnId: source?.id, agreedTimeZone: settings.conversation.timeZone, phase: 'proposal', requestedFormats: source?.requestedFormats, proposedAction: { format: decision.format, content: candidate.value, bookingInput: candidate.bookingInput },
          results: feedback?.results ?? [], recentActions: person.turns.filter(turn => turn.action).slice(-10).map(turn => ({
            format: turn.classification?.format, state: turn.state, delivery: turn.textState, text: turn.text.slice(0, 1500), content: turn.interactive,
            booking: turn.bookingInput, previousCardRemoval: turn.previousCardRemoval,
          })),
        });
        signal.throwIfAborted();
        if (source) source.decisionTrail = [...source.decisionTrail ?? [], { at: Date.now(), phase: 'proposal', decision: assessed }].slice(-16);
        this.hub.changed(); return assessed;
      };
      let proposed = await assess(prepared);
      let proposedInput = JSON.parse(call.function.arguments);
      for (let repairs = 0; repairs < 4 && proposed.proposalVerdict === 'repair'; repairs++) {
        // A schema-optional field can be omitted without inventing a replacement.
        // Jev locates it; the schema and another content review validate the repair.
        const input = proposedInput, field = proposed.repairField;
        const parameters = definition.tool.function.parameters;
        const required = Array.isArray(parameters.required) ? parameters.required : [];
        if (parameters.properties && typeof parameters.properties === 'object' && Object.hasOwn(parameters.properties, field)
          && !required.includes(field) && Object.hasOwn(input, field)) {
          const revised = { ...input }; delete revised[field]; proposedInput = revised;
          prepared = definition.prepare(JSON.stringify(revised));
          proposed = await assess(prepared);
        } else break;
      }
      if (original && proposed.proposalVerdict === 'accept') {
        // Proposal review can narrow an over-broad initial correction mask.
        // Only fields confirmed at both checkpoints may change on the card.
        const confirmed = decision.facts.correctionFields.filter(field => proposed.facts.correctionFields.includes(field));
        if (confirmed.length !== decision.facts.correctionFields.length) {
          decision = { ...decision, facts: { ...decision.facts, correctionFields: confirmed } };
          try { prepared = actionDefinition('correct-booking', original.bookingInput, { buttonKind: decision.buttonKind, facts: decision.facts, timeZone: settings.conversation.timeZone })!.prepare(JSON.stringify(proposedInput)); }
          catch (error) { return invalidActionArguments(error); }
          proposed = await assess(prepared);
        }
      }
      if (proposed.proposalVerdict !== 'accept') return { status: 'invalid_arguments',
        reason: proposed.proposalVerdict === 'repair'
          ? 'Repair the identified field using only the actual request and known facts. Omit unsupported optional content. Do not invent business facts, references or destinations, or substitute another control type. Compose ordinary titles and labels yourself.'
          : 'Ask one brief question for the missing or ambiguous required business fact; do not invent it.',
        fields: [{ path: proposed.repairField, rejectedValue: proposedInput[proposed.repairField], message: proposed.proposalVerdict === 'repair' ? 'This field contains unsupported content. Discard its wording and facts; rebuild it only from user statements or accepted tool results, or omit it when optional.' : 'A required business fact needs clarification.' }],
        needsClarification: proposed.proposalVerdict === 'clarify' };
      // Let Jev remove an unsupported optional field before this final exact-value check.
      // No WhatsApp operation occurs until both semantic review and provenance pass.
      try { assertLiteralDestinations(decision.format === 'template' ? proposedInput : prepared.value, decision.facts); }
      catch (error) { return invalidActionArguments(error); }
      const { text } = prepared;
      // One accepted send per format in this turn; reviews may advance another unfinished action.
      const key = `action:${createHash('sha256').update(`${person.id}\0${scope}\0${decision.format}`).digest('hex')}`;
      if (attempt) return attempt;
      const send = async () => {
        const previous = this.hub.state.journal[key];
        if (previous && previous !== 'failed') return { status: previous === 'sent' ? 'already_submitted' : 'unknown', format: decision.format, doNotRetry: true };
        const allowed = () => this.environment.ready() && this.environment.canRespond(person) && this.environment.settings().actions.sendMessage && current();
        if (!allowed()) return { status: 'failed', reason: 'Chat actions are paused or this conversation is no longer current.' };
        if (original && this.hub.latestBooking(person)?.textId !== original.textId) return { status: 'failed', reason: 'The latest booking card has changed. Do not replace an older card.' };
        const action = this.hub.addTurn(person, 'assistant', text, 'Sending message'); action.action = original ? 'correct_booking_card' : 'send_chat_message';
        action.classification = decision; action.preview = prepared.preview; action.interactive = prepared.interactive; action.openui = prepared.openui;
        action.bookingInput = prepared.bookingInput; action.replacesMessageId = original?.textId;
        action.textState = 'Sending'; this.hub.changed();
        this.hub.state.journal[key] = 'processing';
        this.hub.state.journal = Object.fromEntries(Object.entries(this.hub.state.journal).slice(-4000));
        let dispatched = false;
        try {
          // Save intent before invoking WhatsApp; uncertain sends are never retried.
          await this.hub.store.save(this.hub.state); signal.throwIfAborted();
          if (!allowed()) throw new Error('Chat actions are paused or this conversation is no longer current.');
          dispatched = true;
          const id = await this.input.runtime.invoke<string>(prepared.method, [person.peer, prepared.value]);
          if (typeof id !== 'string' || !id) throw new Error('WhatsApp did not confirm message submission.');
          action.textId = typeof id === 'string' ? id : undefined;
          action.textState = this.hub.deliveryState(action.textId); action.state = 'Submitted';
          this.hub.state.journal[key] = 'sent';
          this.hub.remember(person, 'assistant', `Chat action result: WhatsApp accepted a ${decision.format} for this person: ${JSON.stringify(prepared.value)}`);
          // An interruption after dispatch must not erase a known successful send.
          try { await this.hub.store.save(this.hub.state); } catch (error) { this.environment.report(error); }
          if (original?.textId) {
            original.replacedByMessageId = action.textId;
            try {
              const removed = await this.input.runtime.invoke<boolean>('deleteMessage', [person.peer, original.textId, false]);
              action.previousCardRemoval = removed === true ? 'removed' : 'failed';
              original.state = removed === true ? 'Replaced' : 'Superseded; old card not removed';
            } catch (error) {
              action.previousCardRemoval = 'unknown'; original.state = 'Superseded; removal unconfirmed'; action.error = failure(error);
            }
            this.hub.remember(person, 'assistant', `Booking card correction result: corrected card submitted. Previous card removal: ${action.previousCardRemoval}. This changes the chat card only, not a reservation.`);
            correctionScript = bookingCorrectionAcknowledgement(text, prepared.interactive?.type === 'booking' ? prepared.interactive.booking.location : undefined, action.previousCardRemoval);
          }
          this.hub.changed(); return { status: 'submitted', format: decision.format, messageId: action.textId, delivery: action.textState, text, content: prepared.value,
            ...(original ? { previousCardRemoval: action.previousCardRemoval, reservationChanged: false } : {}) };
        } catch (error) {
          const unknown = dispatched && !(error && typeof error === 'object' && 'outcome' in error && error.outcome === 'not_sent');
          action.state = unknown ? 'Send outcome unknown' : signal.aborted ? 'Cancelled' : 'Failed';
          action.textState = unknown ? 'Outcome unknown' : action.state; action.error = failure(error);
          this.hub.state.journal[key] = unknown ? 'unknown' : 'failed';
          if (unknown) this.hub.remember(person, 'assistant', 'Chat action result: message submission could not be confirmed. Ask the person to check their chat; do not resend automatically.');
          this.hub.persist(); this.hub.changed();
          if (signal.aborted && !dispatched) throw error;
          return { status: unknown ? 'unknown' : 'failed', format: decision.format, reason: action.error, doNotRetry: unknown, definitelyNotSent: !unknown };
        }
      };
      attempt = send();
      const task = attempt.then(() => {}, () => {}); this.tasks.add(task);
      void task.finally(() => this.tasks.delete(task));
      return attempt;
    } };
  }
  async dispose() { await Promise.allSettled([...this.tasks]); }
}
