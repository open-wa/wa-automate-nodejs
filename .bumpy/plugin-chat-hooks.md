---
"@open-wa/config": minor
"@open-wa/core": minor
"@open-wa/wa-automate": patch
---
Add host hooks before plugin event handlers and action dispatch. Use hooks.chatFilter.allow to restrict named callbacks, catch-all callbacks, direct subscriptions, messages, interactive replies and calls to explicit chat IDs. Validate scope in SDK and Easy API mode, retain it on bound call methods, and reject unknown operations under a chat restriction. Replace the unused messagePreprocessor and preprocFilter options with hooks.

Forward existing patch-cache and patch-source configuration through the Easy API launcher so cached runtime patches remain usable during a download outage.
