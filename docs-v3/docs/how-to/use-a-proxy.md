# Proxying your session

It is extremely simple to use a proxy with @open-wa. Once you have your proxy protocol, address, port, username and password you just need to set the [[proxyServerCredentials]] and @open-wa will connect your session via the proxy. For example, if your proxy details are:

```text
//this is dummy data

protocol: http
address: proxyaddress.abc
port: 1234
username: open-wa
password: antidote
```

then your config will look something like this:

```javascript
create({
  proxyServerCredentials: {
    address: 'http://proxyaddress.abc:1234',
    username: 'open-wa',
    password: 'antidote'
  }
}).then(client => start(client));
```
