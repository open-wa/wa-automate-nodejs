---
id: "api_model_config.Webhook"
title: "Interface: Webhook"
sidebar_label: "Webhook"
custom_edit_url: null
---

[api/model/config](/api/modules/api_model_config.md).Webhook

## Properties

### events

• **events**: [`SimpleListener`](/api/enums/api_model_events.SimpleListener.md)[]

An array of events that are registered to be sent to this webhook.

___

### id

• **id**: `string`

The ID of the given webhook setup. Use this ID with removeWebhook

___

### requestConfig

• `Optional` **requestConfig**: `AxiosRequestConfig`<`any`\>

The optional AxiosRequestConfig to use for firing the webhook event. This can be useful if you want to add some authentication when POSTing data to your server.

For example, if your webhook requires the username `admin` and password `1234` for authentication, you can set the requestConfig to:
```
{
  auth: {
    username: "admin",
    password: "1234",
  }
}
```

Please note, for security reasons, this is not returned when listing webhooks however it is returned when registering a webhook for verification purposes.

___

### ts

• **ts**: `number`

Time when the webhook was registered in epoch time

___

### url

• **url**: `string`

The endpoint to send (POST) the event to.
