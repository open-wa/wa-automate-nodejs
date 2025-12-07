<div align="center">
<img src="https://raw.githubusercontent.com/open-wa/node-red-contrib-wa-automate/master/assets/hero.png?token=ABNBLTOYLTDRFNR4R5DBB2TAX5XXS"/>

# @open-wa/node-red-contrib-wa-automate

> Various nodes to assist in setting up automation using [Node-RED](https://nodered.org/) communicating with [the open-wa EASY API](https://docs.openwa.dev/pages/Getting%20Started/quick-run.html).

</div>

## Getting Started

### Prerequisites

Have Node-RED installed and working, if you need to install Node-RED see [here](https://nodered.org/docs/getting-started/installation). Also ensure you have an authenticated and up-to-date EASY API session running with the `--socket` flag.

- [Node.js](https://nodejs.org) v14.15.0 or newer
- [NPM](https://nodejs.org) v7.12.0 or newer
- [Node-RED](https://nodered.org/) v1.0 or newer
- [wa-automate](https://openwa.dev/) v4.1.0 or newer

## Remote Session Setup

```bash
# Install open-wa
> npm i @open-wa/wa-automate@latest

# Use the CLI to launch an instance of the EASY API, make sure to add --socket flag

> npx @open-wa/wa-automate --socket -p 8080

# If this is the first time you are running the EASY API, you will need to scan the qr code.
```

### Installation

```bash
PUPPETEER_SKIP_DOWNLOAD=true npm install @open-wa/node-red-contrib-wa-automate

or 

PUPPETEER_SKIP_DOWNLOAD=true yarn add @open-wa/node-red-contrib-wa-automate
```

## Acknowledgements

This project is build upon the [alexk111/node-red-node-typescript-starter](https://github.com/alexk111/node-red-node-typescript-starter) template by [@alexk111](https://github.com/alexk111)
