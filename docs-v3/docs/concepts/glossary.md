---
title: Glossary of terms
sidebar_label: Glossary
description:
  In order to get used to this project, you might find it useful to learn
  a few regularly used terms 
---

## Session

A session refers to a Client with a set [ConfigObject.sessionId]. The concept of a session transcends individual process instances. The `sessionId` is the unique identifier of the session and is the property which tells the open-wa process which re-authentication data ([Session Data](#session-data)) to use to bring back a session without needing to re-scan the QR code.

## Host Account

A host account is essentially just a WA account which is used to authenticate a session. Sometimes you will see the term `host account device`, this refers to the specific mobile device that is used to scan the QR code

## Head/headless/headful

The concept of a `head` is widely used in many different computer-related contexts. In this context, head refers to the visual graphical chrome interface (as you would see with a monitor). By default, open-wa runs `headless`, meaning you can run the process which will spawn a browser instance which you cannot see. On the otherhand, you can set [ConfigObject.headless] to `false` in order to spwan a `headful` browser which you can interact with.

:::caution

If you set  [ConfigObject.headless] to `false` on a VM which is `headless` itself (i.e there is no GUI for the VM), it will cause the process to error out.

:::

## Re-scan (rescan)

A `Re-scan` (or `rescan`) refers to the end user action of having to scan the qr code after having already done it previously for that specific session ID in the same working directory. Sometimes you will have to re-scan when using MD because MD authentication state is tempremental at best. You will also have to re-scan if the host account device has logged out of the session.

## Re-auth (reauth)

A `Re-auth` (or `reauth`) refers to the library logging in to a session which has already been scanned/authenticated. The goal of this library is to consistently reauth a session. However, sometimes the library is not able to reauth. Re-auth is something the library attempts to do, whereas a re-scan is an end user action.

## Session Data

The `Session Data` refers to the data that is used to bring a session back online without having to re-scan the QR code. Session Data is portable for [Legacy] accounts. A `session data file` refers to a file that contains the `session data`, you can recognise a `session data file` by the file extension of `data.json`. If the session Id is "personal" the session data file will be `personal.data.json`.

## Session Portability

`Session Portability` refers to the ability for a session to be easily moved from one machine to another without the need to re-auth. This is acheived by moving the `session data file` and then re-starting the session process with the correct session ID.

:::note

**Multi-device** sessions are _NOT_ portable. Track Please track [##2338] to see when MD sessions become portable.

:::

## Legacy

`Legacy` refers to the original method of authenticating a session - where only one session can be "live" at a time and the host account device had to be connected to the internet to keep the session state connected. It is called "legacy" because we expect this method of extra device connection to be phased out in favour for MD.

## MD (Multi-Device)

Multi-device (or MD) (sessions), on the other hand refer to sessions (or host account devices) that have MD enabled. Currently, MD is opt-in via the beta. In the future, we expect this to be the default method of connecting extra devices to your host account. MD sessions do not require the host account device to be online. 

:::caution

**MD** is _missing_ several key features out of the box. MD sessions are not portable. If you move between browsers or machines, you **WILL** have to reauth. Please test it out before determining if it is right for you.

:::

## The IGNORE folder

Although MD sessions are not portable, you shouldn't need to reauth in-place once set up. In order to bring the session back online, the library creates & uses an `IGNORE folder`, the reason it's called an `IGNORE folder` is because it's a folder that you should add to your `.gitignore` and it's formatted as `IGNORE_[sessionId]`. This folder houses all of the important data required for the browser to resurrect your authenticated session. These fodlers are extremely tempremental and any tampering can render them useless. These folders are locked to a specific machine and a specific browser instance - meaning you have to make sure you use the same browser and machine that the folder was originally created with. 

:::tip

If you're constantly needing to reauth a session, delete this folder and then try again.

:::

## The EASY API / CLI



| Term | Meaning | Context |
|------|---------|---------|
| Session | An instance of the Client | A
| Host Account | A WA account that is used to authenticate a session | `` |