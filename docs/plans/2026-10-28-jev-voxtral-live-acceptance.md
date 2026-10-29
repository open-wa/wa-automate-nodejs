# Jev and Voxtral: one live acceptance batch

Run these eight checks once, in order. Record pass/fail and the actual result.
Fix failures and repeat the failed check plus any directly affected check;
do not restart the whole batch or add another general test campaign.

**Current state (28 October, final checkpoint):** the finite batch has run
between the two paired accounts. Standalone Jev text and combined voice-note
actions passed with receiving-side evidence. Incoming auto-answer and native
call audio were exercised; the final outgoing call exercised chat controls,
booking correction/deletion, spoken-only recall, interruption and clean hangup.
This is **not an unqualified call-audio sign-off**: a provider TLS certificate
verification error disconnected the assistant during the interruption attempt.
One manual reconnect on the same native call succeeded, and the directly failed
interaction was repeated. Do not report that reconnect as automatic recovery or
publish on the strength of a fully clean batch. No package was published.

Use the bot account ending **5810** and the phone ending **1345**.
Neo: <http://127.0.0.1:8122/dashboard/chat?chatId=YOUR_TEST_CHAT_ID&demo=false>.
All appointment times below are **London time on 29 October 2026** (GMT).
These are demo chat cards and preferences, not reservations in a booking system.

Both accounts are paired and their saved sessions have protected snapshots.
The second Easy API on port 8123 is a passive peer with no AI plugins. Run the
remaining steps through the private, fixed-recipient driver in
`.open-wa/voxtral-live/automated-batch/driver.ts`; it checks both account identities,
permits sends only between these two accounts, and provides receiving-side
message capture, voice-note download and call recording operations. Its
interactive-response and call-audio operations were exercised over WhatsApp. Native button and form
responses will be submitted from the peer account over WhatsApp with the
original message reference, rather than injected into a plugin event handler.
Android visual rendering remains a distinct observation from protocol delivery.
Do not rerun the passed memory check when credits become available.

## Round A: Jev alone

Only Jev is loaded. Voxtral is not initialized, and no speech API is involved.

| # | Check | Pass condition | Result |
| --- | --- | --- | --- |
| 1 | Text conversation and memory | Both replies arrive as text; the second recalls pineapple and seven. | Passed on 28 October; both replies observed on receiving account; classifier unavailable (402). |
| 2 | Text booking card and reply buttons | One native card shows 29 October, 8–8:30 pm and OpenWA office; separate buttons arrive; Confirm gets exactly one factual text acknowledgement. | Passed with Voxtral disabled; native receiver delivery and one text selection acknowledgement captured. |
| 3 | Text form and multiple selections | The form accepts one hour before, Tea and Water; one text reply acknowledges all three choices. | Passed with Voxtral disabled; native form response and one text acknowledgement captured. |

**1. Send these two texts, waiting for each reply:**

> Remember the word pineapple and the number seven.

> What word and number did I ask you to remember?

**2. Send this text, open View booking, then tap Confirm:**

> Send me a booking card for a demo appointment on 29 October 2026 at 8 pm London time, lasting 30 minutes, at the OpenWA office, and separate Confirm or Reschedule reply buttons.

**3. Send this text, choose one hour before, tick Tea and Water, then submit:**

> Send me a form with a reminder choice of one hour or one day before, and two separate drink checkboxes: Tea and Water.

## Round B: Jev and Voxtral together

After checks 1–3, enable Voxtral once with both calls and voice notes, keeping
Jev enabled. Protect the session checkpoint before restarting. Conversation
context clears on restart, so send this single text to seed Round B:

> Remember pineapple and seven. My reminder preference is one hour before, and I want both tea and water.

The seed must receive one text reply. Typed chat must not receive a duplicate
voice reply when both plugins are loaded.

| # | Check | Pass condition | Result |
| --- | --- | --- | --- |
| 4 | Voice-note conversation uses text context | One clear, playable voice reply recalls pineapple, seven, one hour, tea and water. | Received Ogg decrypted, decoded and transcribed with all five facts. Automated evidence does not establish perceived sound quality. |
| 5 | Voice-note booking, buttons and form | Exactly one of each requested interactive message arrives; the card has the right date/time/location; Confirm and form submission each get one clear voice acknowledgement. | Native messages and one received, decoded voice acknowledgement per selection verified. |
| 6 | Incoming call, shared context and correction | Auto-answer works with clear two-way audio; it recalls the form choices; the corrected 2–2:30 pm card replaces the 8 pm card sent in this call, and that superseded card is deleted. | Incoming auto-answer/audio and earlier correction observed. The final exact 8 pm → 2 pm correction, preserved facts, receiver deletion and spoken-only follow-up passed on the outgoing call. These are separate observations, not one clean incoming scenario. |
| 7 | In-call button/form replies and interruption | Choices are acknowledged through call audio without separate voice notes; a 20-second answer is smooth, interruption stops it, and the new question is answered. | Buttons and form each got one live-audio acknowledgement and no PTT. Barge-in assertion passed after one manual reconnect following a provider TLS error; the new answer recalled Tea/Water but also included prior appointment/preparation details. Smoothness has not been human-verified for this final build. |
| 8 | Outgoing call and cleanup | Neo starts a real incoming call on the phone; conversation is clear and recalls 2 pm; hangup leaves Neo idle with no audio error. | Dashboard control started a real peer call; accepted, recorded, recalled 2 pm with no new card; hangup verified terminal, Call ended, zero queued/processing and no audio error. The same call needed the TLS recovery described above. |

