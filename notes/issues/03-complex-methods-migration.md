# Issue #3: Complex Methods Migration Strategy

**Priority**: 🟡 HIGH  
**Effort**: 3-5 days (full), 1-2 days (critical subset)  
**Impact**: Completes API surface for common use cases

---

## Problem Statement

40 "complex" methods have client-side logic beyond simple WAPI calls:

| Category | Count | Examples |
|----------|-------|----------|
| Sticker Conversion | 10 | `sendImageAsSticker`, `sendMp4AsSticker` |
| File Transfer | 2 | `sendFileFromUrl`, `sendGiphy` |
| Media Operations | 4 | `decryptMedia`, `downloadMedia` |
| Message Loading | 3 | `loadEarlierMessages`, `loadAllEarlierMessages` |
| Product/Catalog | 3 | `sendProduct`, `sendCustomProduct` |
| Other | 18 | Various utility methods |

These methods require custom implementations in core, not just WAPI fallback.

---

## Strategy: Schema + Custom Implementation

Use `defineMethodV2` for the schema (types, docs, routes), then `implementMethod` with custom logic.

### Pattern

```typescript
// 1. Schema definition (@open-wa/schema)
export const decryptMedia = defineMethodV2('decryptMedia', {
    meta: {
        description: 'Decrypts media from a message',
        action: 'read',
        namespace: 'media',
        license: 'none',
    },
    input: z.object({
        message: z.any(), // MessageSchema
    }),
    parameterOrder: ['message'],
    output: z.string(), // base64
});

// 2. Custom implementation (@open-wa/core)
implementMethod(decryptMedia, async function(this: Client, params) {
    const message = params.message;
    
    // Custom logic: fetch, decrypt, convert
    const buffer = await this.downloadMediaBuffer(message);
    const decrypted = await decrypt(buffer, message.mediaKey);
    
    return decrypted.toString('base64');
});
```

---

## Step 1: Add Complex Method Schemas

**File**: `packages/schema/src/methods/media.ts` (NEW)

```typescript
import { z } from 'zod';
import { defineMethodV2 } from '../registry';
import { messageIdParam } from '../parameters';

// ============================================================================
// Media Operations
// ============================================================================

/**
 * Decrypts media from a message and returns as base64
 */
export const decryptMedia = defineMethodV2('decryptMedia', {
    meta: {
        description: 'Decrypts and returns media from a message as base64',
        action: 'read',
        namespace: 'media',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        message: z.any().describe('Message object containing media'),
    }),
    parameterOrder: ['message'],
    output: z.string().describe('Base64 encoded media'),
});

/**
 * Downloads media from a message to a local file
 */
export const downloadMedia = defineMethodV2('downloadMedia', {
    meta: {
        description: 'Downloads media from a message to a local file path',
        action: 'read',
        namespace: 'media',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        message: z.any().describe('Message object containing media'),
        path: z.string().describe('Local file path to save media'),
    }),
    parameterOrder: ['message', 'path'],
    output: z.string().describe('Path where media was saved'),
});

/**
 * Gets a decryptable sticker message
 */
export const getStickerDecryptable = defineMethodV2('getStickerDecryptable', {
    meta: {
        description: 'Gets the decryptable version of a sticker message',
        action: 'read',
        namespace: 'media',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        messageId: messageIdParam,
    }),
    parameterOrder: ['messageId'],
    output: z.any().describe('Message with decryptable sticker data'),
});

/**
 * Forces update of stale media
 */
export const forceStaleMediaUpdate = defineMethodV2('forceStaleMediaUpdate', {
    meta: {
        description: 'Forces refresh of stale/expired media',
        action: 'update',
        namespace: 'media',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        messageId: messageIdParam,
    }),
    parameterOrder: ['messageId'],
    output: z.any().describe('Updated message with fresh media'),
});
```

**File**: `packages/schema/src/methods/stickers.ts` (NEW)

