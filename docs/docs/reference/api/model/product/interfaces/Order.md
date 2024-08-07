# Interface: Order

## Properties

### createdAt

> **createdAt**: `number`

epoch ts divided by 1000

***

### currency

> **currency**: `string`

The [**ISO 4217**](https://en.wikipedia.org/wiki/ISO_4217) 3 letter currency code. E.g (Swedish krona)
`SEK`

***

### id

> **id**: `string`

Order ID

***

### message?

> `optional` **message**: [`Message`](/reference/api/model/message/interfaces/Message.md)

The message object associated with the order. Only populated in `onOrder` callback.

***

### products

> **products**: [`CartItem`](/reference/api/model/product/interfaces/CartItem.md)[]

An array of items in the cart

***

### sellerJid

> **sellerJid**: `string`

***

### subtotal

> **subtotal**: \`$\{number\}\`

***

### total

> **total**: \`$\{number\}\`
