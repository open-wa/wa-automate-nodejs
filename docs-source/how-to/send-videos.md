# Send Video

In order to send videos, the client must be started with an instance of chrome! Otherwise videos will be sent as files and not render properly in the app.

To use chrome set [[useChrome]] (finds the chrome installation automatically) to true or set the [[executablePath]] (set the chrome installation path manually).

[[useChrome]] takes a few seconds so to save time in consequtive processes set [[executablePath]] ([[useChrome]] will output the valid [[executablePath]] in the logs so keep an eye on them)

```javascript
    client.sendImage(chatId, dataUrl, 'filename.jpeg', 'cool caption')

    //send image as a reply to another message quotedMessageId
    client.sendImage(chatId, dataUrl, 'filename.jpeg', 'cool caption', quotedMessageId)

    //wait for the Id to be returned
    client.sendImage(chatId, dataUrl, 'filename.jpeg', 'cool caption', null, true)

```

Example of config for sending videos:

```javascript
create({
  // For Mac:
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  // For Windows:
  // executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
}).then(client => start(client));
```
