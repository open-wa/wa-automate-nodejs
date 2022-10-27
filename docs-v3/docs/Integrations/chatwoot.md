---
title: Chatwoot integrations
description: ready made integration for chatwoot.
---

you can directly integrate open-wa/wa-automate directly using the easy-api or docker

- before you start you need to have below details from chatwoot

    | item | description  | example  |
    | ------------ | ------------ | ------------ |
    | chatwoot API URL |it can be self-hosted or chatwoot hosted    |for self-hosted `http://localhost:3000`  and can be` https://app.chatwoot.com/platform/api/v1` for chatwoot hosted|
    |chatwoot access token   | you can get it at the end of your chatwoot profile page | for example `5lUC0KdzAl8iZO5aLsZHdx0i9rRix6qd` |
    |`optional` full chatwoot API URL | if you want to use an existing chatwoot inbox | the URL will look like this `https://app.chatwoot.com/accounts/[account id]/inboxes/[inbox id]`  |

- if you want easy-api to automatically generate chatwoot inbox and configure it

    `npx @open-wa/wa-automate -p [port number]  -k "your easy-api API Key" --verbose  --force-update-cw-webhook --chatwoot-url "https://app.chatwoot.com/platform/api/v1" --chatwoot-api-access-token "your chatwoot access token"`

- if you wan't to use and already generated inbox which was created using the above command then you need to provide the full chatwoot API URL which has the account ID and inbox id details.

    `npx @open-wa/wa-automate -p [port number]  -k "your easy-api API Key" --verbose  --force-update-cw-webhook --chatwoot-url "https://app.chatwoot.com/accounts/[account id]/inboxes/[inbox id]" --chatwoot-api-access-token "your chatwoot access token"`


