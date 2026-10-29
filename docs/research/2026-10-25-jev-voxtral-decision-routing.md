# Jev decision routing for Voxtral chat actions

Read on 25 October 2026. This is a source review and a proposal, not runtime evidence. No tests, checks, dependencies, paid inference, or application changes were run for this research.

Keep the current division: Jev decides among bounded alternatives, Mistral supplies genuinely open wording, and the host owns state changes and time calculations. The useful next step is to make corrections a set of explicit, host-enforced field changes instead of relying on the argument generator to preserve unchanged facts.

## What the examples actually demonstrate

The [cookbooks index](https://docs.typesafe.ai/cookbooks) separates routing, extraction, and generation concerns. The [function-calling recipe](https://docs.typesafe.ai/cookbooks/function_calling) maps function names and closed-set arguments to Choice, booleans and set membership to Noul, and optional arguments to a separate `stated` Noul. One request asks about all functions and their arguments; dispatch reads only the selected function's answers. Unconstrained integers, free text, and dates are deliberately left at their function defaults, so this recipe does not establish arbitrary JSON argument generation by Jev.

[Speculative fan-out](https://docs.typesafe.ai/patterns/fan-out) means asking potentially relevant questions together, then ignoring irrelevant answers in code. It usually avoids additional round trips, but additional questions still consume tokens. Crucially, [all questions independently see the same state](https://docs.typesafe.ai/concepts/state): a question cannot consume another question's answer in that request. Candidate values must already exist in state, or require a later request.

The selected [ten-levels-of-jev](https://github.com/disler/ten-levels-of-jev/tree/777adaf47d37ae0553220d35b2f15b3a3a063305) source supports this split:

- [Level 2 support triage](https://github.com/disler/ten-levels-of-jev/blob/777adaf47d37ae0553220d35b2f15b3a3a063305/apps/ten-levels/src/levels/level02/support-triage.ts) batches category and priority, then maps category to a host route.
- [Level 4 account actions](https://github.com/disler/ten-levels-of-jev/blob/777adaf47d37ae0553220d35b2f15b3a3a063305/apps/ten-levels/src/levels/level04/account-actions.ts) applies example confidence thresholds in code; its human-confirmation behavior is an application policy, not a Jev requirement.
- [Level 5 intent routing](https://github.com/disler/ten-levels-of-jev/blob/777adaf47d37ae0553220d35b2f15b3a3a063305/apps/ten-levels/src/levels/level05/intent-router.ts) batches intent and reasoning demand; a lookup route bypasses the generative model.
- [Level 10 ask](https://github.com/disler/ten-levels-of-jev/blob/777adaf47d37ae0553220d35b2f15b3a3a063305/apps/ten-levels/src/levels/level10/ask.ts) validates agent-authored question JSON, while [state assembly](https://github.com/disler/ten-levels-of-jev/blob/777adaf47d37ae0553220d35b2f15b3a3a063305/apps/ten-levels/src/levels/level10/assemble.ts) reads explicit inputs and rejects oversized state rather than silently truncating it. This is a general coding-agent facility, not a reason to let a booking assistant invent its own action contract.

## Current local implementation

[`jev.ts`](../../integrations/jev/src/jev.ts) already chooses one of nine action formats, filters unavailable actions, supplies recent conversation plus the latest booking, and validates the returned distribution. It returns confidence but discards probabilities; one long Choice instruction currently combines intent, missing-fact checks, conversational continuity, selection handling, and correction precedence.

[`provider.ts`](../../integrations/jev/src/provider.ts) exposes only the selected tool, requires it on the first tool-bearing round, disables parallel calls, and allows argument repair. [`actions.ts`](../../integrations/jev/src/actions.ts) accepts a partial correction and merges every supplied field over the previous booking. That preserves omitted fields, but cannot prevent a generator from supplying an unintended change to an unrelated field. Schema validity proves shape, not conversational provenance.

[`service.ts`](../../integrations/voxtral/src/service.ts) selects the latest submitted own booking, checks it is still current, journals one action per turn, submits the replacement, then attempts to remove its predecessor. Selection acknowledgements and successful correction acknowledgements are deterministic; ordinary action-result speech still goes through Mistral. These are chat-card operations, not reservation-system changes.

## Proposed improvements

1. **Batch literal decisions and enforce their results.** Keep the action Choice, and add narrow questions for which booking fields the latest request actually corrects. Scope these to the latest utterance; `latestBooking` supplies unchanged facts, not evidence that the user changed them. Code should accept only fields supported by those decisions and preserve everything else, even if Mistral supplies extra fields. For “No, I said 2 pm,” the permitted patch is `time: 14:00`; the date and destination stay host-owned. This adapts the cookbook's `stated` distinction without adding repeated confirmation.

2. **Select supplied spans where exact values matter.** The [pre-parsed extraction recipe](https://docs.typesafe.ai/cookbooks/pre_parsed_value_extraction_cookbook) finds candidate spans in code, asks Jev which has the requested role, then copies and normalizes that exact span. Apply this to recognizable phone numbers, URLs, references, and time expressions, with an explicit absent outcome. Candidate generation must preserve source text and turn identity; a candidate selected from an inaccurate transcript can still be wrong. Unknown prose such as a new location may still need generative extraction, constrained by the correction mask.

3. **Resolve relative dates once in code.** The [date cookbook](https://docs.typesafe.ai/cookbooks/date_extraction_cookbook) asks for date shape and named components, then performs calendar arithmetic in code. Capture one reference instant per turn and resolve “tomorrow” in the agreed booking timezone; define weekday semantics explicitly and clarify genuinely unresolved interpretations. The existing [`booking.ts`](../../integrations/jev/src/booking.ts) already handles civil-time conversion, nonexistent/repeated DST times, and explicit offsets, but Mistral currently supplies the absolute date. Preserve that converter and move relative-date arithmetic before it.

4. **Keep uncertainty separate from correctness.** [Choice confidence](https://docs.typesafe.ai/confidence) is derived from the top probability and option count: `(pmax - 1/n) / (1 - 1/n)`. It is not independent evidence that the transcript, generated arguments, or resulting booking is correct. Retain per-question distributions and source spans for diagnosis; do not copy example thresholds into a new approval policy. TypeSafe's [Jev 1.13 limitations](https://docs.typesafe.ai/model-jaggedness/jev-1.13) explicitly favor literal questions, filtered state, code-owned arithmetic, and generative models for text generation. Those limits support smaller decisions and deterministic application rather than a larger all-purpose prompt.

## Implementation follow-up

The decision loop now lives in the sibling `@open-wa/integration-jev` package.
Its `agent` entry contains the channel-independent router, argument preparation,
Mistral chat provider and shared conversation hub; Voxtral imports that engine
and keeps audio transcription, synthesis and call transport. Configuring the Jev
plugin enables ordinary text conversations. The turn loop also asks independent intent/readiness questions for each message
format and retains unfinished formats until their send outcome is known.
Automated and real-provider checks have exercised the standalone and combined
paths with intercepted WhatsApp sends. Fresh phone delivery and call-audio
acceptance remain pending; these changes are not published.