```typescript
import { z } from 'zod';
import { defineMethodV2 } from '../registry';
import { toParam, messageIdParam } from '../parameters';

// ============================================================================
// Sticker Metadata Schema
// ============================================================================

const StickerMetadataSchema = z.object({
    author: z.string().optional().describe('Sticker author name'),
    pack: z.string().optional().describe('Sticker pack name'),
    keepScale: z.boolean().optional().describe('Maintain aspect ratio'),
    removeBg: z.boolean().optional().describe('Remove background'),
    circle: z.boolean().optional().describe('Make sticker circular'),
}).optional();

// ============================================================================
// Sticker Methods
// ============================================================================

/**
 * Converts and sends an image as a sticker
 */
export const sendImageAsSticker = defineMethodV2('sendImageAsSticker', {
    meta: {
        description: 'Converts an image to a sticker and sends it',
        action: 'send',
        namespace: 'stickers',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        image: z.string().describe('Base64 or DataURL of image'),
        metadata: StickerMetadataSchema,
    }),
    parameterOrder: ['to', 'image', 'metadata'],
    output: z.union([z.string(), z.boolean()]).describe('Message ID or success status'),
});

/**
 * Sends an image as a sticker in reply to a message
 */
export const sendImageAsStickerAsReply = defineMethodV2('sendImageAsStickerAsReply', {
    meta: {
        description: 'Converts an image to a sticker and sends as reply',
        action: 'send',
        namespace: 'stickers',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        image: z.string().describe('Base64 or DataURL of image'),
        messageId: messageIdParam,
        metadata: StickerMetadataSchema,
    }),
    parameterOrder: ['to', 'image', 'messageId', 'metadata'],
    output: z.union([z.string(), z.boolean()]),
});

/**
 * Converts and sends an MP4 as an animated sticker
 */
export const sendMp4AsSticker = defineMethodV2('sendMp4AsSticker', {
    meta: {
        description: 'Converts an MP4 video to an animated sticker',
        action: 'send',
        namespace: 'stickers',
        license: 'insiders',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        file: z.string().describe('Base64 or DataURL of MP4'),
        metadata: StickerMetadataSchema,
    }),
    parameterOrder: ['to', 'file', 'metadata'],
    output: z.union([z.string(), z.boolean()]),
});

/**
 * Sends a raw WebP file as sticker
 */
export const sendRawWebpAsSticker = defineMethodV2('sendRawWebpAsSticker', {
    meta: {
        description: 'Sends a raw WebP file as sticker without conversion',
        action: 'send',
        namespace: 'stickers',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        webpBase64: z.string().describe('Base64 encoded WebP'),
        metadata: StickerMetadataSchema,
    }),
    parameterOrder: ['to', 'webpBase64', 'metadata'],
    output: z.union([z.string(), z.boolean()]),
});

/**
 * Sends a sticker from URL
 */
export const sendStickerFromUrl = defineMethodV2('sendStickerFromUrl', {
    meta: {
        description: 'Downloads an image from URL and sends as sticker',
        action: 'send',
        namespace: 'stickers',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        url: z.string().url().describe('URL of image to convert'),
        metadata: StickerMetadataSchema,
    }),
    parameterOrder: ['to', 'url', 'metadata'],
    output: z.union([z.string(), z.boolean()]),
});

/**
 * Sends a Giphy as sticker
 */
export const sendGiphyAsSticker = defineMethodV2('sendGiphyAsSticker', {
    meta: {
        description: 'Converts a Giphy URL to animated sticker',
        action: 'send',
        namespace: 'stickers',
        license: 'insiders',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        giphyUrl: z.string().url().describe('Giphy URL'),
    }),
    parameterOrder: ['to', 'giphyUrl'],
    output: z.union([z.string(), z.boolean()]),
});

/**
 * Sends a favorite sticker
 */
export const sendFavSticker = defineMethodV2('sendFavSticker', {
    meta: {
        description: 'Sends a sticker from favorites',
        action: 'send',
        namespace: 'stickers',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        favId: z.string().describe('Favorite sticker ID'),
    }),
    parameterOrder: ['to', 'favId'],
    output: z.string(),
});

/**
 * Sends an emoji as sticker-like reaction
 */
export const sendEmoji = defineMethodV2('sendEmoji', {
    meta: {
        description: 'Sends an emoji',
        action: 'send',
        namespace: 'stickers',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        emojiId: z.string().describe('Emoji identifier'),
        messageId: messageIdParam.optional().describe('Message to react to'),
    }),
    parameterOrder: ['to', 'emojiId', 'messageId'],
    output: z.union([z.string(), z.boolean()]),
});
```

**File**: `packages/schema/src/methods/files.ts` (NEW)

