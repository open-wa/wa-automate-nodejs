
export type StickerMetadata = {
    /**
     * The author of the sticker
     * @default ``
     */
    author: string,
    /**
     * The pack of the sticker
     * @default ``
     */
    pack: string
    /**
     * ALPHA FEATURE - NO GUARANTEES IT WILL WORK AS EXPECTED:
     * 
     * [REQUIRES AN INSIDERS LICENSE-KEY](https://gum.co/open-wa?tier=Insiders%20Program)
     * 
     * Attempt to remove the background of the sticker. Only valid for paid licenses.
     * 
     * options:
     * 
     *  `true`  - remove background after resizing
     * 
     *  `HQ`    - remove background before resizing (i.e on original photo)
     * @default `false`
     */
    removebg ?: boolean | 'HQ'
    /**
     * Setting this to `true` will skip the resizing/square-cropping of the sticker. It will instead 'letterbox' the image with a transparent background.
     */
    keepScale ?: boolean
    /**
     * Your Discord ID to get onto the sticker leaderboard!
     */
    discord ?: string
  }

  export type Mp4StickerConversionProcessOptions = {
    /**
     * Desired Frames per second of the sticker output
     * @default `10`
     */
    fps?: number;
    /**
     * The video start time of the sticker
     * @default `00:00:00.0`
     */
    startTime?: string;
    /**
     * The video end time of the sticker. By default, stickers are made from the first 5 seconds of the video
     * @default `00:00:05.0`
     */
    endTime?: string;
    /**
     * The amount of times the video loops in the sticker. To save processing time, leave this as 0
     * default `0`
     */
    loop?: number;
    /**
     * Centres and crops the video.
     * default `true`
     */
    crop?: boolean;
    /**
     * Prints ffmpeg logs in the terminal
     * @default `false`
     */
    log?: boolean
    /**
     * A number representing the WxH of the output sticker (default `512x512`). Lowering this number is a great way to process longer duration stickers. The max value is `512`.
     * default `512`
     */
    square ?: number
  }

  export const defaultProcessOptions : Mp4StickerConversionProcessOptions = {
    fps: 10,
    startTime: `00:00:00.0`,
    endTime :  `00:00:05.0`,
    loop: 0,
    crop: true,
    log: false,
    square: 512
  }