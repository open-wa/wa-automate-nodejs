// const sulla = require('../dist/index');
// var create = require("sulla").create;
// import { create, Whatsapp, decryptMedia} from 'sulla-hotfix';
import { create, Whatsapp, decryptMedia, ev } from '../src/index';
const mime = require('mime-types');
const fs = require('fs');

ev.on('qr', async qrcode => {
  // sendQrToSlack(qrcode);
  //base64 encoded qr code image
  // const imageBuffer = Buffer.from(qrcode.replace('data:image/png;base64,',''), 'base64');
  // fs.writeFileSync('qr_code.png', imageBuffer);
});

function start(client: Whatsapp) {
  client.onMessage(async message => {
    console.log('TCL: start -> message', JSON.stringify(message));
    // console.log(client.getChatsById(message.from))
    if (message.mimetype) {
      const filename = `${message.t}.${mime.extension(message.mimetype)}`;
      const mediaData = await decryptMedia(message);
      // you can send a file also with sendImage or await client.sendFile
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

//you can now create two sessions pointing 
//two the same message handler

//it can be null, which will default to 'session' folder
create().then(client => start(client));

//or you can set a 'session id'
create('newsession').then(client => start(client));

//DO NOT HAVE TO SESSIONS WITH THE SAME ID

//BE WARNED, SETTING THIS UP WITH 2 NUMBERS WILL RESULT IN AN ECHO CHAMBER
//IF YOU SEND AN IMAGE WITH ONE PHONE IT WILL PING PONG THAT IMAGE FOR ETERNITY
