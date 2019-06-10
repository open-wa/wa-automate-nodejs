# 🤖 sulla

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
