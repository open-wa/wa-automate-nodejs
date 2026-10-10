import type { Client } from '../Client';
import { invokePatch } from '../patchRuntime';
import { resolveMediaInput, mediaSendResult, type MediaInput, type MediaSendResult } from '../mediaInput';

/** Status posting requires the corresponding licensed story payloads. */
export interface StatusMethods {
  postTextStatus(text: string, backgroundColor?: string, font?: number): Promise<MediaSendResult>;
  postImageStatus(image: MediaInput, caption?: string): Promise<MediaSendResult>;
  postVideoStatus(video: MediaInput, caption?: string): Promise<MediaSendResult>;
}

export function statusMethods(client: Client): StatusMethods {
  return {
    async postTextStatus(text, backgroundColor = '#3051D3', font = 0) {
      if (!/^#?(?:[\da-f]{6}|[\da-f]{8})$/i.test(backgroundColor)) throw new Error('Status background must be a six- or eight-digit hex color.');
      if (!Number.isInteger(font) || font < 0 || font > 5) throw new Error('Status font must be an integer from 0 to 5.');
      // The private patch reserves argument two for text color.
      return mediaSendResult(await invokePatch(client, 'postTextStatus', [text, '#FFFFFF', backgroundColor, font]));
    },
    async postImageStatus(image, caption = '') {
      const resolved = await resolveMediaInput(image);
      if (!resolved.mime.startsWith('image/')) throw new Error('postImageStatus requires image media.');
      return mediaSendResult(await invokePatch(client, 'postImageStatus', [resolved.dataUrl, caption]));
    },
    async postVideoStatus(video, caption = '') {
      const resolved = await resolveMediaInput(video);
      if (!resolved.mime.startsWith('video/')) throw new Error('postVideoStatus requires video media.');
      return mediaSendResult(await invokePatch(client, 'postVideoStatus', [resolved.dataUrl, caption]));
    },
  };
}
