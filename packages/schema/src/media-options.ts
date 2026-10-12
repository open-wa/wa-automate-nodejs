import { z } from 'zod';
import { MessageIdSchema } from './common-types';

const quote = { quotedMsgId: MessageIdSchema.optional().describe('A message in the destination chat to quote') };
const caption = { caption: z.string().optional().describe('Caption for the attachment') };
const viewOnce = { viewOnce: z.boolean().optional().describe('Use WhatsApp view-once media') };

export const ImageSendOptionsSchema = z.strictObject({
  type: z.literal('image'), ...caption, ...quote, ...viewOnce,
});
export const VideoSendOptionsSchema = z.strictObject({
  type: z.literal('video'), ...caption, ...quote, ...viewOnce,
  isGif: z.boolean().optional().describe('Loop an MP4 as a WhatsApp GIF'),
  videoNote: z.boolean().optional().describe('Send a square MP4, at most 60 seconds, as a circular video note (PTV)'),
}).superRefine((options, ctx) => {
  if (options.videoNote && options.isGif) ctx.addIssue({ code: 'custom', path: ['isGif'], message: 'A video note cannot also be a GIF' });
  if (options.isGif && options.viewOnce) ctx.addIssue({ code: 'custom', path: ['viewOnce'], message: 'A GIF cannot be view once' });
  if (options.videoNote && options.caption) ctx.addIssue({ code: 'custom', path: ['caption'], message: 'Video notes do not support captions' });
});
export const AudioSendOptionsSchema = z.strictObject({
  type: z.literal('audio'), ...quote, ...viewOnce,
  ptt: z.boolean().optional().describe('Send audio as a voice note; does not transcode it'),
}).refine(options => !options.viewOnce || options.ptt === true, {
  path: ['viewOnce'], message: 'View-once audio must be a voice note (ptt: true)',
});
export const DocumentSendOptionsSchema = z.strictObject({
  type: z.literal('document'), ...caption, ...quote,
}).describe('Force document presentation, even for an image, video or audio file');
export const AutoMediaSendOptionsSchema = z.strictObject({
  type: z.literal('auto').optional(), ...caption, ...quote, ...viewOnce,
}).describe('Detect presentation from the file MIME type; view once requires an image or video');
export const MediaSendOptionsSchema = z.discriminatedUnion('type', [
  AutoMediaSendOptionsSchema, ImageSendOptionsSchema, VideoSendOptionsSchema,
  AudioSendOptionsSchema, DocumentSendOptionsSchema,
]);
export type MediaSendOptions = z.infer<typeof MediaSendOptionsSchema>;
export type ImageSendOptions = z.infer<typeof ImageSendOptionsSchema>;
export type VideoSendOptions = z.infer<typeof VideoSendOptionsSchema>;
export type AudioSendOptions = z.infer<typeof AudioSendOptionsSchema>;

export const AudioAttachmentOptionsSchema = z.strictObject({ ...quote });
export const VoiceNoteOptionsSchema = z.strictObject({ ...quote, ...viewOnce });
export const GifSendOptionsSchema = z.strictObject({ ...caption, ...quote });
export type AudioAttachmentOptions = z.infer<typeof AudioAttachmentOptionsSchema>;
export type VoiceNoteOptions = z.infer<typeof VoiceNoteOptionsSchema>;
export type GifSendOptions = z.infer<typeof GifSendOptionsSchema>;
