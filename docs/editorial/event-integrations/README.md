# Event integration editorial drafts

These articles accompany [PR #3539](https://github.com/open-wa/wa-automate-nodejs/pull/3539) and mini epic [#3536](https://github.com/open-wa/wa-automate-nodejs/issues/3536). They are saved, unpublished EmDash drafts for the upcoming Bumpy minor release. The final release number and publication date are still pending.

The checked-in implementation guides and generated AsyncAPI reference remain in the docs app. The files here are the source copy for the CMS drafts. EmDash has Blog articles and Changelog collections, so the two practical how-to guides are Blog articles. Each editor showed **Saved** and **Draft version — This version is not visible on the site** after saving. No entry was published or scheduled.

Source/artifact generation completed during implementation. ChatGPT event discovery, callbacks and rendered reference pages have not been exercised; no tests, lint, typechecks, builds or CI checks were run.

| Source copy | Purpose | Saved CMS draft |
| --- | --- | --- |
| [watch-whatsapp-from-chatgpt.md](watch-whatsapp-from-chatgpt.md) | Set up MCP Events and choose a conversation to watch | [Let ChatGPT watch a WhatsApp conversation](https://cms.openwa.dev/_emdash/admin/content/posts/01M4WBVW2P8WENMAW6750M46GR?locale=en) |
| [read-openwa-events-with-asyncapi.md](read-openwa-events-with-asyncapi.md) | Discover exact SSE/webhook payloads and choose a delivery surface | [Read OpenWA event payloads with AsyncAPI](https://cms.openwa.dev/_emdash/admin/content/posts/01M4WC04QECZE7QHE1ANT0N5HR?locale=en) |
| [event-contracts-and-chatgpt-subscriptions.md](event-contracts-and-chatgpt-subscriptions.md) | Explain the feature's value and scope | [OpenWA event contracts and ChatGPT subscriptions](https://cms.openwa.dev/_emdash/admin/content/posts/01M4WC21PDSDM8RZ10YD8B5QZG?locale=en) |
| [changelog.md](changelog.md) | Curated release entry with protocol and delivery limits | [Event contracts and ChatGPT subscriptions](https://cms.openwa.dev/_emdash/admin/content/changelog/01M4WC9ZYPBW6GDPPCEZEWS9XV?locale=en) |

The Changelog collection requires a release version and date even for a draft. Its provisional values are `unreleased-event-integrations` and `2026-10-14T12:00` (the draft date). Replace those fields and the `unreleased-` slug with the actual Bumpy version and publication timestamp before publishing. The CMS review notes record this requirement and link the related guides.
