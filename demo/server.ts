const express = require('express')
const path = require("path");
import axios from 'axios';

const wa = require('@open-wa/wa-automate');
import { Whatsapp, decryptMedia, ev} from '@open-wa/wa-automate';
const mime = require('mime-types');
const fs = require('fs');

const ON_DEATH = require('death');
let globalClient:Whatsapp;

const PORT = 8082;

const app = express()
app.use(express.json())

ON_DEATH(async function(signal, err) {
  console.log('killing session');
  if(globalClient)await globalClient.kill();
})

wa.create('session',{ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless:true, throwErrorOnTosBlock:true, killTimer:40, autoRefresh:true, qrRefreshS:15, cacheEnabled:false, }).then(client => start(client));

ev.on('qr.**', async (qrcode,sessionId) => {
  const imageBuffer = Buffer.from(qrcode.replace('data:image/png;base64,',''), 'base64');
  fs.writeFileSync(`qr_code${sessionId?'_'+sessionId:''}.png`, imageBuffer);
});

ev.on('sessionData', async (sessionData, sessionId) =>{
  console.log(sessionId, sessionData)
})

const stateChanged = state => {
  console.log('statechanged', state)
  if(state==="CONFLICT") globalClient.forceRefocus();
}
const anyMessage = message=>console.log(message.type);

const processCurrencyRequest = async message => {
  const currency = message.body.substring(message.body.indexOf("!dollar",0)+8)
		console.log("Getting currency: " + currency);
    var url = 'https://mattdavenport.net/currency/cache/latest.json';
    const {data} = await axios({
      url,
    });
    const rates = 'rates';
    var dolarResponse = "💵 1 USD = " + JSON.parse(data)[rates][currency] + " " + currency;
    await globalClient.reply(message.from, dolarResponse, message.id.toString());	  
    return true;
}

async function start(client: Whatsapp) {
  globalClient = client;
  client.onStateChanged(stateChanged);
  client.onAnyMessage(anyMessage);
  client.onMessage(onMessage);
}

const onMessage = async message => {
  try {
  if(message.mimetype){
    const filename = `${message.t}.${mime.extension(message.mimetype)}`;
    const mediaData = await decryptMedia(message);
    fs.writeFile(filename, mediaData, function(err) {
      if (err) { return console.log(err); }
      console.log('The file was saved!');
    });
  }
  if(message.type==="location") console.log("TCL: location -> message", message.lat, message.lng, message.loc);
  if(message.body.includes("!location")) await globalClient.sendLocation(message.from, 37.422, -122.084, "Googleplex\nGoogle Headquarters")
  if(message.body.includes("!gif")) await globalClient.sendGiphy(message.from,'https://media.giphy.com/media/oYtVHSxngR3lC/giphy.gif','Oh my god it works');
  if((message.body.includes("!dollar")) && (message.body.length >= 10)) await processCurrencyRequest(message);
} catch (error) {
  console.log("TCL: start -> error", error)
}
}

app.get('/getAllNewMessages', async (req, res) => {
  const newMessages = await globalClient.getAllNewMessages();
  return res.send(newMessages);
})

app.get('/getBatteryLevel', async (req, res) => {
  const getBatteryLevel = await globalClient.getBatteryLevel();
  return res.send("battery: "+getBatteryLevel);
})

app.get('/isConnected', async (req, res) => {
  const isConnected = await globalClient.isConnected();
  return res.send(isConnected);
})

app.get('/getAllGroups', async (req, res) => {
  const getAllGroups = await globalClient.getAllGroups();
  return res.send(getAllGroups);
})

//Content-Type: application/json
//{"to": "whatsapp_number@c.us", "msg": "emoji 👍"}
app.post('/sendText' , async (req,res) => {
  console.log('• sendText body = ',req.body);
  const newMessage = await globalClient.sendText(req.body.to, req.body.msg);
  return res.send(newMessage);
})

//Content-Type: application/json
//{"to": "whatsapp_number@c.us", "pdf": "/path/to/file.pdf", "cap": "emoji 👍"}
app.post('/sendPDF' , async (req,res) => {
  console.log('• sendPDF body = ',req.body);
  const pdf_buffer  = fs.readFileSync(req.body.pdf);
  const newMessage = await globalClient.sendFile(req.body.to, `data:application/pdf;base64,${pdf_buffer.toString('base64')}`, path.basename(req.body.pdf), req.body.cap);
  return res.send(newMessage);
})

//Content-Type: application/json
//{"to": "whatsapp_number@c.us", "png": "/path/to/file.png", "cap": "emoji 👍"}
app.post('/sendPNG' , async (req,res) => {
  console.log('• sendPNG body = ',req.body);
  const png_buffer  = fs.readFileSync(req.body.png);
  const newMessage = await globalClient.sendFile(req.body.to, `data:image/png;base64,${png_buffer.toString('base64')}`, path.basename(req.body.png), req.body.cap);
  return res.send(newMessage);
})

app.listen(PORT, function () {
  console.log(`\n• Listening on port ${PORT}!`);
});
