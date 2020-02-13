const express = require('express')

const sulla = require('sulla-hotfix');
import { Whatsapp, decryptMedia, ev} from 'sulla-hotfix';
const mime = require('mime-types');
const fs = require('fs');

const uaOverride = 'WhatsApp/2.16.352 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Safari/605.1.15';
const tosBlockGuaranteed = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/79.0.3945.88 Safari/537.36";
const ON_DEATH = require('death');
let globalClient:Whatsapp;

const app = express()
app.use(express.json())

ON_DEATH(async function(signal, err) {
  console.log('killing session');
  if(globalClient)await globalClient.kill();
})

sulla.create('session',{ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, throwErrorOnTosBlock:true, killTimer:40, autoRefresh:true, qrRefreshS:15, cacheEnabled:false, }).then(client => start(client));

ev.on('qr.**', async (qrcode,sessionId) => {
  const imageBuffer = Buffer.from(qrcode.replace('data:image/png;base64,',''), 'base64');
  fs.writeFileSync(`qr_code${sessionId?'_'+sessionId:''}.png`, imageBuffer);
});

function start(client) {
  globalClient = client;
  client.onStateChanged(state=>{
    console.log('statechanged', state)
    if(state==="CONFLICT") client.forceRefocus();
  });
  client.onAnyMessage(message=>console.log(message.type));
  client.onMessage(async message => {
    try {
    const isConnected = await client.isConnected();
    console.log("TCL: start -> isConnected", isConnected)
    if (message.mimetype) {
      const filename = `${message.t}.${mime.extension(message.mimetype)}`;
      const mediaData = await decryptMedia(message, uaOverride);
      //client.sendImage(message.from,`data:${message.mimetype};base64,${mediaData.toString('base64')}`,filename,`You just sent me this ${message.type}`);
      //client.forwardMessages(message.from,message,false);
      fs.writeFile(filename, mediaData, function(err) {
        if (err) { return console.log(err); }
        console.log('The file was saved!');
      });
    } else if (message.type==="location") {
        console.log("TCL: location -> message", message.lat, message.lng, message.loc)
        await client.sendLocation(message.from, `${message.lat}`, `${message.lng}`, `You are at ${message.loc}`)
    } else {
        //client.sendText(message.from, message.body);
        //client.sendGiphy(message.from,'https://media.giphy.com/media/oYtVHSxngR3lC/giphy.gif','Oh my god it works');
    }
    } catch (error) {
      console.log("TCL: start -> error", error)
    }
  });
}

app.get('/getAllUnreadMessages', async (req, res) => {
  const newMessages = await globalClient.getAllUnreadMessages();
  return res.send(newMessages)
})

app.post('/sendText' , async (req,res) => {
  console.log('body is ',req.body);
  const {message} = req.body;
  const newMessage = await globalClient.sendText(message.from, message.body);
  return res.send(newMessage);
})

app.listen(80, function () {
  console.log('Example app listening on port 80!');
});
