---
title: Logging in with a link code
sidebar_label: Link Code Login
sidebar_position: 3
description:
  Simple docs showing how to use open-wa/wa-automate with a link code.
---

# Intro

For many years the standard way to login to your host account was to scan a QR code. However, recently link code has been introduced as an option. This guide will show you how to use the link code to login to your host account.

The main thing to know is that you will need to know exactly which host account number you're using before starting the session. This is because the link code is specific to the host account number.

Once the link code is requested from the session, the host account device will be sent a notification to confirm the login. Once confirmed, the host account device will ask you to enter the link code.

The link code is a 8 character string that is displayed on the screen of the host account device with a `-` in between, for example: `1EV4-5A78`.

In open-wa, the way to activate the link code request is to set the host account number as a string or number beforehand as a property of the config object in the `linkCode` property.

## Easy API

If you're using the Easy API, you can set the link code in the config object like so:

```bash
> npx @open-wa/wa-automate --link-code '447123456789'
```

Or if you're using the `cli.config.json` file:

```json
{
  "linkCode": "447123456789"
}
```

## In code

You can also set the link code manually in the code like so:

```javascript
create({
  linkCode: '447123456789'
})
```