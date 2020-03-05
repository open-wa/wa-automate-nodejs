const express = require('express')
const path = require("path");
const https = require('https')

const sulla = require('sulla-hotfix');
import { Whatsapp, decryptMedia, ev} from 'sulla-hotfix';
const mime = require('mime-types');
const fs = require('fs');

const uaOverride = 'WhatsApp/2.16.352 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Safari/605.1.15';
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

ev.on('sessionData', async (sessionData, sessionId) =>{
  console.log(sessionId, sessionData)
})

async function start(client: Whatsapp) {
  globalClient = client;
  client.onStateChanged(state=>{
    console.log('statechanged', state)
    if(state==="CONFLICT") client.forceRefocus();
  });
  client.onAnyMessage(message=>console.log(message.type));
  client.onMessage(async message => {
    try {
    await client.isConnected();
    if (message.mimetype) {
      const filename = `${message.t}.${mime.extension(message.mimetype)}`;
      const mediaData = await decryptMedia(message, uaOverride);
      fs.writeFile(filename, mediaData, function(err) {
        if (err) { return console.log(err); }
        console.log('The file was saved!');
      });
    } else if (message.type==="location") {
        console.log("TCL: location -> message", message.lat, message.lng, message.loc)
    } else if (message.body.indexOf("!location") > -1){
	    await client.sendLocation(message.from, 37.422, -122.084, "Googleplex\nGoogle Headquarters")
	} else if (message.body.indexOf("!gif") > -1){
        await client.sendGiphy(message.from,'https://media.giphy.com/media/oYtVHSxngR3lC/giphy.gif','Oh my god it works');
	} else if ((message.body.indexOf("!dollar") > -1) && (message.body.length >= 10)){
		const currency = message.body.substring(message.body.indexOf("!dollar",0)+8)
		console.log("Getting currency: " + currency);
		var url = 'https://mattdavenport.net/currency/cache/latest.json';
        https.get(url, (resp) => {
          let data = '';
          resp.on('data', (chunk) => { data += chunk; });
          resp.on('end', async () => {
	        const rates = 'rates';
	        var dolarResponse = "💵 1 USD = " + JSON.parse(data)[rates][currency] + " " + currency;
	        await client.reply(message.from, dolarResponse, message.id.toString());	  
	      });
        }).on("error", (err) => { console.log("Error: " + err.message); } );
    } else {
        //do nothing
    }
    } catch (error) {
      console.log("TCL: start -> error", error)
    }
  });
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

app.listen(8082, function () {
  console.log('\n• Listening on port 8081!');
});
