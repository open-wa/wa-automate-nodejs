# docs

Fumadocs and TanStack Start documentation site for the open-wa v5 monorepo.

Part of the [@open-wa v5 monorepo](https://github.com/open-wa/wa-automate-nodejs).

## Development

- `pnpm --filter docs dev`
- `pnpm --filter docs build`
- `pnpm --filter docs start`
- `pnpm --filter docs types`
- `pnpm --filter docs check`
- `pnpm --filter docs lint`
- `pnpm --filter docs workspace-docs`
- `pnpm --filter docs format`
- `pnpm --filter docs copy`
- `pnpm --filter docs openapi`

## Documentation

See the [docs site](https://openwa.dev).

## Blog and changelog code examples

EmDash content uses Markdown, not executable MDX. The shared editorial renderer
uses Fumadocs `DynamicCodeBlock` for highlighting and copy buttons, and
`CodeBlockTabs` for adjacent fences with `tab` metadata. Use `title` for the
filename, runtime, or command label:

````md
```ts tab="SDK · TypeScript" tab-group="openwa-api-examples" title="Node.js SDK"
const id = await client.sendText('447700900123@c.us', 'Hello');
```

```bash tab="Easy API · cURL" title="HTTP request"
curl --fail-with-body "$OPENWA_API_URL/api/messages/sendText" \
  -H "X-API-Key: $OPENWA_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"to":"447700900123@c.us","content":"Hello"}'
```

```js tab="Easy API · JavaScript" title="Node.js fetch"
// Complete JavaScript HTTP example.
```

```python tab="Easy API · Python" title="Python · requests"
# Complete Python HTTP example.
```
````

Keep the fences adjacent, with only blank lines between them. Use the same four
labels for API examples: `tab-group` remembers the reader's choice across those
examples. For a different set of tabs, choose a different group ID or omit it.
Single fences also support `title` and have copy controls.

Each feature article must explain Easy API startup, pairing, API-key headers,
and the canonical route and named JSON fields from the shipped schema. HTTP
method results use `{ success, data }`; host controls such as session refresh
have their own response shape. Document event-stream topics and envelope fields
for listeners. State which machine owns file paths, and provide working HTTP
examples rather than serializing SDK methods or streams. Use standalone terminal
examples for operations that have no HTTP equivalent.

## Publishing

`.github/workflows/docs-run.yml` builds the schema and documentation, applies
feedback migrations, and deploys `openwa-docs` to `https://openwa.dev`. Changes to
the docs, their schema/client/UI sources, workspace READMEs and package manifests
on `master` trigger publication. Dependency changes also rebuild the site.
The Bumpy release workflow explicitly dispatches the same deployment from
`release`, so versioned API contracts publish after the package release too.

The job uses the GitHub `Docs` environment's `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` secrets. The deployment token is account-owned, with
Individual Workers Editor access to `openwa-docs` and D1 Write permission for
feedback migrations. It does not require access to other Workers or DNS.

To republish the current source without publishing npm packages:

```sh
gh workflow run docs-run.yml --repo open-wa/wa-automate-nodejs --ref master
```

Successful package publication and successful documentation deployment are
separate outcomes. Inspect the docs workflow's Cloudflare deployment step when
the live site is stale.

## License

[H-DNH 1.1](https://github.com/open-wa/wa-automate-nodejs/blob/master/LICENSE.md) - Hippocratic + Do Not Harm
