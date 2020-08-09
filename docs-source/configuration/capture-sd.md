# Capturing the session data

By default, the session data is saved as a `[sessionId].data.json` file in the process working directory, however, you can disable this ([[skipSessionSave]]) and implement a custom handler for session data. It is important that you always update session data with the latest values. The default behaviour is to override the data.json file with the latest session data.

```javascript
import { ev } from '@open-wa/wa-automate';
const fs = require('fs');

ev.on('sessionData.**', async (sessionData, sessionId) => {
    //do something with sessionData and sessionId
});
```
