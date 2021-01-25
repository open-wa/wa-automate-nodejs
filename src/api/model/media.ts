
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
  }

  export const defaultProcessOptions : Mp4StickerConversionProcessOptions = {
    fps: 10,
    startTime: `00:00:00.0`,
    endTime :  `00:00:05.0`,
    loop: 0,
    crop: true,
    log: false
  }