# 🤖 sulla
Javascript whatsapp framework (web whatsapp driver)

## Instalation

```bash
> npm i sulla
```
## Usage

```javascript
import { init } from 'sulla';

init().then(client => start(client));

function start(client) {
  client.onMessage().subscribe(message => {
    if (message.body === 'Hi') {
      client.sendText(message.from, '👋 Hello from sulla!');
    }
  });
}

```
