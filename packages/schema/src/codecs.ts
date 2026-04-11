import { z } from 'zod';
import { assertFile, getDUrl } from '@open-wa/utils';

const chatIdPattern = /^\d+(-\d+)?@(c|g)\.us$|^\d+@lid$/;
const contactIdPattern = /^\d+@c\.us$/;
const groupIdPattern = /^\d+(-\d+)?@g\.us$/;
const messageIdPattern = /^(true|false)_.+_.+$/;

/**
 * Chat ID Codec
 * Intelligently converts phone numbers to proper WhatsApp chat IDs.
 */
export const chatIdCodec = {
    decode: (input: string): string => {
        if (input.includes('@')) {
            return input;
        }

        const digits = input.replace(/\D/g, '');
        const digitCount = digits.length;

        if (digitCount === 18) {
            return `${digits}@g.us`;
        }

        if (digitCount === 14 && !digits.startsWith('62')) {
            return `${digits}@lid`;
        }

        return `${digits}@c.us`;
    },
    encode: (chatId: string): string => chatId,
};

/**
 * Contact ID Codec - always formats as @c.us
 */
export const contactIdCodec = {
    decode: (input: string): string => {
        if (input.endsWith('@c.us')) {
            return input;
        }

        return `${input.replace(/\D/g, '')}@c.us`;
    },
    encode: (contactId: string): string => contactId,
};

/**
 * Group ID Codec - always formats as @g.us
 */
export const groupIdCodec = {
    decode: (input: string): string => {
        if (input.endsWith('@g.us')) {
            return input;
        }

        return `${input.replace(/\D/g, '')}@g.us`;
    },
    encode: (groupId: string): string => groupId,
};

/**
 * Message ID Codec - validates format only
 */
export const messageIdCodec = {
    decode: (input: string): string => input,
    encode: (messageId: string): string => messageId,
};

/**
 * File Codec Factory
 */
export const createFileCodec = (outputType: string) => ({
    decode: async (input: unknown): Promise<unknown> => assertFile(input, outputType),
    encode: (output: unknown) => output,
});

export const fileToDataUrlCodec = createFileCodec('DATA_URL');
export const fileToBase64Codec = createFileCodec('BASE_64');
export const fileToBufferCodec = createFileCodec('BUFFER');
export const fileToTempPathCodec = createFileCodec('TEMP_FILE_PATH');
export const fileToStreamCodec = createFileCodec('READ_STREAM');

export const base64ToDataUrlCodec = {
    decode: (base64: string): string => {
        if (base64.startsWith('data:')) {
            return base64;
        }

        return `data:application/octet-stream;base64,${base64}`;
    },
    encode: (dataUrl: string): string => dataUrl.split(',')[1] || dataUrl,
};

export const urlToDataUrlCodec = {
    decode: async (url: string): Promise<string> => getDUrl(url),
    encode: (_dataUrl: string): string => {
        throw new Error('Cannot encode DataURL back to URL');
    },
};

export const isoDatetimeToDate = {
    decode: (isoString: string): Date => new Date(isoString),
    encode: (date: Date): string => date.toISOString(),
};

export const unixSecondsToDate = {
    decode: (seconds: number): Date => new Date(seconds * 1000),
    encode: (date: Date): number => Math.floor(date.getTime() / 1000),
};

export const unixMillisToDate = {
    decode: (millis: number): Date => new Date(millis),
    encode: (date: Date): number => date.getTime(),
};

export const hexColorCodec = {
    decode: (input: string): string => input.replace('#', '').toUpperCase(),
    encode: (hex: string): string => `#${hex}`,
};

export const jsonStringCodec = <T>(schema: z.ZodType<T>) =>
    z.codec(z.string(), schema, {
        decode: (jsonString: string): T => schema.parse(JSON.parse(jsonString)),
        encode: (value: T): string => JSON.stringify(value),
    });

export const ChatIdSchema = z.codec(
    z.string(),
    z.string().regex(chatIdPattern).brand('ChatId'),
    chatIdCodec
);

export const ContactIdSchema = z.codec(
    z.string(),
    z.string().regex(contactIdPattern).brand('ContactId'),
    contactIdCodec
);

export const GroupIdSchema = z.codec(
    z.string(),
    z.string().regex(groupIdPattern).brand('GroupChatId'),
    groupIdCodec
);

export const MessageIdSchema = z.codec(
    z.string(),
    z.string().regex(messageIdPattern).brand('MessageId'),
    messageIdCodec
);

export const ChatIdCodecSchema = ChatIdSchema;
export const ContactIdCodecSchema = ContactIdSchema;
export const GroupIdCodecSchema = GroupIdSchema;
export const MessageIdCodecSchema = MessageIdSchema;

export const FileToDataUrlSchema = z
    .union([z.string(), z.instanceof(Buffer)])
    .transform(async (input) => fileToDataUrlCodec.decode(input))
    .pipe(z.string().regex(/^data:.+;base64,.+$/).brand('DataURL'));

export const Base64ToDataUrlSchema = z.codec(
    z.string(),
    z.string().regex(/^data:.+;base64,.+$/).brand('DataURL'),
    base64ToDataUrlCodec
);

export const HexColorSchema = z.codec(
    z.string(),
    z.string().regex(/^[0-9A-F]+$/),
    hexColorCodec
);

export const IsoDatetimeToDateSchema = z.codec(
    z.iso.datetime(),
    z.date(),
    isoDatetimeToDate
);

export const UnixSecondsToDateSchema = z.codec(
    z.number().int().min(0),
    z.date(),
    unixSecondsToDate
);

export const UnixMillisToDateSchema = z.codec(
    z.number().int().min(0),
    z.date(),
    unixMillisToDate
);
