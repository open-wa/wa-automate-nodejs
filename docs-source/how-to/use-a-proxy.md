# Proxying your session

It is extremely simple to use a proxy with @open-wa. We suggest using [luminati.io](https://luminati.io/?affiliate=ref_5f1b9ae8c7669177abfd9fb8) for a reliable and easy way to manage proxies. Once you have your proxy protocol, address, port, username and password you just need to set the [[proxyServerCredentials]] and @open-wa will connect your session via the proxy. For example, if your proxy details are:

```text
//this is dummy data

protocol: http
address: proxies.lum-superproxy.io
port: 1234
username: open-wa
password: antidote
```

then your config will look something like this:

```javascript
create({
  proxyServerCredentials: {
    address: 'http://proxies.lum-superproxy.io:1234',
    username: 'open-wa',
    password: 'antidote'
  }
}).then(client => start(client));
```
