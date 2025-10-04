---
title: Socket Mode
sidebar_position: 4
description: Learn how to use Socket Mode to develop WhatsApp automation solutions with enhanced flexibility and development experience.
---

# Socket Mode

Socket Mode is a powerful feature that allows you to separate your WhatsApp session from your application code. This separation provides several significant benefits:

- **Distributed Architecture**: Run your WhatsApp session and application code on different servers
- **Rapid Development**: Make code changes without waiting for WhatsApp session restarts
- **Multi-Client Support**: Connect multiple socket clients to a single WhatsApp session
- **Enhanced Reliability**: Session persistence even if your application code crashes

## Getting Started

### Step 1: Start the EASY API in Socket Mode

Run the following command to start the EASY API with socket mode enabled:

```bash
npx @open-wa/wa-automate --socket -p 8002 -k your_api_key
```

Important parameters:
- `--socket`: Required flag to enable socket mode
- `-p 8002`: Port number for the socket server (can be customized)
- `-k your_api_key`: Your API key for authentication

### Step 2: Connect Your Application

Here's an example showing how to connect to the socket server and interact with WhatsApp:

```typescript
import {
    Client,
    SocketClient,
} from "@open-wa/wa-automate-socket-client";

const RECIPIENT = 'PHONE_NUMBER@c.us'; // Format: country code + phone number

async function start() {
    // Connect to the socket server
    const client = await SocketClient.connect(
        "http://localhost:8002",
        "your_api_key"
    ) as SocketClient & Client;

    // Log the socket connection ID
    console.log("Socket Connected! ID:", client.socket.id);

    // Listen for incoming messages
    client.onAnyMessage((message) => {
        console.log("New Message:", {
            messageId: message.id,
            content: message.body,
            sender: message.sender.id
        });
    });

    // Example: Sending different types of messages
    
    // Send text message
    const textMsg = await client.sendText(RECIPIENT, "Hello from Socket Mode!");
    console.log("Text message sent:", textMsg);

    // Send audio file
    const audioMsg = await client.sendAudio(
        RECIPIENT,
        "https://example.com/audio.mp3"
    );
    console.log("Audio message sent:", audioMsg);

    // Send video file with caption
    const videoMsg = await client.sendFile(
        RECIPIENT,
        "https://example.com/video.mp4",
        "video.mp4",
        "Check out this video!"
    );
    console.log("Video message sent:", videoMsg);
}

start().catch(console.error);
```

### Error Handling

Always implement proper error handling in your socket client:

```typescript
client.socket.on('error', (error) => {
    console.error('Socket Error:', error);
});

client.socket.on('disconnect', (reason) => {
    console.log('Socket Disconnected:', reason);
});
```

## Best Practices

1. **API Key Security**: Never hardcode your API key in the source code. Use environment variables instead.
2. **Reconnection Logic**: Implement automatic reconnection logic for production environments.
3. **Event Handling**: Set up proper event handlers for all relevant WhatsApp events you need to monitor.
4. **Resource Cleanup**: Properly close socket connections when your application shuts down.

## Common Issues and Solutions

- If you can't connect, verify that the EASY API is running and the port is accessible
- Ensure your API key matches between the server and client
- Check network firewall settings if running on different machines

For more advanced usage and complete API reference, visit our [API Documentation](/api-reference).
