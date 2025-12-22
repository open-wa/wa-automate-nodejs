# Socket Client Connection Guide

This guide explains how to connect to open-wa v5 using Socket.io.

## Quick Start

```javascript
import { SocketClient } from '@open-wa/socket-client';

// Connect to a v5 server
SocketClient.connect('http://localhost:8080', 'your-api-key-if-needed').then(client => {
    console.log('Connected to WhatsApp session');
    
    // Listen for messages
    await client.listen('onMessage', (message) => {
        console.log('Received message:', message);
    });
    
    // Send a text message
    await client.ask('sendText', {
        to: '1234567890@c.us',
        content: 'Hello from SocketClient!'
    });
}).catch(err => {
    console.error('Connection failed:', err);
});
```

## Configuration Options

### Connection Parameters

- `url` (string): The WebSocket server URL (e.g., `http://localhost:8080`)
- `apiKey` (string, optional): API key for authentication if the server requires one
- `ev` (boolean, default: true): Enable event mode for automatic listener registration

### Server URL Format

The URL should include the protocol and host:
- ✅ `http://localhost:8080`
- ✅ `https://your-server.com:3000`
- ✅ `http://192.168.1.100:8080`

## Authentication

If the server is configured with an API key, include it in the connection:

```javascript
SocketClient.connect('https://api.yourapp.com', 'your-secure-api-key');
```

The API key can be provided as:
- CLI argument: `--api-key=your-key`
- Environment variable: `OPENWA_API_KEY`
- Configuration object in code

## Event Handling

Register listeners for WhatsApp events:

```javascript
// Message events
await client.listen('onMessage', (message) => {
    console.log('New message:', message.body, message.from, message.id);
});

// Connection state events
await client.listen('onStateChanged', (state) => {
    console.log('Connection state:', state);
});

// Chat state events
await client.listen('onChatOpened', (chat) => {
    console.log('Chat opened:', chat.id);
});
```

## Method Calls

### Object Parameters (Recommended)

v5 supports structured object parameters for better type safety:

```javascript
// Modern object style
await client.ask('sendImage', {
    to: '1234567890@c.us',
    imgData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...',
    caption: 'Check this out!',
    filename: 'image.png'
});
```

### Legacy Array Parameters (Backward Compatible)

v5 still supports the old positional array format for backward compatibility:

```javascript
// Legacy array style (still works)
await client.ask('sendText', [
    '1234567890@c.us',
    'Hello from legacy!'
]);
```

## Error Handling

All operations return promises that reject on errors:

```javascript
try {
    await client.ask('sendText', { to: 'invalid-chat', content: 'test' });
} catch (error) {
    console.error('Send failed:', error.message);
    
    // Check error type
    if (error.code === 'VALIDATION_ERROR') {
        console.error('Invalid parameters:', error.details);
    }
}
```

## Error Codes

- `VALIDATION_ERROR`: Invalid input parameters
- `SESSION_NOT_CONNECTED`: Session not in connected state
- `METHOD_NOT_FOUND`: Method not available
- `TIMEOUT`: Operation timed out

## Reconnection

The client handles automatic reconnection with exponential backoff:

```javascript
// The client will automatically reconnect on connection loss
// You can configure reconnection behavior:
const client = await SocketClient.connect(url, apiKey, {
    autoReconnect: true,
    reconnectionDelay: 5000, // 5 seconds
    maxReconnectAttempts: 10
});
```

## Bi-directional Communication

Socket.io supports real-time bidirectional messaging:

```javascript
// Client can send custom events to server
client.emit('customEvent', { 
    type: 'client_action',
    data: 'custom payload'
});

// Server can send events back to client
await client.listen('customServerEvent', (data) => {
    console.log('Server event:', data);
});
```

## TypeScript Support

Full TypeScript types are included:

```typescript
import { SocketClient, Chat, Message } from '@open-wa/socket-client';

const client: SocketClient = await SocketClient.connect(url);

// Full type safety for method calls
const result: MessageId = await client.ask('sendText', {
    to: 'number@c.us',
    content: 'Typed message'
});

// Type-safe event handling
await client.listen('onMessage', (message: Message) => {
    console.log(`Message from ${message.from}: ${message.body}`);
});
```

## Production Considerations

### Connection Persistence
- Use WebSocket secure connections (wss://) in production
- Implement proper error handling and retry logic
- Monitor connection state and handle gracefully

### Performance
- Use connection pooling for multiple clients
- Implement request queuing to prevent message loss
- Monitor memory usage with long-running connections

### Security
- Never expose API keys in client-side code
- Validate server certificates in production
- Use CORS-compatible headers if needed
- Implement rate limiting on the client side

## Troubleshooting

### Connection Issues
1. **Check server URL format** - Include protocol (http/https)
2. **Verify API key** - Ensure correct authentication
3. **Network connectivity** - Check firewall and proxy settings
4. **Server status** - Verify server is running and accessible

### Event Not Firing
1. **Session state** - Ensure WhatsApp session is connected
2. **Event registration** - Use `client.listen()` after connection
3. **Check event names** - Verify correct event spelling

### Method Call Failures
1. **Validation errors** - Check parameter format and types
2. **Permission issues** - Verify session has required permissions
3. **Timeout** - Increase timeout values if needed

## Advanced Usage

### Session Management
```javascript
// Check session status
const isConnected = await client.isConnected();
const sessionId = await client.ask('getSessionId');

// Logout session
await client.ask('logout');
```

### Multi-Device Support
v5 supports multi-device mode automatically when configured:

```javascript
// Multi-device sessions will be handled automatically
// No special client configuration needed
```

For more detailed API documentation, see the generated OpenAPI specification at `/api` endpoint.