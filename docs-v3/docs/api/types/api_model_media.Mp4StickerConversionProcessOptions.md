---
id: "api_model_media.Mp4StickerConversionProcessOptions"
title: "Type alias: Mp4StickerConversionProcessOptions"
sidebar_label: "Mp4StickerConversionProcessOptions"
custom_edit_url: null
---

[api/model/media](/api/modules/api_model_media.md).Mp4StickerConversionProcessOptions

Ƭ **Mp4StickerConversionProcessOptions**: `Object`

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `crop?` | `boolean` | Centres and crops the video. default `true` |
| `endTime?` | `string` | The video end time of the sticker. By default, stickers are made from the first 5 seconds of the video  **`Default`**  `00:00:05.0` |
| `fps?` | `number` | Desired Frames per second of the sticker output  **`Default`**  `10` |
| `log?` | `boolean` | Prints ffmpeg logs in the terminal  **`Default`**  `false` |
| `loop?` | `number` | The amount of times the video loops in the sticker. To save processing time, leave this as 0 default `0` |
| `square?` | `number` | A number representing the WxH of the output sticker (default `512x512`). Lowering this number is a great way to process longer duration stickers. The max value is `512`. default `512` |
| `startTime?` | `string` | The video start time of the sticker  **`Default`**  `00:00:00.0` |
