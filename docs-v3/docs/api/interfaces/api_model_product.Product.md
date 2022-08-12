---
id: "api_model_product.Product"
title: "Interface: Product"
sidebar_label: "Product"
custom_edit_url: null
---

[api/model/product](/api/modules/api_model_product.md).Product

## Properties

### additionalImageCdnUrl

• `Optional` **additionalImageCdnUrl**: `string`[]

Array of URLs of the other images of the product. Does not include the main image.

___

### availability

• `Optional` **availability**: `number` \| ``"unknown"``

The availiable quantity of this product.

**`Default`**

"unknown"`

___

### catalogWid

• `Optional` **catalogWid**: `string`

The id of the catalog in which this product is located.

___

### currency

• **currency**: `string`

The [**ISO 4217**](https://en.wikipedia.org/wiki/ISO_4217) 3 letter currency code. E.g (Swedish krona)
`SEK`

___

### description

• `Optional` **description**: `string`

The description of the product.

___

### id

• **id**: `string`

Product ID

___

### imageCdnUrl

• `Optional` **imageCdnUrl**: `string`

The url of the main image of the product.

NOTE: If downloading manually, the filetype must be changed to .jpg to view the image.

___

### imageCount

• `Optional` **imageCount**: `number`

The number of images of the product.

___

### isHidden

• `Optional` **isHidden**: `boolean`

`true` if the product is hidden from public view.

___

### name

• `Optional` **name**: `string`

The name of the product.

___

### priceAmount1000

• `Optional` **priceAmount1000**: `number`

The price of the product in 1000 units.

___

### retailerId

• `Optional` **retailerId**: `string`

The custom id of the product.

___

### reviewStatus

• `Optional` **reviewStatus**: ``"NO_REVIEW"`` \| ``"PENDING"`` \| ``"REJECTED"`` \| ``"APPROVED"`` \| ``"OUTDATED"``

The review status of the product

___

### t

• `Optional` **t**: `number`

The timestamp when the product was created / 1000

___

### url

• `Optional` **url**: `string`

The URL of the product.
