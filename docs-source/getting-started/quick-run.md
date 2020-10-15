# Zero Install Quick API

Ever wanted to create an API out of your WA number? You're in luck! 

Open the terminal, and enter this:

```bash
> npx @open-wa/wa-automate
```

> P.S you have to make sure you have `node`, `npm`, and `npx` installed on your system.

When you run the code, it will also give you a URL to an API explorer where you can play around with the various API endpoints with documentation.

You can see all the help text like so:

```bash
> npx @open-wa/wa-automate --help
```

You can set a custom port:

```bash
> npx @open-wa/wa-automate -p 8080
```

and an api key which will prevent unauthorized requrests. This will result in a key being automatically generated for you:

```bash
> npx @open-wa/wa-automate -p 8080 -k
```

or you can set your own, I got the following secure key from [https://randomkeygen.com/](https://randomkeygen.com/):

```bash
> npx @open-wa/wa-automate -p 8080 -k 'K6MEQJRV3trXMPZ5eQd1Jl8NaaaRZxqy'
```

You can easily force the program to maintain focus (`--keep-alive` or `-a`):

```bash
> npx @open-wa/wa-automate -p 8080 -k 'K6MEQJRV3trXMPZ5eQd1Jl8NaaaRZxqy' --keep-alive

//or

> npx @open-wa/wa-automate -p 8080 -k 'K6MEQJRV3trXMPZ5eQd1Jl8NaaaRZxqy' --keep-alive
```

## Restarting session

As of version 2.0.0 of this library, you can now provide session data as a base64 string. This is the default method goin forward and your `.data.json` files should have this string if you've run the program in version 2.0.0+.

There are 3 param tags that can be used to set session data `-s`, `--session` or `--session-data` - all work but make sure you wrap the string with double quotes `"` and NOT sinle quotes `'`.

```bash
> npx @open-wa/wa-automate -p 8080 -k 'K6MEQJRV3trXMPZ5eQd1Jl8NaaaRZxqy' --session-data "eyJXQUJyb...ifQ=="
//or
> npx @open-wa/wa-automate -p 8080 -k 'K6MEQJRV3trXMPZ5eQd1Jl8NaaaRZxqy' --session "eyJXQUJyb...ifQ=="
//or
> npx @open-wa/wa-automate -p 8080 -k 'K6MEQJRV3trXMPZ5eQd1Jl8NaaaRZxqy' -s "eyJXQUJyb...ifQ=="
```

## Running on a server

If you're not running this on your localhost, you'll need to set the server hostname for the api-docs to work correctly.

```bash
> npx @open-wa/wa-automate -p 8080 --api-host 'https://my-wa-api.dev:8080'
```

## Webhooks

You can also set a webhook address to send all requests to. I like using [webhook.site](https://webhook.site/) to check and test events.

```bash
> npx @open-wa/wa-automate -w 'https://webhook.site/7a00ac21-60f2-411e-a571-515b37b2025a'
```

Now if you go to:

```http
https://webhook.site/#!/7a00ac21-60f2-411e-a571-515b37b2025a
```

 you'll be able to see all the events come through.

If you do use this link please make sure to clear all of your requests for your privacy.

## API Docs

By default, the CLI generates and serves a swagger api explorer at `[host]/api-docs/`

For example:

```bash
> npx @open-wa/wa-automate -w 'https://webhook.site/7a00ac21-60f2-411e-a571-515b37b2025a' -p 8008
```

will server the api docs at

```http
http://localhost:8008/api-docs/
```

## Postman collection

The CLI will also automatically generate a postman collection for your specific set up (including api keys, hostname, ports, etc.) which you can then easily import into postman.

## Coming soon

Soon SDKs for most programming lanugages will be created using the CLI as a base 'server'. Check this issue for updates: [#894](https://github.com/open-wa/wa-automate-nodejs/issues/894)
