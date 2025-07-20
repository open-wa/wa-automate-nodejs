# Multi-Session Mode

Multi-Session Mode allows you to run multiple WhatsApp sessions simultaneously on a single server instance. Each session is independent and can connect to different WhatsApp accounts, making it ideal for managing multiple WhatsApp numbers or building multi-tenant applications.

## Overview

The multi-session server provides:
- **Multiple Independent Sessions**: Run multiple WhatsApp sessions simultaneously
- **REST API**: Complete API for session management and messaging
- **Web UI**: Browser-based interface for managing sessions
- **Session Persistence**: Sessions are automatically restored on server restart
- **Enhanced Proxy Support**: Per-session proxy configuration including SOCKS5
- **Real-time Status**: Live session status monitoring and QR code generation

## Quick Start

### 1. Build the Project

```bash
npm run build
```

### 2. Start Multi-Session Server

```bash
# Start with default settings
node bin/multi-session.js

# Or specify custom port and limits
node bin/multi-session.js --port 3000 --max-sessions 5 --use-chrome
```

### 3. Access the Web Interface

Open your browser and navigate to:
- **Web UI**: `http://localhost:8080` (or your configured port)
- **API Documentation**: `http://localhost:8080/api-docs`
- **Server Info**: `http://localhost:8080/info`

## Server Configuration

### Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--port <port>` | Server port | 8080 |
| `--host <host>` | Server host | 0.0.0.0 |
| `--max-sessions <number>` | Maximum concurrent sessions | 10 |
| `--use-chrome` | Use Chrome instead of Chromium | false |
| `--webhook-host <host>` | Public host for webhooks | localhost |

### Example Configurations

```bash
# Production setup with custom limits
node bin/multi-session.js --port 3000 --max-sessions 20 --host 0.0.0.0

# Development with Chrome
node bin/multi-session.js --port 8080 --use-chrome --max-sessions 5

# With webhook support
node bin/multi-session.js --webhook-host your-domain.com --port 3000
```

## API Endpoints

### Session Management

#### Create New Session
```bash
curl -X POST http://localhost:8080/api/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "my-session-1",
    "waitForQR": true,
    "config": {
      "multiDevice": true,
      "headless": true
    }
  }'
```

#### Get All Sessions
```bash
curl http://localhost:8080/api/v1/sessions
```

#### Get Session Status
```bash
curl http://localhost:8080/api/v1/sessions/my-session-1/status
```

#### Get QR Code
```bash
# JSON response with base64 QR code
curl http://localhost:8080/api/v1/sessions/my-session-1/qr

# Direct PNG image
curl http://localhost:8080/api/v1/sessions/my-session-1/qr/image
```

#### Remove Session
```bash
curl -X DELETE http://localhost:8080/api/v1/sessions/my-session-1
```

### Messaging

#### Send Text Message
```bash
curl -X POST http://localhost:8080/api/v1/sessions/my-session-1/send-text \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "1234567890@c.us",
    "content": "Hello from multi-session!"
  }'
```

#### Send Media
```bash
curl -X POST http://localhost:8080/api/v1/sessions/my-session-1/send-image \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "1234567890@c.us",
    "data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "filename": "image.png",
    "caption": "Sent via multi-session API"
  }'
```

## Session Configuration

### Basic Session Config
```json
{
  "sessionId": "my-session",
  "config": {
    "multiDevice": true,
    "headless": true,
    "qrTimeout": 120,
    "authTimeout": 60
  }
}
```

### With Proxy Configuration
```json
{
  "sessionId": "proxy-session",
  "config": {
    "multiDevice": true,
    "headless": true,
    "proxyServerCredentials": {
      "protocol": "socks5",
      "address": "proxy.example.com:1080",
      "username": "user",
      "password": "pass"
    }
  }
}
```

### Advanced Configuration
```json
{
  "sessionId": "advanced-session",
  "config": {
    "multiDevice": true,
    "headless": true,
    "useChrome": true,
    "chromiumArgs": ["--no-sandbox", "--disable-dev-shm-usage"],
    "qrTimeout": 180,
    "authTimeout": 90,
    "restartOnCrash": true,
    "killProcessOnBrowserClose": false
  }
}
```

## Web Interface

The multi-session server includes a built-in web interface accessible at `http://localhost:8080` that provides:

