---
id: "api_model_config.ConfigObject"
title: "Interface: ConfigObject"
sidebar_label: "ConfigObject"
custom_edit_url: null
---

[api/model/config](/api/modules/api_model_config.md).ConfigObject

## Indexable

▪ [x: `string`]: `any`

## Properties

### aggressiveGarbageCollection

• `Optional` **aggressiveGarbageCollection**: `boolean`

Setting this to true will run `gc()` on before every command sent to the browser.

This is experimental and may not work or it may have unforeseen sideeffects.

___

### authTimeout

• `Optional` **authTimeout**: `number`

This determines how long the process should wait for the session authentication. If exceeded, checks if phone is out of reach (turned of or without internet connection) and throws an error. It does not relate to the amount of time spent waiting for a qr code scan (see [qrTimeout](/api/interfaces/api_model_config.ConfigObject.md#qrtimeout)). To have the system wait continuously, set this to `0`.

**`Default`**

`60`

___

### autoEmoji

• `Optional` **autoEmoji**: `string` \| ``false``

Set the automatic emoji detection character. Set this to `false` to disable auto emoji. Default is `:`.

**`Default`**

`:`

___

### autoRefresh

• `Optional` **autoRefresh**: `boolean`

**`Deprecated`**

THIS IS LOCKED TO `true` AND CANNOT BE TURNED OFF. PLEASE SEE [authTimeout](/api/interfaces/api_model_config.ConfigObject.md#authtimeout)

Setting this to true will result in new QR codes being generated if the end user takes too long to scan the QR code.

**`Default`**

`true`

___

### blockAssets

• `Optional` **blockAssets**: `boolean`

Setting this to true will block all assets from loading onto the page. This may result in some load time improvements but also increases instability.

**`Default`**

`false`

___

### blockCrashLogs

• `Optional` **blockCrashLogs**: `boolean`

Setting this to true will block any network calls to crash log servers. This should keep anything you do under the radar.

**`Default`**

`true`

___

### browserRevision

• `Optional` **browserRevision**: `string`

This is the specific browser revision to be downlaoded and used. You can find browser revision strings here: http://omahaproxy.appspot.com/
Learn more about it here: https://github.com/puppeteer/puppeteer/blob/master/docs/api.md#class-browserfetcher
If you're having trouble with sending images, try '737027'.
If you go too far back things will start breaking !!!!!!
NOTE: THIS WILL OVERRIDE useChrome and executablePath. ONLY USE THIS IF YOU KNOW WHAT YOU ARE DOING.

___

### browserWSEndpoint

• `Optional` **browserWSEndpoint**: `string`

ALPHA EXPERIMENTAL FEATURE! DO NOT USE IN PRODUCTION, REQUIRES TESTING.

Learn more:

https://pptr.dev/#?product=Puppeteer&version=v3.1.0&show=api-puppeteerconnectoptions

https://medium.com/@jaredpotter1/connecting-puppeteer-to-existing-chrome-window-8a10828149e0

___

### bypassCSP

• `Optional` **bypassCSP**: `boolean`

Disable cors see: https://pptr.dev/#?product=Puppeteer&version=v3.0.4&show=api-pagesetbypasscspenabled If you are having an issue with sending media try to set this to true. Otherwise leave it set to false.

**`Default`**

`false`

___

### cacheEnabled

• `Optional` **cacheEnabled**: `boolean`

Setting this to false turn off the cache. This may improve memory usage.

**`Default`**

`false`

___

### cachedPatch

• `Optional` **cachedPatch**: `boolean`

Setting this to `true` will save a local copy of the patches.json file (as patches.ignore.data.json) which will be used in subsequent instantiations of the session. While the rest of the launch procedure is running, the library will fetch and save a recent version of the patches to ensure your patches don't go stale. This will be ignored if the cached patches are more than a day old.

**`Default`**

`false`

___

### callTimeout

• `Optional` **callTimeout**: `number`

Amount of time (in ms) to wait for a client method (specifically methods that interact with the WA web session) to resolve. If a client method results takes longer than the timout value then it will result in a PageEvaluationTimeout error.

If you get this error, it does not automatically mean that the method failed - it just stops your program from waiting for a client method to resolve.

This is useful if you do not rely on the results of a client method (e.g the message ID).

If set to `0`, the process will wait indefinitely for a client method to resolve.

**`Default`**

0

___

### chromiumArgs

• `Optional` **chromiumArgs**: `string`[]

This allows you to pass any array of custom chrome/chromium argument strings to the puppeteer instance.
You can find all possible arguements [here](https://peter.sh/experiments/chromium-command-line-switches/).

___

### cloudUploadOptions

• `Optional` **cloudUploadOptions**: `Object`

REQUIRED IF `messagePreprocessor` IS SET TO `UPLOAD_CLOUD`.

This can be set via the config or the corresponding environment variables.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `accessKeyId` | `string` | S3 compatible access key ID.   e.g: `AKIAIOSFODNN7EXAMPLE` or `GOOGTS7C7FUP3AIRVJTE2BCD`  env: `OW_CLOUD_ACCESS_KEY_ID` |
| `bucket` | `string` | Bucket name  env: `OW_CLOUD_BUCKET` |
| `directory?` | `string` | The directory strategy to use when uploading files. Or just set it to a custom directory string.  env: `OW_DIRECTORY` |
| `headers?` | { `[k: string]`: `string`;  } | Extra headers to add to the upload request |
| `ignoreHostAccount?` | `boolean` | Ignore processing of messages that are sent by the host account itself  env: `OW_CLOUD_IGNORE_HOST` |
| `provider` | [`CLOUD_PROVIDERS`](/api/enums/api_model_config.CLOUD_PROVIDERS.md) | `AWS`, `GCP` or `WASABI`  env: `OW_CLOUD_ACCESS_KEY_ID` |
| `public?` | `boolean` | Setting this to true will make the uploaded file public |
| `region?` | `string` | Bucket region.  Not required for `GCP` provider  env: `OW_CLOUD_REGION` |
| `secretAccessKey` | `string` | S3 compatible secret access key.  e.g `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`  env: `OW_CLOUD_SECRET_ACCESS_KEY` |

___

### corsFix

• `Optional` **corsFix**: `boolean`

Setting this to true will bypass web security. DO NOT DO THIS IF YOU DO NOT HAVE TO. CORS issue may arise when using a proxy.

**`Default`**

`false`

___

### customUserAgent

• `Optional` **customUserAgent**: `string`

You may set a custom user agent. However, due to recent developments, this is not really neccessary any more.

___

### deleteSessionDataOnLogout

• `Optional` **deleteSessionDataOnLogout**: `boolean`

Deletes the session data file (if found) on logout event. This results in a quicker login when you restart the process.

**`Default`**

`false`

___

### devtools

• `Optional` **devtools**: `boolean` \| [`DevTools`](/api/interfaces/api_model_config.DevTools.md)

You can enable remote devtools by setting this to trye. If you set this to true there will be security on the devtools url.
If you want, you can also pass a username & password.

___

### disableSpins

• `Optional` **disableSpins**: `boolean`

Setting this to true will simplify logs for use within docker containers by disabling spins (will still print raw messages).

**`Default`**

`false`

___

### discord

• `Optional` **discord**: `string`

Your Discord ID to get onto the sticker leaderboard!

___

### ensureHeadfulIntegrity

• `Optional` **ensureHeadfulIntegrity**: `boolean`

Makes sure the headless session is usable even on first login.
Headful sessions are ususally only usable on reauthentication.

___

### eventMode

• `Optional` **eventMode**: `boolean`

Setting listeners may not be your cup of tea. With eventMode, all SimpleListener events will be registered automatically and be filed via the built in Events Listener.

This is useful because you can register/deregister the event listener as needed whereas the legacy method of setting callbacks are only be set once

**`Default`**

`true`;

___

### executablePath

• `Optional` **executablePath**: `string`

Some features, like video upload, do not work without a chrome instance. Set this to the path of your chrome instance or you can use `useChrome:true` to automatically detect a chrome instance for you. Please note, this overrides `useChrome`.

___

### ezqr

• `Optional` **ezqr**: `boolean`

Expose a URL where you can easily scan the qr code

___

### ghPatch

• `Optional` **ghPatch**: `boolean`

This will force the library to use the default cached raw github link for patches to shave a few hundred milliseconds from your launch time. If you use this option, you will need to wait about 5 minutes before trying out new patches.

**`Default`**

`false`

___

### headless

• `Optional` **headless**: `boolean`

By default, all instances of @open-wa/wa-automate are headless (i.e you don't see a chrome window open), you can set this to false to show the chrome/chromium window.

**`Default`**

`true`

___

### hostNotificationLang

• `Optional` **hostNotificationLang**: [`NotificationLanguage`](/api/enums/api_model_config.NotificationLanguage.md)

The language of the host notification. See: https://github.com/open-wa/wa-automate-nodejs/issues/709#issuecomment-673419088

___

### idCorrection

• `Optional` **idCorrection**: `boolean`

When true, the system will attempt to correct chatIds and groupChatIds. This means you can ignore `@c.us` and `@g.us` distinctions in some parameters.

**`Default`**

false

___

### ignoreNuke

• `Optional` **ignoreNuke**: `boolean`

Don't implicitly determine if the host logged out.

___

### inDocker

• `Optional` **inDocker**: `boolean`

If true, the process will try infer as many config variables as possible from the environment variables. The format of the variables are as below:
```
sessionData     ==>     WA_SESSION_DATA
sessionDataPath ==>     WA_SESSION_DATA_PATH
sessionId       ==>     WA_SESSION_ID
customUserAgent ==>     WA_CUSTOM_USER_AGENT
blockCrashLogs  ==>     WA_BLOCK_CRASH_LOGS
blockAssets     ==>     WA_BLOCK_ASSETS
corsFix         ==>     WA_CORS_FIX
cacheEnabled    ==>     WA_CACHE_ENABLED
headless        ==>     WA_HEADLESS
qrTimeout       ==>     WA_QR_TIMEOUT
useChrome       ==>     WA_USE_CHROME
qrLogSkip       ==>     WA_QR_LOG_SKIP
disableSpins    ==>     WA_DISABLE_SPINS
logConsole      ==>     WA_LOG_CONSOLE
logConsoleErrors==>     WA_LOG_CONSOLE_ERRORS
authTimeout     ==>     WA_AUTH_TIMEOUT
safeMode        ==>     WA_SAFE_MODE
skipSessionSave ==>     WA_SKIP_SESSION_SAVE
popup           ==>     WA_POPUP 
licensekey      ==>     WA_LICENSE_KEY 
```

**`Default`**

`false`

___

### keepUpdated

• `Optional` **keepUpdated**: `boolean`

[ALPHA FEATURE - ONLY IMPLEMENTED FOR TESTING - DO NOT USE IN PRODUCTION YET]
Setting this to true will result in the library making sure it is always starting with the latest version of itself. This overrides `skipUpdateCheck`.

**`Default`**

`false`

___

### killClientOnLogout

• `Optional` **killClientOnLogout**: `boolean`

Kill the client when a logout is detected

**`Default`**

`false`

___

### killProcessOnBan

• `Optional` **killProcessOnBan**: `boolean`

If set to true, the system will kill the whole node process when a "TEMPORARY BAN" is detected. This is useful to prevent hanging processes.
It is `true` by default because it is a very rare event and it is better to kill the process than to leave it hanging.

**`Default`**

`true`

___

### killProcessOnBrowserClose

• `Optional` **killProcessOnBrowserClose**: `boolean`

Setting this to `true` will kill the whole process when the client is disconnected from the page or if the browser is closed.

**`Default`**

`false`

___

### killProcessOnTimeout

• `Optional` **killProcessOnTimeout**: `boolean`

If set to true, the system will kill the whole node process when either an [authTimeout](/api/interfaces/api_model_config.ConfigObject.md#authtimeout) or a [qrTimeout](/api/interfaces/api_model_config.ConfigObject.md#qrtimeout) has been reached. This is useful to prevent hanging processes.

**`Default`**

`false`

___

### legacy

• `Optional` **legacy**: `boolean`

As the library is constantly evolving, some parts will be replaced with more efficient and improved code. In some of the infinite edge cases these new changes may not work for you. Set this to true to roll back on 'late beta' features. The reason why legacy is false by default is that in order for features to be tested they have to be released and used by everyone to find the edge cases and fix them.

**`Default`**

`false`

___

### licenseKey

• `Optional` **licenseKey**: `string`

In order to unlock the functionality to send texts to unknown numbers, you need a License key.
One License Key is valid for each number. Each License Key starts from £5 per month.

Please check README for instructions on how to get a license key.

Notes:
1. You can change the number assigned to that License Key at any time, just message me the new number on the private discord channel.
2. In order to cancel your License Key, simply stop your membership.

___

### linkParser

• `Optional` **linkParser**: `string`

The URL of your instance of [serverless meta grabber](https://github.com/RemiixInc/meta-grabber-serverless) by [RemiixInc](https://github.com/RemiixInc).

default: `https://link.openwa.cloud/api`

___

### logConsole

• `Optional` **logConsole**: `boolean`

If true, this will log any console messages from the browser.

**`Default`**

`false`

___

### logConsoleErrors

• `Optional` **logConsoleErrors**: `boolean`

If true, this will log any error messages from the browser instance

**`Default`**

`false`

___

### logDebugInfoAsObject

• `Optional` **logDebugInfoAsObject**: `boolean`

Setting `this` to true will replace the `console.table` with a stringified logging of the debug info object instead. This would be useful to set for smaller terminal windows. If `disableSpins` is `true` then this will also be `true`.

**`Default`**

`false`

___

### logFile

• `Optional` **logFile**: `boolean`

If true, the system will automatically create a log of all processes relating to actions sent to the web session.

The location of the file will be relative to the process directory (pd)

`[pd]/[sessionId]/[start timestamp].log`

**`Default`**

false

___

### logInternalEvents

• `Optional` **logInternalEvents**: `boolean`

This will make the library log all internal wa web events to the console. This is useful for debugging purposes. DO NOT TURN THIS ON UNLESS ASKED TO.

___

### logging

• `Optional` **logging**: [`ConfigLogTransport`](/api/types/logging_logging.ConfigLogTransport.md)[]

An array of [winston](https://github.com/winstonjs/winston/blob/master/docs/transports.md#additional-transports) logging transport configurations.

[Check this discussion to see how to set up logging](https://github.com/open-wa/wa-automate-nodejs/discussions/2373)

___

### maxChats

• `Optional` **maxChats**: `number`

Set the maximum amount of chats to be present in a session.

___

### maxMessages

• `Optional` **maxMessages**: `number`

Set the maximum amount of messages to be present in a session.

___

### messagePreprocessor

• `Optional` **messagePreprocessor**: `any`

Set a preprocessor, or multiple chained preprocessors, for messages. See [MPConfigType](/) for more info.

options: `SCRUB`, `BODY_ONLY`, `AUTO_DECRYPT`, `AUTO_DECRYPT_SAVE`, `UPLOAD_CLOUD`.

**`Default`**

`undefined`

___

### multiDevice

• `Optional` **multiDevice**: `boolean`

Please note that multi-device is still in beta so a lot of things may not work. It is HIGHLY suggested to NOT use this in production!!!!

Set this to true if you're using the multidevice beta.

**`Default`**

`true`
:::danger
Some features (e.g sendLinkWithAutoPreview)  **do not** work with multi-device beta. Check [this `api`](#).
:::

___

### onError

• `Optional` **onError**: [`OnError`](/api/enums/api_model_config.OnError.md)

What to do when an error is detected on a client method.

**`Default`**

`OnError.NOTHING`

___

### oorTimeout

• `Optional` **oorTimeout**: `number`

phoneIsOutOfReach check timeout

**`Default`**

`60`

___

### pQueueDefault

• `Optional` **pQueueDefault**: `any`

Default pqueue options applied to all listeners that can take pqueue options as a second optional parameter. For now, this only includes `onMessage` and `onAnyMessage`.

See: https://github.com/sindresorhus/p-queue#options

Example: process 5 events within every 3 seconds window. Make sure to only process at most 2 at any one time. Make sure there is at least 100ms between each event processing.

```javascript
    {   
        intervalCap: 5, //process 5 events
        interval: 3000, //within every three second window
        concurrency: 2, //make sure to process, at most, 2 events at any one time
        timeout: 100, //make sure there is a 100ms gap between each event processing.
        carryoverConcurrencyCount: true //If there are more than 5 events in that period, process them within the next 3 second period. Make sure this is always set to true!!!
    }
```

**`Default`**

`undefined`

___

### popup

• `Optional` **popup**: `number` \| `boolean`

If true, the process will open a browser window where you will see basic event logs and QR codes to authenticate the session. Usually it will open on port 3000. It can also be set to a preferred port.

You can also get the QR code png at (if localhost and port 3000):

`http://localhost:3000/qr`

or if you have multiple session:

 `http://localhost:3000/qr?sessionId=[sessionId]`

**`Default`**

`false | 3000`

___

### preprocFilter

• `Optional` **preprocFilter**: `string`

Set an array filter to be used with messagePreprocessor to limit which messages are preprocessed.

E.g if you want to scrub all messages that are not from a group, you can do the following:
`"m=>!m.isGroupMsg"`

**`Default`**

`undefined`

___

### proxyServerCredentials

• `Optional` **proxyServerCredentials**: [`ProxyServerCredentials`](/api/interfaces/api_model_config.ProxyServerCredentials.md)

If sent, adds a call to waPage.authenticate with those credentials. Set `corsFix` to true if using a proxy results in CORS errors.

___

### qrFormat

• `Optional` **qrFormat**: [`QRFormat`](/api/enums/api_model_config.QRFormat.md)

The output format of the qr code. `png`, `jpeg` or `webm`.

**`Default`**

`png`

___

### qrLogSkip

• `Optional` **qrLogSkip**: `boolean`

If true, skips logging the QR Code to the console.

**`Default`**

`false`

___

### qrMax

• `Optional` **qrMax**: `number`

Automatically kill the process after a set amount of qr codes

___

### qrPopUpOnly

• `Optional` **qrPopUpOnly**: `boolean`

This needs to be used in conjuction with `popup`, if `popup` is not true or a number (representing a desired port) then this will not work.

Setting this to true will make sure that only the qr code png is served via the web server. This is useful if you do not need the whole status page.

As mentioned in [popup](#popup), the url for the qr code is `http://localhost:3000/qr` if the port is 3000.

___

### qrQuality

• `Optional` **qrQuality**: [`QRQuality`](/api/enums/api_model_config.QRQuality.md)

The output quality of the qr code during authentication. This can be any increment of 0.1 from 0.1 to 1.0.

**`Default`**

`1.0`

___

### qrRefreshS

• `Optional` **qrRefreshS**: `number`

**`Deprecated`**

This now has no effect

This determines the interval at which to refresh the QR code. By default, WA updates the qr code every 18-19 seconds so make sure this value is set to UNDER 18 seconds!!

___

### qrTimeout

• `Optional` **qrTimeout**: `number`

This determines how long the process should wait for a QR code to be scanned before killing the process entirely. To have the system wait continuously, set this to `0`.

**`Default`**

60

___

### raspi

• `Optional` **raspi**: `boolean`

Set this to `true` to make the library work on Raspberry Pi OS.

Make sure to run the following command before running the library the first time:

```
> sudo apt update -y && sudo apt install chromium-browser chromium-codecs-ffmpeg -y && sudo apt upgrade
```

If you're using the CLI, you can set this value to `true` by adding the following flag to the CLI command

```
> npx @open-wa/wa-automate ... --raspi
```

**`Default`**

`false`

___

### resizable

• `Optional` **resizable**: `boolean`

Syncs the viewport size with the window size which is how normal browsers act. Only relevant when `headless: false` and this overrides `viewport` config.

**`Default`**

`true`

___

### restartOnCrash

• `Optional` **restartOnCrash**: `any`

If set, the program will try to recreate itself when the page crashes. You have to pass the function that you want called upon restart. Please note that when the page crashes you may miss some messages.
E.g:
```javascript
const start  = async (client: Client) => {...}
create({
...
restartOnCrash: start,
...
})
```

___

### safeMode

• `Optional` **safeMode**: `boolean`

If true, client will check if the page is valid before each command. If page is not valid, it will throw an error.

**`Default`**

`false`

___

### screenshotOnInitializationBrowserError

• `Optional` **screenshotOnInitializationBrowserError**: `boolean`

When true, this option will take a screenshot of the browser when an unexpected error occurs within the browser during `create` initialization. The path will be `[working directory]/logs/[session ID]/[start timestamp]/[timestamp].jpg`

**`Default`**

`false`

___

### sessionData

• `Optional` **sessionData**: [`Base64`](/api/types/api_model_aliases.Base64.md) \| [`SessionData`](/api/interfaces/api_model_config.SessionData.md)

The authentication object (as a JSON object or a base64 encoded string) that is required to migrate a session from one instance to another or to just restart an existing instance.
This sessionData is provided in a generated JSON file (it's a json file but contains the JSON data as a base64 encoded string) upon QR scan or an event.

You can capture the event like so:
```javascript
import {create, ev} from '@open-wa/wa-automate';

     ev.on('sessionData.**', async (sessionData, sessionId) =>{
         console.log(sessionId, sessionData)
     })

//or as base64 encoded string

     ev.on('sessionDataBase64.**', async (sessionDatastring, sessionId) =>{
         console.log(sessionId, sessionDatastring)
     })
```
 NOTE: You can set sessionData as an evironmental variable also! The variable name has to be [sessionId (default = 'session) in all caps]_DATA_JSON. You have to make sure to surround your session data with single quotes to maintain the formatting.

For example:

sessionId = 'session'

To set env var:
```bash
   export SESSION_DATA_JSON=`...`
```
where ... is copied from session.data.json this will be a string most likley starting in `ey...` and ending with `==`

Setting the sessionData in the environmental variable will override the sessionData object in the config.

___

### sessionDataBucketAuth

• `Optional` **sessionDataBucketAuth**: `string`

Base64 encoded S3 Bucket & Authentication object for session data files. The object should be in the same format as cloudUploadOptions.

___

### sessionDataPath

• `Optional` **sessionDataPath**: `string`

The path relative to the current working directory (i.e where you run the command to start your process). This will be used to store and read your `.data.json` files. defualt to ''

___

### sessionId

• `Optional` **sessionId**: `string`

This is the name of the session. You have to make sure that this is unique for every session.

**`Default`**

`session`

___

### skipBrokenMethodsCheck

• `Optional` **skipBrokenMethodsCheck**: `boolean`

If set to true, skipBrokenMethodsCheck will bypass the health check before startup. It is highly suggested to not set this to true.

**`Default`**

`false`

___

### skipSessionSave

• `Optional` **skipSessionSave**: `boolean`

If true, the process will not save a data.json file. This means that sessions will not be saved and you will need to pass sessionData as a config param or create the session data.json file yourself

**`Default`**

`false`

___

### skipUpdateCheck

• `Optional` **skipUpdateCheck**: `boolean`

If set to true, `skipUpdateCheck` will bypass the latest version check. This saves some time on boot (around 150 ms).

**`Default`**

`false`

___

### stickerServerEndpoint

• `Optional` **stickerServerEndpoint**: `string` \| `boolean`

Redundant until self-hostable sticker server is available.

**`Default`**

`https://sticker-api.openwa.dev`

___

### throwErrorOnTosBlock

• `Optional` **throwErrorOnTosBlock**: `boolean`

Setting this to true will throw an error if a session is not able to get a QR code or is unable to restart a session.

___

### throwOnExpiredSessionData

• `Optional` **throwOnExpiredSessionData**: `boolean`

This will make the `create` command return `false` if the detected session data is expired.

This will mean, the process will not attempt to automatically get a new QR code.

**`Default`**

`false`

___

### useChrome

• `Optional` **useChrome**: `boolean`

If true, the program will automatically try to detect the instance of chorme on the machine. Please note this DOES NOT override executablePath.

**`Default`**

`false`

___

### useNativeProxy

• `Optional` **useNativeProxy**: `boolean`

Some sessions may experience issues with sending media when using proxies. Using the native proxy system instead of the recommended 3rd party library may fix these issues.

**`Default`**

`false`

___

### useStealth

• `Optional` **useStealth**: `boolean`

This flag allows you to disable or enable the use of the puppeteer stealth plugin. It is a good idea to use it, however it can cause issues sometimes. Set this to false if you are experiencing `browser.setMaxListeneres` issue. For now the default for this is false.

**`Default`**

`false`

___

### viewport

• `Optional` **viewport**: `Object`

Set the desired viewport height and width. For CLI, use [width]x[height] format. E.g `--viewport 1920x1080`.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `height?` | `number` | Page height in pixels  **`Default`**  `900` |
| `width?` | `number` | Page width in pixels  **`Default`**  `1440` |

___

### waitForRipeSession

• `Optional` **waitForRipeSession**: `boolean`

wait for a valid headful session. Not required in recent versions.
default: `true`

___

### waitForRipeSessionTimeout

• `Optional` **waitForRipeSessionTimeout**: `number`

This determines how long the process should wait for a session to load fully before continuing the launch process.
Set this to 0 to wait forever. Default is 5 seconds.

**`Default`**

5
