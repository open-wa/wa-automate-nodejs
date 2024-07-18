# Interface: Product

## Properties

### additionalImageCdnUrl?

> `optional` **additionalImageCdnUrl**: `string`[]

Array of URLs of the other images of the product. Does not include the main image.

***

### availability?

> `optional` **availability**: `number` \| `"unknown"`

The availiable quantity of this product.

#### Default

```ts
"unknown"`
```

***

### catalogWid?

> `optional` **catalogWid**: `string`

The id of the catalog in which this product is located.

***

### currency

> **currency**: `string`

The [**ISO 4217**](https://en.wikipedia.org/wiki/ISO_4217) 3 letter currency code. E.g (Swedish krona)
`SEK`

***

### description?

> `optional` **description**: `string`

The description of the product.

***

### id

> **id**: `string`

Product ID

***

### imageCdnUrl?

> `optional` **imageCdnUrl**: `string`

The url of the main image of the product.

NOTE: If downloading manually, the filetype must be changed to .jpg to view the image.

***

### imageCount?

> `optional` **imageCount**: `number`

The number of images of the product.

***

### isHidden?

> `optional` **isHidden**: `boolean`

`true` if the product is hidden from public view.

***

### name?

> `optional` **name**: `string`

The name of the product.

***

### priceAmount1000?

> `optional` **priceAmount1000**: `number`

The price of the product in 1000 units.

***

### retailerId?

> `optional` **retailerId**: `string`

The custom id of the product.

***

### reviewStatus?

> `optional` **reviewStatus**: `"REJECTED"` \| `"NO_REVIEW"` \| `"PENDING"` \| `"APPROVED"` \| `"OUTDATED"`

The review status of the product

***

### t?

> `optional` **t**: `number`

The timestamp when the product was created / 1000

***

### url?

> `optional` **url**: `string`

The URL of the product.