```typescript
import { z } from 'zod';
import { defineMethodV2 } from '../registry';
import { toParam, captionParam, filenameParam } from '../parameters';

// ============================================================================
// File Transfer Methods (from URL)
// ============================================================================

/**
 * Downloads a file from URL and sends it
 */
export const sendFileFromUrl = defineMethodV2('sendFileFromUrl', {
    meta: {
        description: 'Downloads a file from URL and sends to chat',
        action: 'send',
        namespace: 'files',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        url: z.string().url().describe('URL of file to download'),
        filename: filenameParam,
        caption: captionParam,
        headers: z.record(z.string()).optional().describe('Custom headers for download'),
    }),
    parameterOrder: ['to', 'url', 'filename', 'caption', 'headers'],
    output: z.string().describe('Message ID'),
});

/**
 * Downloads and sends a Giphy
 */
export const sendGiphy = defineMethodV2('sendGiphy', {
    meta: {
        description: 'Downloads and sends a Giphy as video',
        action: 'send',
        namespace: 'files',
        license: 'none',
        functionality: 'both',
        httpMethod: 'POST',
    },
    input: z.object({
        to: toParam,
        giphyUrl: z.string().url().describe('Giphy URL'),
        caption: captionParam,
    }),
    parameterOrder: ['to', 'giphyUrl', 'caption'],
    output: z.string().describe('Message ID'),
});
```

---

## Step 2: Update methods/index.ts

**File**: `packages/schema/src/methods/index.ts`

```typescript
// Existing exports
export * from './messaging';
export * from './chats';
export * from './contacts';
export * from './groups';
export * from './communities';
export * from './status';
export * from './labels';
export * from './business';
export * from './utilities';

// NEW: Complex method exports
export * from './media';
export * from './stickers';
export * from './files';
```

---

## Step 3: Implement Complex Methods in Core

**File**: `packages/core/src/implementations/media.ts` (NEW)

```typescript
import { implementMethod } from '@open-wa/schema';
import * as Methods from '@open-wa/schema/methods';
import { decryptMedia as waDecrypt } from '@open-wa/wa-decrypt';
import * as fs from 'fs';
import axios from 'axios';

/**
 * Decrypt media from a message
 */
export const decryptMediaImpl = implementMethod(
    Methods.decryptMedia,
    async function(this: any, params) {
        const { message } = params;
        
        // Get media URL
        const url = message.clientUrl || message.deprecatedMms3Url;
        if (!url) {
            throw new Error('No media URL in message');
        }
        
        // Download encrypted media
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
        });
        
        // Decrypt using wa-decrypt package
        const decrypted = await waDecrypt(
            Buffer.from(response.data),
            message.mediaKey,
            message.type
        );
        
        return decrypted.toString('base64');
    }
);

/**
 * Download media to file
 */
export const downloadMediaImpl = implementMethod(
    Methods.downloadMedia,
    async function(this: any, params) {
        const { message, path } = params;
        
        // Use decryptMedia to get base64
        const base64 = await this.decryptMedia(message);
        
        // Convert to buffer and write
        const buffer = Buffer.from(base64, 'base64');
        fs.writeFileSync(path, buffer);
        
        return path;
    }
);
```

**File**: `packages/core/src/implementations/stickers.ts` (NEW)

```typescript
import { implementMethod } from '@open-wa/schema';
import * as Methods from '@open-wa/schema/methods';
import axios from 'axios';
import sharp from 'sharp';

/**
 * Internal helper: Convert image to WebP sticker format
 */
async function convertToStickerWebp(
    input: Buffer | string,
    metadata?: { keepScale?: boolean; circle?: boolean }
): Promise<Buffer> {
    let buffer: Buffer;
    
    // Handle different input types
    if (typeof input === 'string') {
        if (input.startsWith('data:')) {
            // DataURL
            const base64Data = input.split(',')[1];
            buffer = Buffer.from(base64Data, 'base64');
        } else {
            // Assume base64
            buffer = Buffer.from(input, 'base64');
        }
    } else {
        buffer = input;
    }
    
    // Convert to WebP with sticker dimensions
    let sharpInstance = sharp(buffer)
        .resize(512, 512, {
            fit: metadata?.keepScale ? 'inside' : 'cover',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .webp({ quality: 80 });
    
    if (metadata?.circle) {
        // Add circular mask
        const circleMask = Buffer.from(
            `<svg width="512" height="512">
                <circle cx="256" cy="256" r="256" fill="white"/>
            </svg>`
        );
        sharpInstance = sharpInstance.composite([{
            input: circleMask,
            blend: 'dest-in',
        }]);
    }
    
    return sharpInstance.toBuffer();
}

/**
 * Send image as sticker
 */
export const sendImageAsStickerImpl = implementMethod(
    Methods.sendImageAsSticker,
    async function(this: any, params) {
        const { to, image, metadata } = params;
        
        // Convert image to sticker WebP
        const webpBuffer = await convertToStickerWebp(image, metadata);
        const webpBase64 = webpBuffer.toString('base64');
        
        // Send via WAPI
        return await this.pup(
            (p: any) => (window as any).WAPI.sendImageAsSticker(p.webpBase64, p.to, p.metadata),
            { to, webpBase64, metadata }
        );
    }
);

/**
 * Send sticker from URL
 */
export const sendStickerFromUrlImpl = implementMethod(
    Methods.sendStickerFromUrl,
    async function(this: any, params) {
        const { to, url, metadata } = params;
        
        // Download image
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const buffer = Buffer.from(response.data);
        
        // Convert and send
        const webpBuffer = await convertToStickerWebp(buffer, metadata);
        const webpBase64 = webpBuffer.toString('base64');
        
        return await this.pup(
            (p: any) => (window as any).WAPI.sendImageAsSticker(p.webpBase64, p.to, p.metadata),
            { to, webpBase64, metadata }
        );
    }
);
```

