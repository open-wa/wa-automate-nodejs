---
id: "api_model_contact.BusinessProfile"
title: "Interface: BusinessProfile"
sidebar_label: "BusinessProfile"
custom_edit_url: null
---

[api/model/contact](/api/modules/api_model_contact.md).BusinessProfile

## Properties

### address

• **address**: `string`

The address of the business

___

### businessHours

• **businessHours**: [`BusinessHours`](/api/interfaces/api_model_contact.BusinessHours.md)

The operating hours of the business

___

### catalogStatus

• **catalogStatus**: `string`

The status of the business' catalog

___

### categories

• **categories**: [`BizCategory`](/api/interfaces/api_model_contact.BizCategory.md)[]

The business' categories

___

### coverPhoto

• **coverPhoto**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `id` | `string` | The id of the cover photo |
| `url` | `string` | The URL of the cover photo. It might download as an .enc but just change the extension to .jpg |

___

### description

• **description**: `string`

The business description

___

### email

• **email**: `string`

The business' email address

___

### fbPage

• **fbPage**: `any`

The facebook page of the business

___

### id

• **id**: [`ContactId`](/api/types/api_model_aliases.ContactId.md)

The Contact ID of the business

___

### igProfessional

• **igProfessional**: `any`

The instagram profile of the business

___

### isProfileLinked

• **isProfileLinked**: `boolean`

___

### latitude

• **latitude**: `number`

The latitude of the business location if set

___

### longitude

• **longitude**: `number`

The longitude of the business location if set

___

### profileOptions

• **profileOptions**: [`BizProfileOptions`](/api/interfaces/api_model_contact.BizProfileOptions.md)

The business' profile options

___

### tag

• **tag**: `string`

Some special string that identifies the business (?)

___

### website

• **website**: `string`[]

Array of strings that represent the business' websites
