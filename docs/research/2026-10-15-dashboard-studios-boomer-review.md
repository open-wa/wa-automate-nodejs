# Neo studios: wireframe walkthroughs and fixes

Reviewed on 2026-10-15 in [OpenWA · Neo studios · Wireframes](https://app.paper.design/file/01M50S99VEPXBP60RFRRAPD8F0/p-1-0). The file now contains 14 editable artboards. Mohammed subsequently identified a cluttered button editor that these walkthroughs had missed; the focused correction below supersedes the earlier claim that the reviewed paths had no further visual blockers.

Three agent-led walkthrough-and-fix passes covered choosing and editing a message, making a sticker, and finishing the task on a phone or in an integration. The review used the current Paper layer structure, exported design source and Paper MCP screenshots. These are design observations, not measurements from human participants or a working dashboard. No application code was changed, no messages were sent, and no application tests, builds or typechecks were run.

## Pass 1: make a message without knowing the API

The initial screens asked people to interpret a template strip, API-shaped type tabs, a second action-family selector, and a Design/Try switch. Reply IDs appeared as inputs or unexplained identifiers. The revised entry has one visible message-type row, a clearly named selected example, and a Change example action. The button families have separate Reply buttons and Link / call / copy choices, so the editor does not ask beginners to understand the invalid mixed-action combination.

Edit and Try message now describe their purpose, and preview status says Nothing sent. Button text is an actual visible input; reply and answer keys are automatic, with customization still available. The initial review added separate Edit, Move up and Move down controls to lists. That made the controls fit, but retained unnecessary visual clutter; the focused correction below replaces that arrangement.

The form view now exposes Send message and Handle answers as separate code purposes. Copy send code, Copy reply handler and Copy handler identify what is copied. JavaScript, HTTP / cURL and Message JSON identify transport/code choices. Card-image selection has a visible Choose image action and an image-URL alternative. Booking date, start time and end time are separate controls, with an explicit time zone retained.

Intended message path: choose a message type, edit the ready-made example, optionally try it as a recipient, then copy the send code. Actual sending has a consistent Send to chat entry which opens recipient selection; trying the preview is separate from sending.

## Pass 2: make a sticker and carry it into another app

The first version began with an already-loaded photo. A new first-use artboard offers one clear Choose a photo or GIF action, a drop target, supported formats and size, and a ready-to-use sample. It does not show an empty saved-draft action or disabled editing tabs before a file is chosen.

Add-effect tiles now have explicit plus labels and neutral styling. Applied effects are a separate ordered list, so a selected catalogue tile does not imply that choosing it again removes an effect. The editing list retains selection and removal/reordering controls. Static and Animated replace the less clear Still and Motion labels. Animation settings use plain labels and describe keys/seed information in code rather than require users to edit it to get a result.

Download sticker and Copy send code now have different meanings. Download code + photo / GIF explicitly carries the source file with the generated code; this addresses the original missing-file problem created by copying a snippet containing a browser upload's filename. A View full example path leads to the complete JavaScript/HTTP example artboard, naming the included script, photo and environment example and showing the connection values that must be supplied. This represents the proposed export behavior; no runnable download bundle was implemented in this design task.

Intended sticker path: choose a photo or GIF, add and adjust effects, then download the sticker or copy/download the code with its source file. Shape, animation and optional pack/creator settings remain available without being mandatory setup steps.

## Pass 3: phone use, recovery and completion

Mobile editing and recipient simulation no longer share an ambiguous Design/Try label. The message screen uses Edit, Try message and Code, with the shown editing state correctly selected. The editable reply key is a secondary automatic detail. Preview status is text rather than a button, and one Send to a chat action provides the optional real-send entry.

The sticker phone layout uses Edit, Preview and Code. Add effect, Change photo and the labelled Up, Down and Remove controls have readable labels and larger touch targets. Copy send code remains available in the header, while sticker and code-with-photo downloads have distinct labels. The 390px layouts were re-inspected after these changes for wrapping and fit.

A new missing-button-text recovery artboard keeps the draft and highlights the exact input, explains what text is needed and shows the corresponding invalid preview element. It does not offer stale send code or an apparently usable send action while the required label is missing. Saving the draft remains available.

The complete-example artboard explicitly distinguishes copying/downloading code from running it. A second layout adjustment widened the setup column so the API address no longer wraps awkwardly in the environment example.

## Follow-up: simplify the repeated-item editor

Mohammed's screenshot identified a reply-button editor with a redundant Selected button heading, a prominent Remove action, a second Button text label, a technical reply-key sentence, two large reordering controls, and an entire red error panel. The earlier walkthroughs had treated visible controls as sufficient without judging their hierarchy or the amount of work needed to edit a label.

The normal and missing-text desktop screens now use one inline list: each button is a text input beside a drag handle and an options control. Both labels can be edited directly. Selection is shown on the input and its corresponding preview button; a missing label gets a short error directly under that input. The preview uses a neutral placeholder, and the code pane quietly explains why code is not available, avoiding repeated red warnings. The optional footer is a normal input.

The open-menu artboard shows the secondary actions: Move down for the first row, Edit reply key, and Remove button. Show Move up or Move down only when that move is possible. Dragging is an additional route rather than the only reordering mechanism. Reply-key editing opens a focused dialog with the existing key and a short explanation that it identifies the reply in code; changing button text or position must leave that key intact. These are specified behaviors, not implemented interactions.

The mobile message screen uses the same editable list with 44px drag, input and options targets. Menu-list choices adopt the same inline input pattern, and applied sticker effects replace the tiny combined arrow/remove text with a dedicated options control. Paper screenshots were inspected at component and whole-screen scale for spacing, readable text, consistent action columns and fit. This is a design correction prompted by owner feedback, not human usability acceptance or a claim that all remaining components are optimal.

## Consolidation and copy passes, 2026-10-16

The consolidation pass removed duplicate copy buttons from the code panes, replaced separate draft-save actions with automatic browser draft status, aligned Send message / Handle replies controls, and kept keys in row options. The selected button, list-choice and effect rows share the same compact control pattern. The mobile effect editor now uses that pattern with 44px controls. The header text is directly editable, and the card editor keeps its secondary actions in Card options.

The copy pass standardized Copy code, Send to chat, HTTP and JSON. It removed filler such as “make it yours,” deleted redundant instructions, and replaced review language such as “actionable error” and “promised click-response events” with direct product wording. The upload screen now names the accepted files and the next action. Library identifiers and response contracts stay in the code and optional details.

Paper screenshots of the revised desktop message and sticker screens, mobile sticker screen, upload state, form code and carousel were inspected. The carousel code footer initially clipped after the added purpose control; removing the unrelated response example from the active send view resolved that fit problem. The designs remain static and have not received human usability acceptance.

## Implementation, 2026-10-16

Tracking issue: [#3555](https://github.com/open-wa/wa-automate-nodejs/issues/3555). Implementation started in an isolated checkout and was brought into the main checkout at /Users/Mohammed/projects/tools/wa.

The source implementation adds /studio/messages and /studio/stickers to Neo's navigation. Shared components provide fields, editable/reorderable rows, options menus, responsive panels and code output. Message documents use InteractiveContentSchema; the editor covers replies, external actions, lists, questions, cards, bookings and native JSON. The sticker editor uses the package catalogue and browser renderer, with per-instance effect identity, supported job settings, original-file persistence, WebP download and source-plus-code ZIP exports. Real sending has its own recipient picker and API invocation; local choices remain simulated.

The sticker package now has a browser condition for its browser entry, a shared rendering pipeline, a job-validation export and public effect-option descriptors. Numeric controls use the same ranges as the planner; random patterns have an explicit change action. Sticker preview offers a transparent canvas and an In chat view, original comparison and a reduced-motion still frame. The browser-only dependency path excludes the Node worker backend and Node resource cache. The canvas capability probe creates its 2D context before trying WebP encoding. Schema packaging exposes the portable interactive document as its own subpath. These are source changes, not proof of package publication or runtime behavior.

The route registry was generated with TanStack's generator, the dependency lockfile was updated, and dependencies were installed from the local store without install scripts. The Neo Vite development server started on port 3004. Opening the preview through Codex returned queued, so this does not establish a browser walkthrough. In the main checkout, a frozen install encountered an existing apps/orchestrator-cli manifest/lockfile mismatch. pnpm exec then attempted an automatic workspace refresh; that was stopped and its unrelated lockfile edits were discarded. Vite was launched directly with the existing installed tooling, and the two new local workspace links were added without changing unrelated manifests. No tests, fixtures, typechecks, lint checks, builds, generated-download execution or real WhatsApp sends were performed. Browser use and recipient acceptance remain unverified; they are not claimed by the source implementation. Empty advanced JSON clears generated code, invalid action destinations remain visible when selection changes, and live sending remains separate from local preview.

## Revised artboards

1. Reply buttons: inline editable labels, drag handles and secondary options.
2. Menu list: clear choices, editing and reordering, recipient picker and simulated response.
3. Questions: choose-one/choose-several language and separate send/answer-handler code.
4. Image cards: visible image upload, URL alternative, card actions and automatic reply key.
5. Booking: date and time controls, time zone and optional management link.
6. Link / call / copy: editable action text and destinations, with simulation separated from external actions.
7. Sticker effects: clear add-versus-applied controls and distinct file/code exports.
8. Sticker animation: source range, smoothness, looping and optional pack/creator details.
9. Mobile message editing and preview.
10. Mobile sticker editing and export.
11. First use: choose a photo or GIF.
12. Recovery: missing button text.
13. Completion: download and use a complete code example.
14. Reply buttons: options menu open, showing reordering, reply-key editing and removal.

## Evidence boundary

The reviewed paths specify starting actions, defaults and recovery states, but the subsequent owner finding demonstrates that the initial agent review was insufficient. The focused correction addresses the repeated-item pattern; it does not establish that the design is the easiest possible interface or that people have successfully used it. Paper cannot establish implementation behavior such as focus/keyboard handling, file processing, persistence, generated downloads or real WhatsApp recipient interaction. The still-unshown advanced/native editor and detailed pack/shape/phone-action editors were not accepted through these walkthroughs.

Sources: the current Paper file above; the [original component/API research](/Users/Mohammed/projects/tools/wa/docs/research/2026-10-15-dashboard-visual-studios.md); and the existing [interactive contract](/Users/Mohammed/projects/tools/wa/packages/schema/src/interactive.ts) and [sticker job contract](/Users/Mohammed/projects/tools/wa/packages/stickers/src/index.d.mts), which define the capabilities the wireframes expose. The earlier Paper MCP captures and exported design source were retained in the task's temporary design workspace for this review.
