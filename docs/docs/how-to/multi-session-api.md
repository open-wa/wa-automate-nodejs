# Multi-Session API Reference

The Multi-Session API provides REST endpoints for managing multiple WhatsApp sessions programmatically. This comprehensive reference covers all available endpoints, request/response formats, and usage examples.

## Base URL

All API endpoints are relative to your multi-session server:
```
http://localhost:8080/api/v1
```

## Authentication

Currently, the API uses basic authentication. You can secure your API by:
- Running behind a reverse proxy with authentication
- Using firewall rules to restrict access
- Implementing custom authentication middleware

## Session Management Endpoints

### Create Session

Creates a new WhatsApp session with optional configuration.

**Endpoint:** `POST /sessions`

**Request Body:**
```json
{
  "sessionId": "string",
  "waitForQR": boolean,
  "config": {
    "multiDevice": boolean,
    "headless": boolean,
    "qrTimeout": number,
    "authTimeout": number,
    "proxyServerCredentials": {
      "protocol": "string",
      "address": "string", 
      "username": "string",
      "password": "string"
    }
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Session created successfully",
  "data": {
    "sessionId": "my-session-1",
    "status": "initializing",
    "createdAt": "2025-07-20T16:03:18Z",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

**Example:**
```bash
curl -X POST http://localhost:8080/api/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "my-bot",
    "waitForQR": true,
    "config": {
      "multiDevice": true,
      "headless": true,
      "qrTimeout": 120
    }
  }'
```

### Get All Sessions

Retrieves information about all active sessions.

**Endpoint:** `GET /sessions`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "sessionId": "session-1",
      "status": "ready",
      "createdAt": "2025-07-20T16:03:18Z",
      "lastActivity": "2025-07-20T16:05:30Z"
    },
    {
      "sessionId": "session-2", 
      "status": "qr_ready",
      "createdAt": "2025-07-20T16:04:22Z",
      "lastActivity": "2025-07-20T16:04:22Z"
    }
  ]
}
```

### Get Session Info

Retrieves detailed information about a specific session.

**Endpoint:** `GET /sessions/{sessionId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "my-session",
    "status": "ready",
    "createdAt": "2025-07-20T16:03:18Z",
    "lastActivity": "2025-07-20T16:05:30Z",
    "config": {
      "multiDevice": true,
      "headless": true,
      "qrTimeout": 120
    }
  }
}
```

### Get Session Status

Gets the current status of a session.

**Endpoint:** `GET /sessions/{sessionId}/status`

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "lastActivity": "2025-07-20T16:05:30Z"
  }
}
```

**Status Values:**
- `initializing` - Session is being created
- `qr_ready` - QR code is available for scanning
- `authenticated` - QR code scanned, authenticating
- `ready` - Session is active and ready
- `failed` - Session failed to start
- `terminated` - Session has been stopped

### Get QR Code

Retrieves the QR code for session authentication.

**Endpoint:** `GET /sessions/{sessionId}/qr`

**Response:**
```json
{
  "success": true,
  "data": {
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "expiresAt": "2025-07-20T16:08:18Z"
  }
}
```

### Get QR Code Image

Returns the QR code as a PNG image directly.

**Endpoint:** `GET /sessions/{sessionId}/qr/image`

**Response:** PNG image data

**Example:**
```bash
curl http://localhost:8080/api/v1/sessions/my-session/qr/image -o qr-code.png
```

### Remove Session

Stops and removes a session.

**Endpoint:** `DELETE /sessions/{sessionId}`

**Response:**
```json
{
  "success": true,
  "message": "Session removed successfully"
}
```

## Messaging Endpoints

### Send Text Message

Sends a text message to a chat.

**Endpoint:** `POST /sessions/{sessionId}/send-text`

**Request Body:**
```json
{
  "chatId": "1234567890@c.us",
  "content": "Hello, World!",
  "quotedMessageId": "optional-message-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "true_1234567890@c.us_ABC123",
    "chatId": "1234567890@c.us",
    "content": "Hello, World!",
    "timestamp": 1642694598
  }
}
```

### Send Image

Sends an image to a chat.

**Endpoint:** `POST /sessions/{sessionId}/send-image`

**Request Body:**
```json
{
  "chatId": "1234567890@c.us",
  "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "filename": "image.png",
  "caption": "Optional caption",
  "quotedMessageId": "optional-message-id"
}
```

### Send File

Sends a file to a chat.

**Endpoint:** `POST /sessions/{sessionId}/send-file`

**Request Body:**
```json
{
  "chatId": "1234567890@c.us",
  "data": "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PA...",
  "filename": "document.pdf",
  "caption": "Optional caption"
}
```

### Send Audio

Sends an audio file to a chat.

**Endpoint:** `POST /sessions/{sessionId}/send-audio`

**Request Body:**
```json
{
  "chatId": "1234567890@c.us",
  "data": "data:audio/mp3;base64,SUQzAwAAAAABAAA...",
  "filename": "audio.mp3"
}
```

## Chat Management Endpoints

### Get All Chats

Retrieves all chats for a session.

**Endpoint:** `GET /sessions/{sessionId}/chats`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1234567890@c.us",
      "name": "John Doe",
      "isGroup": false,
      "unreadCount": 2,
      "lastMessage": {
        "body": "Hello!",
        "timestamp": 1642694598
      }
    }
  ]
}
```

