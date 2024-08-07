# Variable: log

> `const` **log**: `Logger`

You can access the log in your code and add your own custom transports
https://github.com/winstonjs/winston#transports
see [Logger](https://github.com/winstonjs/winston#transports) for more details. 

Here is an example of adding the GCP stackdriver transport:

```
import { log } from '@open-wa/wa-automate'
import { LoggingWinston } from '@google-cloud/logging-winston';

const gcpTransport = new LoggingWinston({
    projectId: 'your-project-id',
    keyFilename: '/path/to/keyfile.json'
  });

...
log.add(
 gcpTransport
)

//Congrats! Now all of your session logs will also go to GCP Stackdriver
```