**4. Send this voice note:**

> What word and number did I ask you to remember, and what reminder time and drinks did I choose?

**5. Send this voice note:**

> Send me a booking card for a demo appointment on 29 October 2026 at 8 pm London time, lasting 30 minutes, at the OpenWA office. Also send separate Confirm or Reschedule reply buttons, and a form with a reminder choice of one hour or one day before and two separate drink checkboxes: Tea and Water.

Wait for the initial voice acknowledgement, tap Confirm, and wait for its voice
acknowledgement. Then submit the form with one hour, Tea and Water and listen
for one acknowledgement of those three choices.

**6. Call 5810 from 1345. Keep the call open through check 7. Say:**

> What reminder time and drinks did I choose?

> Send a new booking card for a demo appointment on 29 October 2026 at 8 pm London time, lasting 30 minutes, at the OpenWA office.

After that card arrives:

> No, I said 2 pm.

Check the corrected card and deletion of its immediate predecessor. Then ask:

> What time is the appointment?

It should answer aloud without sending another card.

**7. In the same call, say:**

> Send separate Confirm or Reschedule reply buttons, and a form with a reminder choice of one hour or one day before and two separate drink checkboxes: Tea and Water.

Tap Confirm and submit one hour, Tea and Water. Listen for each acknowledgement
in the call. Then ask for a description of the appointment lasting about 20
seconds. While it is speaking, interrupt:

> Stop—what drinks did I choose?

Listen for the new answer and hang up.

**8. Start Call with Voxtral in the normal Neo Chat view.** Answer on 1345, ask
what time the appointment is, exchange a short follow-up, then hang up. Check
that Neo shows the call ended and the assistant is no longer speaking.

## Completion

Record the eight results here and retain the relevant conversation/action/call
receipts. A runtime submission alone does not establish phone delivery or sound
quality. Publish only after this batch has passed; no additional broad test run
is part of this checklist.

## Final evidence and remaining limits

Private receipts are in `.open-wa/voxtral-live/automated-batch/` (gitignored).
The final sequence is `call-start-outgoing-1793228587531.json`,
`confirm--1793228656531.json`, `form--1793228696223.json`,
`call-say-booking-1793228717630.json`,
`call-say-correction-1793228751974.json`,
`outgoing-final-correction-receipts.json`,
`call-say-time-1793228791619.json`, `barge-in--1793228901960.json`,
`call-end--1793228918039.json` and `outgoing-final-cleanup.json`.
The actual received PCM recording is `final-call-outgoing-received.wav`.
`outgoing-final-interruption-failure.json` preserves the TLS failure and
`outgoing-reconnect-after-provider-tls.json` preserves the manual recovery.
Do not replay the whole batch to address those limits; repeat only the directly
affected response-failure/recovery or interruption check after its fix.

## Release follow-up

The answer-failure fix now keeps the transcription socket open, reports the
failed answer, and permits a new caller turn without reconnecting or replaying
an action. The focused WebSocket regression was observed failing before the fix
and passing afterward; the directly affected recovery/interruption checks passed
(4 tests, 16 assertions). Existing client fixtures were updated for the current
transport-owned session finalization/logout contract (23 client tests passed).

The initial latest-turn instruction alone did not stop the answer model from
appending old preparation advice. Jev response review now evaluates the whole
reply against the latest request, including abandoned explanations. A real Jev
provider check rejected the captured stale continuation with probability 1 and
accepted the concise drinks-only reply with probability 1. This provider check
is distinct from a new physical-call listening result; no claim of perfect ASR
or human-verified sound quality is made for this build. Receiver recordings and
prior call interaction receipts remain the native transport evidence.

The protected runtime was uploaded and selected in production, and the live
license endpoint returned that release. Public packages are prepared as 5.10.0;
registry publication and editorial publication must be recorded separately.

The follow-up ran the real standalone ActionAgent, Jev and Mistral against the
captured interruption history, with WhatsApp sends forbidden. Jev rejected the
old continuation, Mistral returned exactly “You chose tea and water.”, and Jev
accepted that repaired answer. Receipt: `release-interruption-answer.json`.
The focused client typecheck also passes after deriving collector emitter types
from the domain constructor/function signatures, avoiding duplicate ESM/CJS
private-class identities. Aggregate release 5.10.0 prepares the first Jev
package as 5.7.0; inspect each registry version separately.
