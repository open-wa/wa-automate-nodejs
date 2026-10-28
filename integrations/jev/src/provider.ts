import type { AgentSettings as Settings } from './config';
import { actionInstructions, actionResultAcknowledgement, type AgentActions, type ToolCall } from './actions';

export type ChatTurn = { role: 'user' | 'assistant'; content: string; id?: string; at?: number };
export type ProviderUsage = { audioSeconds?: number; speechCharacters?: number; inputTokens?: number; outputTokens?: number };
type Json = Record<string, any>;
type CompletionMessage = { role: string; content: string | null; tool_calls?: ToolCall[]; tool_call_id?: string; name?: string };

/** Decode SSE across arbitrary network boundaries, including multi-line data. */
export async function* readEvents(response: Response): AsyncGenerator<{ event: string; data: Json }> {
  if (!response.body) throw new Error('Mistral returned no response stream.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      buffer = (buffer + decoder.decode(value, { stream: !done })).replace(/\r\n/g, '\n');
      if (buffer.length > 2_000_000) throw new Error('Mistral sent an oversized streaming event.');
      let boundary: number;
      while ((boundary = buffer.indexOf('\n\n')) >= 0) {
        const block = buffer.slice(0, boundary); buffer = buffer.slice(boundary + 2);
        const data = block.split('\n').filter(line => line.startsWith('data:')).map(line => line.slice(5).trimStart()).join('\n');
        if (data === '[DONE]') return;
        if (!data) continue;
        const event = block.split('\n').find(line => line.startsWith('event:'))?.slice(6).trim() ?? 'message';
        const parsed = JSON.parse(data);
        if (parsed.error) throw new Error('Mistral reported an error in the response stream.');
        yield { event, data: parsed };
      }
      if (done) break;
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

export class MistralChatProvider {
  constructor(protected key: () => string | undefined, protected record: (usage: ProviderUsage) => void) {}

  protected async request(path: string, body: object | FormData | undefined, signal: AbortSignal): Promise<Response> {
    const key = this.key();
    if (!key) throw new Error('Set MISTRAL_API_KEY on the Easy API host to enable the assistant.');
    const multipart = body instanceof FormData;
    const response = await fetch(`https://api.mistral.ai/v1${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${key}`, ...(!multipart && body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? multipart ? body : JSON.stringify(body) : undefined,
      signal: AbortSignal.any([signal, AbortSignal.timeout(90_000)]),
    });
    if (!response.ok) {
      await response.body?.cancel();
      const reason = response.status === 401 || response.status === 403 ? 'Check the API key and model access.'
        : response.status === 429 && response.headers.get('x-ratelimit-limit-req-minute') === '0'
          ? 'No requests are enabled for the selected model. Choose a model with available quota in agent.model, or enable its quota in your Mistral account.'
        : response.status === 429 ? 'Your Mistral account has reached a usage limit.' : 'Check the selected model and settings.';
      throw new Error(`Mistral returned HTTP ${response.status}. ${reason}`);
    }
    return response;
  }

  private chatRequest(turns: CompletionMessage[], settings: Settings, stream: boolean, actions?: AgentActions, allowTools = true, requireAction = false) {
    const lines = Array.isArray(settings.agent.instructions) ? settings.agent.instructions : [settings.agent.instructions];
    const instructions = lines.map(line => line.trim()).filter(Boolean).join('\n');
    return { model: settings.agent.model, max_tokens: actions ? 1024 : 512, stream,
      messages: [{ role: 'system', content: `${instructions}\n\nAnswer the latest user turn. When the person interrupts or changes the question, answer that new question briefly. Do not resume the interrupted explanation or append its remaining details unless they ask you to continue.\n\n${actionInstructions}\n${actions?.instructions ?? 'No chat action tools are available in this turn. Do not claim to send a message or complete a booking without a successful tool result.'}` }, ...turns],
      ...(allowTools && actions?.tools.length ? { tools: actions.tools,
        tool_choice: requireAction ? { type: 'function', function: { name: actions.tools[0].function.name } } : 'auto',
        parallel_tool_calls: false } : {}) };
  }
  private tokenUsage(usage?: Json) {
    if (usage) this.record({ inputTokens: usage.prompt_tokens, outputTokens: usage.completion_tokens });
  }
  async answer(turns: ChatTurn[], settings: Settings, signal: AbortSignal, actions?: AgentActions): Promise<string> {
    let answer = '';
    for await (const text of this.complete(turns, settings, signal, false, actions)) answer += text;
    return answer.trim();
  }
  async *answerStream(turns: ChatTurn[], settings: Settings, signal: AbortSignal, actions?: AgentActions): AsyncGenerator<string> {
    yield* this.complete(turns, settings, signal, true, actions);
  }
  private async *complete(turns: ChatTurn[], settings: Settings, signal: AbortSignal, stream: boolean, actions?: AgentActions): AsyncGenerator<string> {
    signal.throwIfAborted();
    const results: Array<{ tool: string; result: unknown }> = [];
    let requestedAction = Boolean(actions?.tools.length);
    if (actions?.acknowledgement) {
      const acknowledgement = actions.acknowledgement;
      const reviewed = await actions.review?.({ phase: 'reply', reply: acknowledgement, results }, signal);
      if (!reviewed || reviewed.accept) { yield acknowledgement; return; }
      actions = reviewed.actions;
    }
    const messages: CompletionMessage[] = turns.map(({ role, content }) => ({ role, content }));
    // A turn can request several formats. Give each format a bounded repair
    // allowance instead of making all of them share a single-action budget.
    const actionRounds = 5 * Math.max(1, actions?.decision?.requestedFormats.length ?? 1);
    for (let round = 0; round <= actionRounds; round++) {
      signal.throwIfAborted();
      // The final round must explain the results instead of requesting more work.
      requestedAction ||= Boolean(actions?.tools.length);
      const available = round < actionRounds && actions?.tools.length ? actions : undefined;
      // Jev already selected a ready-to-send action. Do not ask the answer model
      // to make that decision again; later rounds may repair arguments or explain results.
      const body = this.chatRequest(messages, settings, stream, actions, Boolean(available), actions?.decision ? actions.decision.nextStep === 'act' : round === 0);
      if (actions?.tools.length && !available) body.messages[0].content += '\nNo more actions can be requested in this turn. Explain the results already returned.';
      const response = await this.request('/chat/completions', body, signal);
      let content = '', finishReason: string | undefined;
      const pending = new Map<number, ToolCall>();
      if (stream) {
        for await (const { data } of readEvents(response)) {
          this.tokenUsage(data.usage);
          const choice = data.choices?.[0];
          if (choice?.finish_reason) finishReason = choice.finish_reason;
          const delta = choice?.delta;
          if (typeof delta?.content === 'string') {
            content += delta.content;
            // Hold tool-bearing rounds until their actions have actually settled.
            if (!available && !actions?.review) yield delta.content;
          }
          for (const part of delta?.tool_calls ?? []) {
            const index = part.index === undefined ? 0 : part.index;
            if (!Number.isInteger(index) || index < 0 || index > 7) throw new Error('Mistral returned an invalid chat action.');
            const call = pending.get(index) ?? { id: '', type: 'function', function: { name: '', arguments: '' } };
            if (part.id) call.id = part.id;
            if (typeof part.function?.name === 'string' && part.function.name !== call.function.name) call.function.name += part.function.name;
            if (typeof part.function?.arguments === 'string') call.function.arguments += part.function.arguments;
            else if (part.function?.arguments && typeof part.function.arguments === 'object' && !Array.isArray(part.function.arguments)) {
              if (call.function.arguments) throw new Error('Mistral returned conflicting chat action arguments.');
              call.function.arguments = JSON.stringify(part.function.arguments);
            }
            if (call.function.arguments.length > 32_000) throw new Error('The requested chat message is too large.');
            pending.set(index, call);
          }
        }
      } else {
        const result = await response.json() as Json;
        this.tokenUsage(result.usage);
        const choice = result.choices?.[0]; finishReason = choice?.finish_reason;
        const message = choice?.message;
        content = typeof message?.content === 'string' ? message.content : '';
        for (const [index, call] of (message?.tool_calls ?? []).entries()) {
          const args = call.function?.arguments;
          pending.set(index, { id: call.id ?? '', type: call.type ?? 'function', function: {
            name: call.function?.name ?? '',
            arguments: typeof args === 'string' ? args : JSON.stringify(args) ?? '',
          } });
        }
      }
      signal.throwIfAborted();
      if (!pending.size) {
        if (!content.trim()) throw new Error('Mistral did not return an answer.');
        const reviewed = await actions?.review?.({ phase: 'reply', reply: content, results }, signal);
        signal.throwIfAborted();
        if (reviewed && !reviewed.accept) { actions = reviewed.actions; continue; }
        if (!stream || available || actions?.review) yield content;
        return;
      }
      // Do not turn an exhausted tool budget into a failed voice/call turn.
      // The host summary below preserves successful sends and unfinished work.
      if (!available) break;
      if (!['tool_calls', 'stop'].includes(finishReason ?? '')) throw new Error('Mistral could not complete the requested chat action.');
      const calls = [...pending.values()];
      if (calls.some(call => !call.id || call.type !== 'function' || typeof call.function?.arguments !== 'string')) throw new Error('Mistral returned an incomplete chat action.');
      messages.push({ role: 'assistant', content: content || null, tool_calls: calls });
      let acknowledgement: string | undefined;
      for (const call of calls) {
        signal.throwIfAborted();
        const result = calls.length === 1 ? await available.execute(call, signal) : { status: 'failed', reason: 'Request one chat message at a time.' };
        messages.push({ role: 'tool', tool_call_id: call.id, name: call.function.name, content: JSON.stringify(result) });
        results.push({ tool: call.function.name, result });
        acknowledgement = available.acknowledgeResult?.(result);
      }
      const reviewed = await available.review?.({ phase: 'result', results }, signal);
      signal.throwIfAborted();
      if (reviewed) actions = reviewed.actions;
      if (acknowledgement && actions?.decision?.nextStep !== 'act') {
        const checked = await actions?.review?.({ phase: 'reply', reply: acknowledgement, results }, signal);
        signal.throwIfAborted();
        if (!checked || checked.accept) { yield acknowledgement; return; }
        actions = checked.actions;
      }
    }
    signal.throwIfAborted();
    // Exhausted repair rounds must not disconnect the call or erase known success.
    const consequential = results.map(({ result }) => result).filter(result => result && typeof result === 'object' && 'status' in result && ['submitted', 'already_submitted', 'unknown'].includes(String(result.status)));
    const acknowledgement = actionResultAcknowledgement(consequential);
    yield acknowledgement ? `${acknowledgement}${actions?.decision?.nextStep === 'act' ? " I haven't finished the remaining actions yet." : ''}`
      : requestedAction ? "I couldn't complete the requested chat action. We can continue with what's missing." : "I couldn't complete that response. Please rephrase your request.";
  }
}
