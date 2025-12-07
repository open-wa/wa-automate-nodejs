# Remote Socket Client

## How to:

1. Run the EASY API

```bash
> npx @open-wa/wa-automate --socket -p 8002 -k api_key
```

Note: `--socket` flag is required!!

2. Typescript code:

```javascript
import {
    Client,
    SocketClient,
} from "@open-wa/wa-automate-socket-client";

const NUMBER = 'TEST_PHONE_NUMBER@c.us'

const start = async () => {
    const client = await SocketClient.connect(
        "http://localhost:8002",
        "api_key"
    ) as SocketClient & Client;

    client.onAnyMessage((message) => {
        console.log("onAnyMessage", message.id, message.body);
    });

    const socketId = client.socket.id;
    console.log("🚀 ~ file: client.ts ~ line 144 ~ start ~ socketId", socketId);

    console.log(
        "Connected!",
        await client.sendText(NUMBER, "this is a text")
    );
    client
        .sendAudio(
            NUMBER,
            "https://file-examples-com.github.io/uploads/2017/11/file_example_MP3_700KB.mp3"
        )
        .then((audoMessageId) => console.log(audoMessageId));

    console.log(
        await client.sendFile(
            NUMBER,
            "https://file-examples-com.github.io/uploads/2017/04/file_example_MP4_480_1_5MG.mp4",
            "test.mp4",
            "hellow"
        )
    );
};

start();
```
