/**
 * In this example, a simple and safe message queue is to send messages wihtout overwhelming the session.
 * 
 * Here, a quite sensible queue is used. Every second, 2 messages get sent. You can adjust this for your requirements.
 * 
 * https://www.npmjs.com/package/p-queue
 */

// import { create, Client, AvailableWebhooks  } from '@open-wa/wa-automate';
import { create, Client } from '../src/index';

const { default: PQueue } = require("p-queue");
const queue = new PQueue({ concurrency: 2, timeout: 1000 });

create()
  .then(async (client:Client) => {
    const {me} = await client.getMe()

    for (let i = 0; i < 25; i++) {
        await queue.add(()=>client.sendText(me._serialized,''+i))
    }
  })
  .catch(e=>console.log('Error',e.message));