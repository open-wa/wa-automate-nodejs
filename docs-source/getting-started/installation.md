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

## Chrome issues on Linux based systems

Some people report issues with running the program using the built in puppeteer chromium package. Use this to install dependencies and install chrome. After doing the following command you can use Chrome by setting `useChrome: true` in the config or with the `--use-chrome` flag with the CLI.

```bash
> wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
> sudo apt install ./google-chrome-stable_current_amd64.deb
```
