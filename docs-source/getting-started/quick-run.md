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
