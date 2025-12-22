export type StickerMetadata = {
    author: string;
    pack: string;
    removebg?: boolean | 'HQ';
    keepScale?: boolean;
    circle?: boolean;
    discord?: string;
    cropPosition?: 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top' | 'north' | 'northeast' | 'east' | 'southeast' | 'south' | 'southwest' | 'west' | 'northwest' | 'center' | 'centre' | 'entropy' | 'attention';
    cornerRadius?: number;
};
export type Mp4StickerConversionProcessOptions = {
    fps?: number;
    startTime?: string;
    endTime?: string;
    loop?: number;
    crop?: boolean;
    log?: boolean;
    square?: number;
};
export declare const defaultProcessOptions: Mp4StickerConversionProcessOptions;
//# sourceMappingURL=media.d.ts.map