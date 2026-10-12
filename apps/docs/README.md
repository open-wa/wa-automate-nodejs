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

## Publishing

`.github/workflows/docs-run.yml` builds the schema and documentation, applies
feedback migrations, and deploys `openwa-docs` to `https://openwa.dev`. Changes to
the docs, their schema/client/UI sources, workspace READMEs and package manifests
on `master` trigger publication. Dependency changes also rebuild the site.

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
