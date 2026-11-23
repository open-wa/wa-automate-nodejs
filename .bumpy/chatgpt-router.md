---
"@open-wa/mcp": minor
"@open-wa/config": minor
"@open-wa/wa-automate": minor
"@open-wa/cli": patch
"@open-wa/api": patch
---

✨ ChatGPT and other OAuth-only MCP clients can now connect: the MCP endpoint is its own OAuth 2.1 server. The owner approves each client with a one-time code that open-wa delivers to its log, a signed `mcp.oauth.approval_requested` webhook, or the account's own "Message yourself" chat (`mcp.oauth.approvalCode`). The Easy API key still works as a second way in.
✨ New MCP tools let an assistant run a conversation: `media.getForMessage` returns photos and voice notes as image and audio content, `messages.sendAttachment` sends a file the client holds, and `automation.getStatus`, `automation.pause` and `automation.resume` control a chat.
✨ When someone replies from the WhatsApp app, message events for that chat pause for `mcp.events.operatorPauseMs` (30 minutes by default), so an assistant doesn't talk over a person.
✨ `--router` (`router: true`) connects a licensed session to the open-wa router and prints a public HTTPS address for it, with no tunnel or open port. `--mcp` turns on the MCP endpoint.
🐛 `npx @open-wa/wa-automate --proxy-host` now starts the session proxy tunnel; before, only `@open-wa/cli` did. The tunnel streams requests and responses, so event streams and large media pass through, and it no longer connects without an API key.
