# Installation

## Standard Installation

Run the following command to ensure you have wa-automate installed:

```bash
> npm install @open-wa/wa-automate
```

or using yarn:

```bash
> yarn add @open-wa/wa-automate
```

You can then add the library to your project:

```javascript
import { create, Client, decryptMedia, ev } from '@open-wa/wa-automate';

```

## CentOS Installation

Some people report CentOS causing problems when installing this library.

Try the following:

```bash
> npm install @open-wa/wa-automate --unsafe-perm
```

or if you come accros permission issues:

```bash
> sudo npm install @open-wa/wa-automate --unsafe-perm
```

## Installation when primarily using Chrome

If you use chrome, by setting [[`ConfigObject.useChrome`]] or [[`ConfigObject.executablePath`]] then you don't need to install the whole of puppeteer (puppeteer installs a version of Chromium - not Chrome - by default).

If there are issues with installing the packages then try this:

```bash
> npm install @open-wa/wa-automate --ignore-scripts
```

Doing this saves time and memory.