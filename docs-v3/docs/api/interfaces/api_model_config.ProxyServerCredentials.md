---
id: "api_model_config.ProxyServerCredentials"
title: "Interface: ProxyServerCredentials"
sidebar_label: "ProxyServerCredentials"
custom_edit_url: null
---

[api/model/config](/api/modules/api_model_config.md).ProxyServerCredentials

## Properties

### address

• **address**: `string`

Proxy Server address. This can include the port e.g '127.0.0.1:5005'

___

### password

• **password**: `string`

Password for Proxy Server authentication

___

### protocol

• `Optional` **protocol**: `string`

The protocol on which the proxy is running. E.g `http`, `https`, `socks4` or `socks5`. This is optional and can be automatically determined from the address.

___

### username

• **username**: `string`

Username for Proxy Server authentication