### Get Chat Messages

Retrieves messages from a specific chat.

**Endpoint:** `GET /sessions/{sessionId}/chats/{chatId}/messages`

**Query Parameters:**
- `limit` (optional): Number of messages to retrieve (default: 50)
- `before` (optional): Message ID to paginate before

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "true_1234567890@c.us_ABC123",
      "body": "Hello!",
      "fromMe": false,
      "timestamp": 1642694598,
      "author": "1234567890@c.us",
      "type": "chat"
    }
  ]
}
```

## Contact Management Endpoints

### Get All Contacts

Retrieves all contacts for a session.

**Endpoint:** `GET /sessions/{sessionId}/contacts`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1234567890@c.us",
      "name": "John Doe",
      "pushname": "John",
      "isMyContact": true,
      "isWAContact": true
    }
  ]
}
```

### Get Contact Info

Retrieves information about a specific contact.

**Endpoint:** `GET /sessions/{sessionId}/contacts/{contactId}`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "1234567890@c.us",
    "name": "John Doe",
    "pushname": "John",
    "isMyContact": true,
    "isWAContact": true,
    "profilePicThumbObj": {
      "eurl": "https://...",
      "id": "...",
      "img": "data:image/jpeg;base64,..."
    }
  }
}
```

## Group Management Endpoints

### Create Group

Creates a new WhatsApp group.

**Endpoint:** `POST /sessions/{sessionId}/groups`

**Request Body:**
```json
{
  "name": "My Group",
  "participants": ["1234567890@c.us", "0987654321@c.us"],
  "description": "Optional group description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "gid": "1234567890-1642694598@g.us",
    "participants": [
      {
        "id": "1234567890@c.us",
        "status": 200
      }
    ]
  }
}
```

### Add Participants

Adds participants to a group.

**Endpoint:** `POST /sessions/{sessionId}/groups/{groupId}/participants`

**Request Body:**
```json
{
  "participants": ["1234567890@c.us", "0987654321@c.us"]
}
```

### Remove Participants

Removes participants from a group.

**Endpoint:** `DELETE /sessions/{sessionId}/groups/{groupId}/participants`

**Request Body:**
```json
{
  "participants": ["1234567890@c.us"]
}
```

## Webhook Endpoints

### Register Webhook

Registers a webhook URL for receiving events.

**Endpoint:** `POST /sessions/{sessionId}/webhooks`

**Request Body:**
```json
{
  "url": "https://your-server.com/webhook",
  "events": ["message", "ack", "group_join"],
  "headers": {
    "Authorization": "Bearer your-token"
  }
}
```

### List Webhooks

Lists all registered webhooks for a session.

**Endpoint:** `GET /sessions/{sessionId}/webhooks`

### Remove Webhook

Removes a registered webhook.

**Endpoint:** `DELETE /sessions/{sessionId}/webhooks/{webhookId}`

## Server Information Endpoints

### Get Server Info

Retrieves information about the multi-session server.

**Endpoint:** `GET /info`

**Response:**
```json
{
  "success": true,
  "data": {
    "version": "4.76.0",
    "maxSessions": 10,
    "activeSessions": 3,
    "uptime": 3600,
    "memory": {
      "used": "256MB",
      "total": "1GB"
    }
  }
}
```

### Health Check

Checks the health status of the server.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-07-20T16:03:18Z",
    "checks": {
      "database": "ok",
      "sessions": "ok",
      "memory": "ok"
    }
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session with ID 'invalid-session' not found",
    "details": {}
  }
}
```

