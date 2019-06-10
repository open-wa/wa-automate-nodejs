# sulla
[![npm version](https://img.shields.io/npm/v/sulla.svg?color=%2378e08f)](https://www.npmjs.com/package/sulla) [![Greenkeeper badge](https://badges.greenkeeper.io/danielcardeenas/sulla.svg)](https://greenkeeper.io/)

Javascript whatsapp framework (web whatsapp driver)

## Instalation

```bash
> npm i sulla
```

## Usage

```javascript
// var create = require("sulla").create;
import { create, Whatsapp } from 'sulla';

create().then(client => start(client));

function start(client: Whatsapp) {
  client.onMessage(message => {
    if (message.body === 'Hi') {
      client.sendText(message.from, '👋 Hello from sulla!');
    }
  });
}
```

## Info
After executing `create()` function, **sulla** will create an instance of whatsapp web. If you are not logged in, it will print a QR code in the [terminal](https://i.imgur.com/g8QvERI.png). Scan it with your phone and you are ready to go!

###### 🤖 Sulla will remember the session so there is no need to authenticate everytime.
