// const wa = require('../dist/index');
// var create = require("@open-wa/wa-automate").create;
// import { create, Client, decryptMedia, ev } from '../dist/index';
import { create, Client, decryptMedia, ev, smartUserAgent, NotificationLanguage } from '../src/index';
const mime = require('mime-types');
const fs = require('fs');
const uaOverride = 'WhatsApp/2.16.352 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Safari/605.1.15';
const tosBlockGuaranteed = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/79.0.3945.88 Safari/537.36";
const ON_DEATH = require('death');
let globalClient:Client;
const express = require('express')

const app = express()
app.use(express.json({limit: '200mb'})) //add the limit option so we can send base64 data through the api

const PORT = 8082;


ON_DEATH(async function(signal, err) {
  console.log('killing session');
  if(globalClient)await globalClient.kill();
})

/**
 * Detect the qr code
 */
ev.on('qr.**', async (qrcode,sessionId) => {
  //base64 encoded qr code image
  const imageBuffer = Buffer.from(qrcode.replace('data:image/png;base64,',''), 'base64');
  fs.writeFileSync(`qr_code${sessionId?'_'+sessionId:''}.png`, imageBuffer);
});

/**
 * Detect when a session has been started successfully
 */
ev.on('STARTUP.**', async (data,sessionId) => {
  if(data==='SUCCESS') console.log(`${sessionId} started!`)
})

/**
 * Detect all events
 */
ev.on('**', async (data,sessionId,namespace) => {
  console.log("\n----------")
  console.log('EV',data,sessionId,namespace)
  console.log("----------")
})

/**
 * Detect the session data object
 */
ev.on('sessionData.**', async (sessionData, sessionId) =>{
  console.log("\n----------")
  console.log('sessionData',sessionId, sessionData)
  console.log("----------")
})

/**
 * Detect the session data object encoded as a base64string
 */
ev.on('sessionDataBase64.**', async (sessionData, sessionId) =>{
  console.log("\n----------")
  console.log('sessionData',sessionId, sessionData)
  console.log("----------")
})