**File**: `packages/core/src/implementations/files.ts` (NEW)

```typescript
import { implementMethod } from '@open-wa/schema';
import * as Methods from '@open-wa/schema/methods';
import axios from 'axios';
import mime from 'mime-types';

/**
 * Send file from URL
 */
export const sendFileFromUrlImpl = implementMethod(
    Methods.sendFileFromUrl,
    async function(this: any, params) {
        const { to, url, filename, caption, headers } = params;
        
        // Download file
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: headers || {},
        });
        
        const buffer = Buffer.from(response.data);
        const base64 = buffer.toString('base64');
        
        // Detect mime type
        const contentType = response.headers['content-type'] 
            || mime.lookup(filename || url) 
            || 'application/octet-stream';
        
        // Create data URL
        const dataUrl = `data:${contentType};base64,${base64}`;
        
        // Send via existing sendFile
        return await this.sendFile(to, dataUrl, filename, caption);
    }
);
```

---

## Step 4: Register Implementations in Client

**File**: `packages/core/src/api/Client.ts`

```typescript
import { 
    decryptMediaImpl, 
    downloadMediaImpl 
} from '../implementations/media';
import { 
    sendImageAsStickerImpl,
    sendStickerFromUrlImpl,
} from '../implementations/stickers';
import { 
    sendFileFromUrlImpl 
} from '../implementations/files';

export class Client {
    // ... existing code ...
    
    // Complex methods with custom implementations
    decryptMedia = decryptMediaImpl.bind(this);
    downloadMedia = downloadMediaImpl.bind(this);
    sendImageAsSticker = sendImageAsStickerImpl.bind(this);
    sendStickerFromUrl = sendStickerFromUrlImpl.bind(this);
    sendFileFromUrl = sendFileFromUrlImpl.bind(this);
    
    // ... rest of class ...
}
```

---

## Triage: What to Ship in v5.0.0

### CRITICAL (Ship in v5.0.0)

| Method | Reason |
|--------|--------|
| `decryptMedia` | Core automation pattern |
| `downloadMedia` | Core automation pattern |
| `sendFileFromUrl` | Very common integration |
| `loadEarlierMessages` | History processing bots |

### HIGH (Ship if time permits)

| Method | Reason |
|--------|--------|
| `sendImageAsSticker` | Popular feature |
| `sendStickerFromUrl` | Popular feature |
| `getStickerDecryptable` | Media handling |

### DEFER to v5.1.0

| Method | Reason |
|--------|--------|
| `sendMp4AsSticker` | Complex conversion, high break risk |
| `sendGiphyAsSticker` | Depends on external API |
| `sendCustomProduct` | Niche use case |
| All product/catalog methods | Business accounts only |

---

## Verification

```typescript
// Test: decryptMedia works
const client = await create({ /* config */ });

client.onMessage(async (msg) => {
    if (msg.hasMedia) {
        const base64 = await client.decryptMedia(msg);
        console.log('Got media, length:', base64.length);
    }
});

// Test: sendFileFromUrl works
await client.sendFileFromUrl(
    '123456789@c.us',
    'https://example.com/file.pdf',
    'document.pdf',
    'Check out this file'
);
```

---

## Dependencies

These implementations may need additional packages:

```bash
cd packages/core
pnpm add sharp axios mime-types
pnpm add -D @types/mime-types
```

Note: `sharp` has native dependencies. Ensure Docker images include build tools.
