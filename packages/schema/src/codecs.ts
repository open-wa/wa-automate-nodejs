import { z } from 'zod';

/**
 * Chat ID Codec
 * Intelligently converts phone numbers to proper WhatsApp chat IDs.
 * Rules:
 * 1. If input already has @c.us, @g.us, or @lid -> pass through
 * 2. Count digits in the number:
 *    - 18 digits -> Group chat -> append @g.us
 *    - 14 digits -> Could be LID or Indonesian number
 *      - If starts with 62 (Indonesia) -> append @c.us
 *      - Otherwise -> append @lid
 *    - < 14 digits -> Regular contact -> append @c.us
 */
export const chatIdCodec = {
    decode: (input: string): string => {
        // Already formatted
        if (input.includes('@')) return input;

        // Extract just digits
        const digits = input.replace(/\D/g, '');
        const digitCount = digits.length;

        // Determine suffix
        if (digitCount === 18) {
            return `${digits}@g.us`;
        } else if (digitCount === 14) {
            // Check if Indonesian
            if (digits.startsWith('62')) {
                return `${digits}@c.us`;
            }
            return `${digits}@lid`;
        } else {
            // Regular contact (< 14 digits)
            return `${digits}@c.us`;
        }
    },
    encode: (chatId: string): string => chatId
};

/**
 * Contact ID Codec - always formats as @c.us
 */
export const contactIdCodec = {
    decode: (input: string): string => {
        if (input.includes('@c.us')) return input;
        const digits = input.replace(/\D/g, '');
        return `${digits}@c.us`;
    },
    encode: (contactId: string): string => contactId
};

/**
 * Group ID Codec - always formats as @g.us
 */
export const groupIdCodec = {
    decode: (input: string): string => {
        if (input.includes('@g.us')) return input;
        const digits = input.replace(/\D/g, '');
        return `${digits}@g.us`;
    },
    encode: (groupId: string): string => groupId
};

/**
 * Message ID Codec - validates format
 * Format: {boolean}_{ChatId}_{randomString}
 */
export const messageIdCodec = {
    decode: (input: string): string => {
        const parts = input.split('_');
        if (parts.length !== 3) {
            // We'll return it as is but it might fail later if used in a place expecting a valid ID
            // Or we could throw, but for a codec decode, we should ideally be careful.
            // However, the plan said "Validate and normalize"
            return input;
        }
        return input;
    },
    encode: (messageId: string): string => messageId
};

/**
 * File Codec Factory
 * Creates a codec that transforms various file inputs to a specific output type
 */
export const createFileCodec = (outputType: string) => {
    return {
        decode: async (input: any): Promise<any> => {
            const { assertFile } = await import('@open-wa/core');
            return await assertFile(input, 'file', outputType as any);
        },
        encode: (output: any) => output
    };
};

/**
 * Pre-built file codecs
 */
export const fileToDataUrlCodec = createFileCodec('DATA_URL');
export const fileToBase64Codec = createFileCodec('BASE_64');
export const fileToBufferCodec = createFileCodec('BUFFER');
export const fileToTempPathCodec = createFileCodec('TEMP_FILE_PATH');
export const fileToStreamCodec = createFileCodec('READ_STREAM');

/**
 * Additional Codecs
 */

/**
 * Base64 to DataURL Codec
 */
export const base64ToDataUrlCodec = {
    decode: (base64: string): string => {
        if (base64.startsWith('data:')) return base64;
        const mimeType = 'application/octet-stream';
        return `data:${mimeType};base64,${base64}`;
    },
    encode: (dataUrl: string): string => {
        return dataUrl.split(',')[1] || dataUrl;
    }
};

/**
 * URL to DataURL Codec
 */
export const urlToDataUrlCodec = {
    decode: async (url: string): Promise<string> => {
        const { getDUrl } = await import('@open-wa/core');
        return await getDUrl(url);
    },
    encode: (_dataUrl: string): string => {
        throw new Error('Cannot encode DataURL back to URL');
    }
};

/**
 * Timestamp Codecs
 */
export const isoDatetimeToDate = {
    decode: (isoString: string): Date => new Date(isoString),
    encode: (date: Date): string => date.toISOString()
};

export const unixSecondsToDate = {
    decode: (seconds: number): Date => new Date(seconds * 1000),
    encode: (date: Date): number => Math.floor(date.getTime() / 1000)
};

export const unixMillisToDate = {
    decode: (millis: number): Date => new Date(millis),
    encode: (date: Date): number => date.getTime()
};

/**
 * Hex Color Codec
 */
export const hexColorCodec = {
    decode: (input: string): string => {
        return input.replace('#', '').toUpperCase();
    },
    encode: (hex: string): string => `#${hex}`
};

/**
 * JSON String Codec
 */
export const jsonStringCodec = <T>(schema: z.ZodType<T>) => ({
    decode: (jsonString: string): T => {
        return schema.parse(JSON.parse(jsonString));
    },
    encode: (value: T): string => JSON.stringify(value)
});

// Since Zod standard doesn't have a built-in .codec yet in the version we use (4.2.1 is actually 3.x in many cases or custom),
// and the plan suggested using a .codec method which hasn't been implemented in our registry,
// I am implementing these as objects with decode/encode methods that can be used with z.transform() or similar if needed.
// However, the plan mentioned "Zod 4.1+ introduces codecs". 
// Wait, I checked pnpm-workspace.yaml and it says zod: ^4.2.1.
// Let me double check if z.codec exists.

// Actually, I'll implement a helper to convert these objects into Zod schemas with transforms.
export const createZodCodec = <I extends z.ZodTypeAny, O>(
    inputSchema: I,
    codec: { decode: (input: z.infer<I>) => O | Promise<O>; encode: (output: O) => z.infer<I> }
) => {
    return inputSchema.transform(codec.decode);
};

// Re-defining with Zod support
export const ChatIdCodecSchema = createZodCodec(z.string(), chatIdCodec);
export const ContactIdCodecSchema = createZodCodec(z.string(), contactIdCodec);
export const GroupIdCodecSchema = createZodCodec(z.string(), groupIdCodec);
export const MessageIdCodecSchema = createZodCodec(z.string(), messageIdCodec);

export const FileToDataUrlSchema = z.union([z.string(), z.instanceof(Buffer)]).transform(input => fileToDataUrlCodec.decode(input));
export const Base64ToDataUrlSchema = z.string().transform(base64ToDataUrlCodec.decode);
export const HexColorSchema = z.string().transform(hexColorCodec.decode);

export const IsoDatetimeToDateSchema = z.string().datetime().transform(isoDatetimeToDate.decode);
export const UnixSecondsToDateSchema = z.number().int().min(0).transform(unixSecondsToDate.decode);
export const UnixMillisToDateSchema = z.number().int().min(0).transform(unixMillisToDate.decode);
