/**
 * This example shows how to use client.registerWebhook to easily set up webhooks. You can see the valid webhooks here:
 * https://open-wa.github.io/wa-automate-nodejs/enums/SimpleListener.html
 */

//Please see these docs: https://open-wa.github.io/wa-automate-nodejs/classes/client.html#middleware

// import { create, Client, SimpleListener  } from '@open-wa/wa-automate';
import { create, Client, SimpleListener } from '../src/index';

const express = require('express');
const app = express();
app.use(express.json({limit: '200mb'})) //add the limit option so we can send base64 data through the api
const PORT = 8082;

//Create your webhook here: https://webhook.site/
const WEBHOOK_ADDRESS = 'PASTE_WEBHOOK_DOT_SITE_UNIQUE_URL_HERE'

create({ sessionId:'session1'})
  .then(async (client:Client) => {
    app.use(client.middleware());
    Object.keys(SimpleListener).map(eventKey=>client.registerWebhook(SimpleListener[eventKey],WEBHOOK_ADDRESS))
    app.listen(PORT, ()=>console.log(`\n• Listening on port ${PORT}!`));
  })
  .catch(e=>console.log('Error',e.message));