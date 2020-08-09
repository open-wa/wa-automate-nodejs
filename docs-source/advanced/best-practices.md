# Best Practice

Since this is not an officially sanctioned solution it is temperamental to say the least. Here are some best practices:

1. Keep the session alive
2. Offload most work off of your @open-wa/wa-automate setup (i.e forward all events to a pubsub or something)
3. Keep the phone nearby just in case you need to reauthenticate
4. Use a chrome instance instead of the default chromium instance
5. Use headless: false for easy & quick visual debugging
6. Implement the unread messages functionality on creation of a session so you don't miss any messages upon any downtime.
7. Implement a [promise-queue](https://github.com/sindresorhus/p-queue)
8. Use a unique and valid custom user-agent
9. ```await``` all @open-wa/wa-automate methods just in case
10. Do not run your s@open-wa/wa-automate instance on a Windows machine.
11. Always [kill the session safely](https://github.com/open-wa/wa-automate-nodejs#kill-the-session) upon error or SIGINT.
12. Regularly restart your process to manage memory consumption
13. If memory leaks continue to be an issue then use `cacheEnabled:false` in the config to disable the cache on the page.

```javascript
import { create, Client} from '@open-wa/wa-automate';
const { default: PQueue } = require("p-queue");

const queue = new PQueue({
  concurrency: 4,
  autoStart:false
   });

const proc = async message => {
  //do something with the message here
    console.log(message)
    return true;
}

const processMessage = message => queue.add(()=>proc(message));

async function start(client: Client) {
  const unreadMessages = await client.getAllUnreadMessages();
  unreadMessages.forEach(processMessage)
  ...
  await client.onMessage(processMessage);
  queue.start();
}

create().then(client => start(client));

//1st argument is the session name
//2nd argument is the puppeteer config override
//3rd argument is the user agent override

create({
  // For Mac:
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  // For Windows:
  // executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  headless: false,
  autoRefresh:true,
  cacheEnabled:false,
  customUserAgent: 'some custom user agent'
})
.then(client => start(client));
```