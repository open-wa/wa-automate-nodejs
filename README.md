# 🤖 sulla

Javascript whatsapp framework (web whatsapp driver)

## Instalation

```bash
> npm i sulla
```

## Usage

```javascript
import { create } from 'sulla';

create().then(client => start(client));

function start(client) {
  create().then(client => {
    client.onMessage(message => {
      if (message.body === 'Hi') {
        client.sendText(message.from, '👋 Hello from sulla!');
      }
    });
  });
}
```