### Features
- **Session Overview**: View all sessions and their status
- **QR Code Display**: Real-time QR code generation and display
- **Session Management**: Create, start, stop, and delete sessions
- **Live Status**: Real-time session status updates
- **Configuration**: Easy session configuration through forms
- **Logs**: View session logs and error messages

### Usage
1. Open `http://localhost:8080` in your browser
2. Click "New Session" to create a session
3. Configure session settings (ID, proxy, etc.)
4. Click "Create" and scan the QR code with WhatsApp
5. Monitor session status in real-time

## Session Persistence

Sessions are automatically saved and restored:

### Session Data Location
```
./sessions/
├── session-1/
│   ├── config.json
│   └── session-data/
├── session-2/
│   ├── config.json
│   └── session-data/
└── ...
```

### Automatic Restoration
- Sessions are restored on server restart
- Authentication data is preserved
- Configuration is maintained
- Failed sessions are marked for cleanup

## Proxy Support

Multi-session mode supports various proxy types:

### Supported Protocols
- HTTP/HTTPS
- SOCKS4
- SOCKS5
- SOCKS5H (hostname resolution through proxy)

### Configuration Examples

#### HTTP Proxy
```json
{
  "proxyServerCredentials": {
    "protocol": "http",
    "address": "proxy.example.com:8080",
    "username": "user",
    "password": "pass"
  }
}
```

#### SOCKS5 Proxy
```json
{
  "proxyServerCredentials": {
    "protocol": "socks5",
    "address": "proxy.example.com:1080",
    "username": "user",
    "password": "pass"
  }
}
```

#### Auto-Detection
```json
{
  "proxyServerCredentials": {
    "address": "socks5://user:pass@proxy.example.com:1080"
  }
}
```

## Best Practices

### Resource Management
- Limit concurrent sessions based on server resources
- Monitor memory usage with multiple sessions
- Use headless mode for better performance
- Configure appropriate timeouts

### Security
- Use authentication keys for API access
- Implement rate limiting for public APIs
- Secure proxy credentials
- Monitor session access logs

### Scaling
- Start with fewer sessions and scale up
- Monitor CPU and memory usage
- Use load balancing for high availability
- Implement session health checks

## Troubleshooting

### Common Issues

#### Session Won't Start
```bash
# Check session logs
curl http://localhost:8080/api/v1/sessions/my-session/logs

# Verify configuration
curl http://localhost:8080/api/v1/sessions/my-session
```

#### QR Code Not Generated
- Ensure `waitForQR: true` in session creation
- Check if session is in correct state
- Verify browser process is running

#### Proxy Connection Failed
- Test proxy connectivity separately
- Verify credentials and protocol
- Check firewall settings

### Debug Mode
```bash
# Start with debug logging
DEBUG=* node bin/multi-session.js

# Or specific debug categories
DEBUG=wa:* node bin/multi-session.js
```

## Migration from Single Session

### From CLI Mode
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
```

## Examples

### Node.js Client
```javascript
const axios = require('axios');

class MultiSessionClient {
  constructor(baseURL = 'http://localhost:8080') {
    this.api = axios.create({ baseURL: `${baseURL}/api/v1` });
  }

  async createSession(sessionId, config = {}) {
    const response = await this.api.post('/sessions', {
      sessionId,
      waitForQR: true,
      config: { multiDevice: true, headless: true, ...config }
    });
    return response.data;
  }

  async sendMessage(sessionId, chatId, content) {
    const response = await this.api.post(`/sessions/${sessionId}/send-text`, {
      chatId,
      content
    });
    return response.data;
  }

  async getSessionStatus(sessionId) {
    const response = await this.api.get(`/sessions/${sessionId}/status`);
    return response.data;
  }
}

// Usage
const client = new MultiSessionClient();
await client.createSession('my-bot', { qrTimeout: 120 });
await client.sendMessage('my-bot', '1234567890@c.us', 'Hello!');
```

### Python Client
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

# Usage
client = MultiSessionClient()
client.create_session("my-bot", {"qrTimeout": 120})
client.send_message("my-bot", "1234567890@c.us", "Hello from Python!")
```

## Next Steps

- Explore the [API Reference](/docs/reference/api) for detailed endpoint documentation
- Learn about [Session Management](/docs/configuration/multiple-sessions) concepts
- Check out [Proxy Configuration](/docs/how-to/use-a-proxy) for advanced proxy setups
- See [Best Practices](/docs/advanced/best-practices) for production deployments