async function start(client: Client) {
  app.use(client.middleware(true));

app.listen(PORT, function () {
  console.log(`\n• Listening on port ${PORT}!`);
});

  globalClient=client;
  console.log('starting');
  const me = await client.getMe();
  console.log("start -> me", me);
  // const chats = await client.getAllChatsWithMessages(false);
  // console.log("TCL: start -> chats", chats)
  // console.log("TCL: getAllChatsWithMessages ->", chats.length, chats[0]);
  // console.log("TCL: start ->chats", chats[0].msgs);

  // const newMessages = await client.getAllUnreadMessages();
  // console.log("TCL: start -> newMessages", newMessages)
  // console.log("TCL: getAllNewMessages ->", newMessages.length, newMessages[0]);

  client.onAck((c:any) => console.log(c.id,c.body,c.ack));

    client.onAddedToGroup(newGroup => console.log('Added to new Group', newGroup.id));

    client.onIncomingCall(call=>console.log('newcall',call));


    const prods = await client.getBusinessProfilesProducts(me.wid)
    console.log(prods)


  // client.onParticipantsChanged("XXXXXXXX-YYYYYYYY@g.us", (participantChangedEvent:any) => console.log("participant changed for group", participantChangedEvent));
  
  //Returns 'CONNECTED' or 'TIMEOUT' or 'CONFLICT' (if user opens whatsapp web somewhere else)
  client.onStateChanged(state=>{
    console.log('statechanged', state)
    if(state==="CONFLICT" || state==="UNLAUNCHED") client.forceRefocus();
  });

  // setTimeout(_=> client.kill(), 3000);

  // const allmsgs = await client.loadAndGetAllMessagesInChat('XXXXXXXX-YYYYYYYY@g.us",true,false);
  // console.log("TCL: start -> allMessages", allmsgs.length);

  client.onAnyMessage(message=>{
    console.log(message.type)
    if(message.body==='DELETE') client.deleteMessage(message.from,message.id,false)
  });
  // client.onParticipantsChanged("XXXXXXXXXX-YYYYYYYYY@g.us",x=>console.log(x))
  client.onMessage(async message => {
    try {

    const mp3_message_id = await client.sendAudio(message.from,'https://file-examples-com.github.io/uploads/2017/11/file_example_MP3_700KB.mp3', null)
    console.log("start -> mp", mp3_message_id)

    const isConnected = await client.isConnected();
    console.log("TCL: start -> isConnected", isConnected)
    console.log(message.body, message.id, message?.quotedMsgObj?.id);
    if (message.mimetype) {
      const filename = `${message.t}.${mime.extension(message.mimetype)}`;

      // if it is a sticker, you need to run this.
      let mediaData;
      if( message.type==='sticker') {
        //getStickerDecryptable is an insiders feature! 
        let stickerDecryptable = await client.getStickerDecryptable(message.id);
        if(stickerDecryptable) mediaData = await decryptMedia(stickerDecryptable, uaOverride);
      } else {
        mediaData = await decryptMedia(message, uaOverride);
      }
      // you can send a file also with sendImage or await client.sendFile
      await client.sendImage(
        message.from,
        `data:${message.mimetype};base64,${mediaData.toString('base64')}`,
        filename,
        `You just sent me this ${message.type}`
      );
      
      //send the whole data URI so the mimetype can be checked.
      await client.sendImageAsSticker(message.from, `data:${message.mimetype};base64,${mediaData.toString('base64')}`)
      //get this numbers products
      // const products = await client.getBusinessProfilesProducts(message.to);

      // //send a product from this number to that number
      //  await client.sendImageWithProduct(
      //   `data:${message.mimetype};base64,${mediaData.toString('base64')}`,
      //   message.from,
      //   'check out this product',
      //   message.to,
      //   products[0].id)

        // await client.forwardMessages(message.from,message,false);

        await client.forwardMessages(message.from,message.id,false);
      fs.writeFileSync(filename, mediaData, function(err) {
        if (err) {
          return console.log(err);
        }
        console.log('The file was saved!');
      });

      /**
       * You can also send the file as a relative file reference. The library will automatically open the file and get the dataUrl
       */
      const message_id_from_file = await client.sendImage(message.from,
        './'+filename,
        filename,
        'from file',
        null,
        true,
        false
        )
      console.log("start -> message_id", message_id_from_file)

      /**
       * Now you can send an animated gif via url
       */
      const sticker_from_url_gif_id = await client.sendStickerfromUrl(message.from, "https://i.giphy.com/media/yJil9u57ybQ9movc6E/source.gif")
      console.log("start -> sticker_from_url_gif_id", sticker_from_url_gif_id)

    } else if (message.type==="location") {
      if(message.shareDuration) console.log('This user has started sharing their live location', message.author || message.from)
      console.log("TCL: location -> message", message.lat, message.lng, message.loc)
      await client.sendLocation(message.from, `${message.lat}`, `${message.lng}`, `Youre are at ${message.loc}`)
    } else {
      // var sentMessageId = await client.sendText(message.from, message.body);
      // console.log("start -> sentMessageId", sentMessageId)
      // //send a giphy gif
      //   await client.forwardMessages(message.from,message,false);
      // await client.sendGiphy(message.from,'https://media.giphy.com/media/oYtVHSxngR3lC/giphy.gif','Oh my god it works');
      // console.log("TCL: start -> message.from,message.body,message.id.toString()", message.from,message.body,message.id.toString())
      // await client.reply(message.from,message.body,message);
    }
    } catch (error) {
    console.log("TCL: start -> error", error)
    }
  });

    // const groupCreationEvent = await client.createGroup('coolnewgroup','0000000000@c.us');
    // console.log("start -> groupCreationEvent", groupCreationEvent)
  //wait a few seconds and make a group

}

//you can now create two sessions pointing 
//two the same message handler


/**
 * it can be null, which will default to 'session' folder.
 * You can also override some puppeteer configs, set an executable path for your instance of chrome for ffmpeg (video+GIF) support
 * and you can AND SHOULD override the user agent.
 */
create({
  sessionId:'customer-support',
  // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  useChrome: true,
  restartOnCrash: start,
  headless:false,
  throwErrorOnTosBlock:true,
  qrTimeout:0,   //set to 0 to wait forever for a qr scan
  authTimeout:0, //set to 0 to wait forever for connection to phone
  killProcessOnBrowserClose: true,
  autoRefresh:true, //default to true
  safeMode: true,
  disableSpins: true,
  hostNotificationLang: NotificationLanguage.PTBR,
  viewport: {
    // width: 1920,
    height: 1200
  },
  popup: 3000,
  defaultViewport: null,
  // cacheEnabled:false,
  // devtools:true,
  //OR
  // devtools:{
  //   user:'admin',
  //   pass:'root'
  // },
  //example chrome args. THIS MAY BREAK YOUR APP !!!ONLY FOR TESTING FOR NOW!!!.
  // chromiumArgs:[
  //   '--aggressive-cache-discard',
  //   '--disable-cache',
  //   '--disable-application-cache',
  //   '--disable-offline-load-stale-cache',
  //   '--disk-cache-size=0'
  // ]
})
// create()
.then(async client => await start(client))
.catch(e=>{
  console.log('Error',e.message);
  // process.exit();
});

//or you can set a 'session id'
// create('newsession').then(client => start(client));

//DO NOT HAVE TO SESSIONS WITH THE SAME ID

//BE WARNED, SETTING THIS UP WITH 2 NUMBERS WILL RESULT IN AN ECHO CHAMBER
//IF YOU SEND AN IMAGE WITH ONE PHONE IT WILL PING PONG THAT IMAGE FOR ETERNITY
