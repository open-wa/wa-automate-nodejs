# Simplified Technical English Style

Use ASD-STE100 Simplified Technical English for all public open-wa documentation.

## Scope

Apply this guide to the root README, the docs site, and workspace README files. Keep exact commands, code, API names, error messages, and product names unchanged.

The docs generator copies workspace README files into the docs site. Change the source README, then run `pnpm --filter docs workspace-docs`.

The schema generator creates the client reference. Change the schema source or generator, then run `pnpm --filter @open-wa/schema generate`.

## Rules

- Use approved STE words when they express the correct meaning.
- Use a technical name for an API, protocol, package, product, or domain concept.
- Use one term for one concept. Do not change between synonyms.
- Use American English spelling.
- Use active voice. Use passive voice in a description only if the agent is unknown or unimportant.
- Use the imperative form for an instruction.
- Put one action in each instruction sentence.
- Use a maximum of 20 words in an instruction sentence.
- Use a maximum of 25 words in a description sentence.
- Keep one topic in each paragraph. Use a maximum of six sentences in a paragraph.
- Do not use contractions.
- Do not use semicolons.
- Put a condition before its result.
- In a warning or caution, identify the risk and tell the user how to prevent it.

## Technical terms

Open-wa code identifiers and product terms are technical names. Put code identifiers in backticks and use the spelling from the source.

Examples include `sessionId`, `core.started`, Easy API, MCP, SSE, Hono, Docker, Chatwoot, Cloudflare, Node-RED, WhatsApp, and open-wa.

Use a technical verb only when the controlled vocabulary cannot express the action accurately. Common open-wa technical verbs include authenticate, configure, decrypt, deploy, emit, serialize, and upload.

## Validation

Run this command before you submit a documentation change:

```bash
node apps/docs/scripts/check-ste.mjs
```

The checker tests objective writing rules. A reviewer must also check technical accuracy, active voice, one term for one concept, and correct technical terms.
