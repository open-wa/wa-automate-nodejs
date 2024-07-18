# Interface: ProxyServerCredentials

## Properties

### address

> **address**: `string`

Proxy Server address. This can include the port e.g '127.0.0.1:5005'

***

### password

> **password**: `string`

Password for Proxy Server authentication

***

### protocol?

> `optional` **protocol**: `string`

The protocol on which the proxy is running. E.g `http`, `https`, `socks4` or `socks5`. This is optional and can be automatically determined from the address.

***

### username

> **username**: `string`

Username for Proxy Server authentication
