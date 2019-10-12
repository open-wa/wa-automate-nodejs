// const sulla = require('../dist/index');
// var create = require("sulla").create;
// import { create, Whatsapp, decryptMedia} from 'sulla-hotfix';
import { create, Whatsapp, decryptMedia, ev } from '../src/index';
const mime = require('mime-types');
const fs = require('fs');

ev.on('qr', async qrcode => {
  //base64 encoded qr code image
  const imageBuffer = Buffer.from(qrcode.replace('data:image/png;base64,',''), 'base64');
  fs.writeFileSync('qr_code.png', imageBuffer);
});

function start(client: Whatsapp) {
  client.onMessage(async message => {
    if (message.mimetype) {
      const filename = `${message.t}.${mime.extension(message.mimetype)}`;
      const mediaData = await decryptMedia(message);
      await client.sendImage(
        message.from,
        `data:${message.mimetype};base64,${mediaData.toString('base64')}`,
        filename,
        `You just sent me this ${message.type}`
      );
      fs.writeFile(filename, mediaData, function(err) {
        if (err) {
          return console.log(err);
        }
        console.log('The file was saved!');
      });
    }
  });
}

create().then(client => start(client));
