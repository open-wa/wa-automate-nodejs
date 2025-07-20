# Proxying your session

It is extremely simple to use a proxy with @open-wa. Once you have your proxy protocol, address, port, username and password you just need to set the [[proxyServerCredentials]] and @open-wa will connect your session via the proxy.

## Supported Proxy Types

@open-wa supports multiple proxy protocols:
- **HTTP/HTTPS**: Standard HTTP proxies
- **SOCKS4**: SOCKS version 4 proxies
- **SOCKS5**: SOCKS version 5 proxies (recommended for better security)
- **SOCKS5H**: SOCKS5 with hostname resolution through proxy

## Configuration Examples

### HTTP Proxy
```javascript
create({
  proxyServerCredentials: {
    protocol: 'http',
    address: 'proxyaddress.abc:1234',
    username: 'open-wa',
    password: 'antidote'
  }
}).then(client => start(client));
```

### SOCKS5 Proxy (Recommended)
```javascript
create({
  proxyServerCredentials: {
    protocol: 'socks5',
    address: 'proxyaddress.abc:1080',
    username: 'open-wa',
    password: 'antidote'
  }
}).then(client => start(client));
```

### Auto-Detection from URL
You can also specify the full proxy URL and the protocol will be auto-detected:

```javascript
create({
  proxyServerCredentials: {
    address: 'socks5://open-wa:antidote@proxyaddress.abc:1080'
  }
}).then(client => start(client));
```

### Without Authentication
For proxies that don't require authentication:

```javascript
create({
  proxyServerCredentials: {
    protocol: 'socks5',
    address: 'proxyaddress.abc:1080'
  }
}).then(client => start(client));
```

## Multi-Session Proxy Configuration

In [Multi-Session Mode](/docs/get-started/multi-session), each session can have its own proxy configuration:

```bash
curl -X POST http://localhost:8080/api/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

## Legacy Format (Still Supported)

The original format is still supported for backward compatibility:

```javascript
create({
  proxyServerCredentials: {
    address: 'http://proxyaddress.abc:1234',
    username: 'open-wa',
    password: 'antidote'
  }
}).then(client => start(client));
```

## Troubleshooting

### Connection Issues
- Verify proxy credentials and address
- Test proxy connectivity outside of @open-wa
- Check firewall settings
- Try different proxy protocols (SOCKS5 is often more reliable)

### Performance Issues
- SOCKS5 generally provides better performance than HTTP proxies
- Consider proxy server location relative to WhatsApp servers
- Monitor proxy server load and bandwidth

### Authentication Errors
- Double-check username and password
- Some proxies may require specific authentication methods
- Try connecting without authentication first to isolate issues