---
id: "logging_logging.ConfigLogTransport"
title: "Type alias: ConfigLogTransport"
sidebar_label: "ConfigLogTransport"
custom_edit_url: null
---

[logging/logging](/api/modules/logging_logging.md).ConfigLogTransport

Ƭ **ConfigLogTransport**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `done?` | `boolean` | If the transport has already been added to the logger. The logging set up command handles this for you. |
| `options?` | `any` | The options for the transport. Generally only required for syslog but you can use this to override default options for other types of transports. |
| `type` | ``"syslog"`` \| ``"console"`` \| ``"file"`` \| ``"ev"`` | The type of winston transport. At the moment only `file`, `console`, `ev` and `syslog` are supported. |
