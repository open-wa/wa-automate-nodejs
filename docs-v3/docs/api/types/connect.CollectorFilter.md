---
id: "connect.CollectorFilter"
title: "Type alias: CollectorFilter<T>"
sidebar_label: "CollectorFilter"
custom_edit_url: null
---

[connect](/api/modules/connect.md).CollectorFilter

Ƭ **CollectorFilter**<`T`\>: (...`args`: `T`) => `boolean` \| `Promise`<`boolean`\>

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `any`[] |

#### Type declaration

▸ (...`args`): `boolean` \| `Promise`<`boolean`\>

Filter to be applied to the collector.

##### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `...args` | `T` | Any arguments received by the listener |

##### Returns

`boolean` \| `Promise`<`boolean`\>
