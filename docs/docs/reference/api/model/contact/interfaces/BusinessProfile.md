# Interface: BusinessProfile

## Properties

### address

> **address**: `string`

The address of the business

***

### businessHours

> **businessHours**: [`BusinessHours`](/reference/api/model/contact/interfaces/BusinessHours.md)

The operating hours of the business

***

### catalogStatus

> **catalogStatus**: `string`

The status of the business' catalog

***

### categories

> **categories**: [`BizCategory`](/reference/api/model/contact/interfaces/BizCategory.md)[]

The business' categories

***

### coverPhoto

> **coverPhoto**: `object`

#### id

> **id**: `string`

The id of the cover photo

#### url

> **url**: `string`

The URL of the cover photo. It might download as an .enc but just change the extension to .jpg

***

### description

> **description**: `string`

The business description

***

### email

> **email**: `string`

The business' email address

***

### fbPage

> **fbPage**: `any`

The facebook page of the business

***

### id

> **id**: [`ContactId`](/reference/api/model/aliases/type-aliases/ContactId.md)

The Contact ID of the business

***

### igProfessional

> **igProfessional**: `any`

The instagram profile of the business

***

### isProfileLinked

> **isProfileLinked**: `boolean`

***

### latitude

> **latitude**: `number`

The latitude of the business location if set

***

### longitude

> **longitude**: `number`

The longitude of the business location if set

***

### profileOptions

> **profileOptions**: [`BizProfileOptions`](/reference/api/model/contact/interfaces/BizProfileOptions.md)

The business' profile options

***

### tag

> **tag**: `string`

Some special string that identifies the business (?)

***

### website

> **website**: `string`[]

Array of strings that represent the business' websites
