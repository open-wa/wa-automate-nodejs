---
id: "api_model_product.Order"
title: "Interface: Order"
sidebar_label: "Order"
custom_edit_url: null
---

[api/model/product](/api/modules/api_model_product.md).Order

## Properties

### createdAt

• **createdAt**: `number`

epoch ts divided by 1000

___

### currency

• **currency**: `string`

The [**ISO 4217**](https://en.wikipedia.org/wiki/ISO_4217) 3 letter currency code. E.g (Swedish krona)
`SEK`

___

### id

• **id**: `string`

Order ID

___

### message

• `Optional` **message**: [`Message`](/api/interfaces/api_model_message.Message.md)

The message object associated with the order. Only populated in `onOrder` callback.

___

### products

• **products**: [`CartItem`](/api/interfaces/api_model_product.CartItem.md)[]

An array of items in the cart

___

### sellerJid

• **sellerJid**: `string`

___

### subtotal

• **subtotal**: \`${number}\`

___

### total

• **total**: \`${number}\`
