# Event integration editorial copy

These articles accompany [PR #3539](https://github.com/open-wa/wa-automate-nodejs/pull/3539) and mini epic [#3536](https://github.com/open-wa/wa-automate-nodejs/issues/3536). The four event-integration entries were initially published in EmDash on 14 October 2026 as previews. Their source copies now describe OpenWA 5.6.0; the release editions are published alongside the package release.

The checked-in implementation guides and generated AsyncAPI reference remain in the docs app. The files here are the source copy for the CMS entries. EmDash has Blog articles and Changelog collections, so the two practical how-to guides are Blog articles. Each editor showed **Live version — Visitors see this published version** after publication. The initial preview copy identified the features as upcoming. The release edition uses the assigned package version and the combined 5.6 release notes.

Source/artifact generation completed during implementation. ChatGPT event discovery, callbacks and rendered reference pages have not been exercised; no tests, lint, typechecks, builds or CI checks were run.

| Source copy | Purpose | Published CMS entry |
| --- | --- | --- |
| [watch-whatsapp-from-chatgpt.md](watch-whatsapp-from-chatgpt.md) | Set up MCP Events and choose a conversation to watch | [Let ChatGPT watch a WhatsApp conversation](https://cms.openwa.dev/_emdash/admin/content/posts/01M4WBVW2P8WENMAW6750M46GR?locale=en) |
| [read-openwa-events-with-asyncapi.md](read-openwa-events-with-asyncapi.md) | Discover exact SSE/webhook payloads and choose a delivery surface | [Read OpenWA event payloads with AsyncAPI](https://cms.openwa.dev/_emdash/admin/content/posts/01M4WC04QECZE7QHE1ANT0N5HR?locale=en) |
| [event-contracts-and-chatgpt-subscriptions.md](event-contracts-and-chatgpt-subscriptions.md) | Explain the feature's value and scope | [OpenWA event contracts and ChatGPT subscriptions](https://cms.openwa.dev/_emdash/admin/content/posts/01M4WC21PDSDM8RZ10YD8B5QZG?locale=en) |
| [changelog.md](changelog.md) | Curated release preview with protocol and delivery limits | [Upcoming: Event contracts and ChatGPT subscriptions](https://cms.openwa.dev/_emdash/admin/content/changelog/01M4WC9ZYPBW6GDPPCEZEWS9XV?locale=en) |

The Changelog collection requires a release version and date. Its preview used `unreleased-event-integrations` and a provisional date; publish the release edition with version/slug `5.6.0` and the actual release date. The CMS review notes distinguish source checks from live ChatGPT delivery.

The [HyperEmitter article](../../blog/2026-10-14-effect-hyperemitter.md) is prepared in [its CMS editor](https://cms.openwa.dev/_emdash/admin/content/posts/01M4WKR1P36RDVX6S8JDHNQ4C2?locale=en). It accompanies the [Effect event guide](https://openwa.dev/docs/guides/effect-event-streams) and [emitter reference](https://openwa.dev/docs/reference/hyperemitter).
