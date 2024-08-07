# Interface: Webhook

## Properties

### events

> **events**: [`SimpleListener`](/reference/api/model/events/enumerations/SimpleListener.md)[]

An array of events that are registered to be sent to this webhook.

***

### id

> **id**: `string`

The ID of the given webhook setup. Use this ID with [[removeWebhook]]

***

### requestConfig?

> `optional` **requestConfig**: `AxiosRequestConfig`\<`any`\>

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

***

### ts

> **ts**: `number`

Time when the webhook was registered in epoch time

***

### url

> **url**: `string`

The endpoint to send (POST) the event to.