**Common Error Codes:**
- `SESSION_NOT_FOUND` - Session doesn't exist
- `SESSION_NOT_READY` - Session is not in ready state
- `INVALID_CHAT_ID` - Chat ID format is invalid
- `MAX_SESSIONS_REACHED` - Server has reached maximum session limit
- `VALIDATION_ERROR` - Request validation failed
- `INTERNAL_ERROR` - Server internal error

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **Session Creation**: 5 requests per minute
- **Messaging**: 30 requests per minute per session
- **General API**: 100 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 29
X-RateLimit-Reset: 1642694658
```

## WebSocket Events

For real-time updates, connect to the WebSocket endpoint:

**Endpoint:** `ws://localhost:8080/ws/{sessionId}`

**Event Types:**
- `qr` - New QR code generated
- `authenticated` - Session authenticated
- `ready` - Session ready
- `message` - New message received
- `ack` - Message acknowledgment
- `disconnected` - Session disconnected

**Example Event:**
```json
{
  "event": "message",
  "sessionId": "my-session",
  "data": {
    "id": "true_1234567890@c.us_ABC123",
    "body": "Hello!",
    "from": "1234567890@c.us",
    "timestamp": 1642694598
  }
}
```

## SDK Examples

### JavaScript/Node.js

```javascript
class MultiSessionClient {
  constructor(baseURL = 'http://localhost:8080') {
    this.baseURL = `${baseURL}/api/v1`;
  }

  async createSession(sessionId, config = {}) {
    const response = await fetch(`${this.baseURL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        waitForQR: true,
        config: { multiDevice: true, headless: true, ...config }
      })
    });
    return response.json();
  }

  async sendMessage(sessionId, chatId, content) {
    const response = await fetch(`${this.baseURL}/sessions/${sessionId}/send-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId, content })
    });
    return response.json();
  }

  async getChats(sessionId) {
    const response = await fetch(`${this.baseURL}/sessions/${sessionId}/chats`);
    return response.json();
  }
}

// Usage
const client = new MultiSessionClient();
await client.createSession('my-bot');
await client.sendMessage('my-bot', '1234567890@c.us', 'Hello!');
const chats = await client.getChats('my-bot');
```

### Python

```python
import requests
import json

class MultiSessionClient:
    def __init__(self, base_url="http://localhost:8080"):
        self.base_url = f"{base_url}/api/v1"
    
    def create_session(self, session_id, config=None):
        if config is None:
            config = {"multiDevice": True, "headless": True}
        
        response = requests.post(f"{self.base_url}/sessions", json={
            "sessionId": session_id,
            "waitForQR": True,
            "config": config
        })
        return response.json()
    
    def send_message(self, session_id, chat_id, content):
        response = requests.post(f"{self.base_url}/sessions/{session_id}/send-text", json={
            "chatId": chat_id,
            "content": content
        })
        return response.json()
    
    def get_chats(self, session_id):
        response = requests.get(f"{self.base_url}/sessions/{session_id}/chats")
        return response.json()

# Usage
client = MultiSessionClient()
client.create_session("my-bot")
client.send_message("my-bot", "1234567890@c.us", "Hello!")
chats = client.get_chats("my-bot")
```

## Best Practices

### Session Management
- Use descriptive session IDs
- Monitor session status regularly
- Implement proper error handling
- Clean up unused sessions

### Message Handling
- Validate chat IDs before sending
- Handle rate limiting gracefully
- Use appropriate message types
- Implement retry logic for failed messages

### Security
- Secure your API endpoints
- Validate all input data
- Use HTTPS in production
- Implement proper authentication

### Performance
- Limit concurrent sessions based on resources
- Use webhooks for real-time events
- Implement proper caching
- Monitor memory usage

## Migration Guide

### From Single Session CLI
```bash
# Old way
npx @open-wa/wa-automate --port 8080

# New multi-session way
node bin/multi-session.js --port 8080
```

### From Custom Code
```javascript
// Old single session
const { create } = require('@open-wa/wa-automate');
const client = await create({ sessionId: 'session1' });
client.onMessage(message => console.log(message));

// New multi-session API
const response = await fetch('http://localhost:8080/api/v1/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'session1',
    waitForQR: true,
    config: { multiDevice: true, headless: true }
  })
});

// Use webhooks for message handling
await fetch('http://localhost:8080/api/v1/sessions/session1/webhooks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://your-server.com/webhook',
    events: ['message']
  })
});
```