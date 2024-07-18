# Type Alias: StickerMetadata

> **StickerMetadata**: `object`

## Type declaration

### author

> **author**: `string`

The author of the sticker

#### Default

```ts
``
```

### circle?

> `optional` **circle**: `boolean`

Applies a circular mask to the sticker. Works on images only for now.

### cornerRadius?

> `optional` **cornerRadius**: `number`

The corner radius of the sticker when `stickerMetadata.circle` is set to true.

#### Default

`100`

#### Minimum

`1`

#### Maximum

`100`

#### Multiple Of

`1`

### cropPosition?

> `optional` **cropPosition**: `"top"` \| `"right top"` \| `"right"` \| `"right bottom"` \| `"bottom"` \| `"left bottom"` \| `"left"` \| `"left top"` \| `"north"` \| `"northeast"` \| `"east"` \| `"southeast"` \| `"south"` \| `"southwest"` \| `"west"` \| `"northwest"` \| `"center"` \| `"centre"` \| `"entropy"` \| `"attention"`

Crop position

Learn more: https://sharp.pixelplumbing.com/api-resize

#### Default

`attention`

### discord?

> `optional` **discord**: `string`

Your Discord ID to get onto the sticker leaderboard!

### keepScale?

> `optional` **keepScale**: `boolean`

Setting this to `true` will skip the resizing/square-cropping of the sticker. It will instead 'letterbox' the image with a transparent background.

### pack

> **pack**: `string`

The pack of the sticker

#### Default

```ts
``
```

### removebg?

> `optional` **removebg**: `boolean` \| `"HQ"`

ALPHA FEATURE - NO GUARANTEES IT WILL WORK AS EXPECTED:

[REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)

Attempt to remove the background of the sticker. Only valid for paid licenses.

options:

 `true`  - remove background after resizing

 `HQ`    - remove background before resizing (i.e on original photo)

#### Default

`false`
