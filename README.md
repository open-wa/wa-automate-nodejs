[![npm version](https://img.shields.io/npm/v/sulla.svg?color=%2378e08f)](https://www.npmjs.com/package/sulla)

# sulla

> Sulla is a javascript library which provides a high-level API control to Whatsapp so it can be configured to automatize resposes or any data that goes trough Whatsapp effortlessly. 
>
> It is built using [puppeteer](https://github.com/GoogleChrome/puppeteer) and based on [this python wrapper](https://github.com/mukulhase/WebWhatsapp-Wrapper)


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

After executing `create()` function, **sulla** will create an instance of whatsapp web. If you are not logged in, it will print a QR code in the [terminal](https://i.imgur.com/g8QvERI.png). Scan it with your phone and you are ready to go!

###### sulla will remember the session so there is no need to authenticate everytime.


## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](https://choosealicense.com/licenses/mit/)