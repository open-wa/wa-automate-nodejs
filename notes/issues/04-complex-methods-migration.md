# Issue #04: Complex Methods Migration Strategy

**Priority**: HIGH  
**Effort**: 3-5 days (full), 1-2 days (critical subset)  
**Risk**: MEDIUM  
**Depends on**: 01, 01a, 02  
**Blocks**: Full API parity with v4

---

## Problem Statement

40 "complex" methods have client-side logic beyond simple WAPI calls. These cannot use the simple WAPI fallback pattern and require custom implementations.

---

## Dependency Matrix

| Category | Methods | Dependencies | Notes |
|----------|---------|--------------|-------|
| **Sticker Conversion** | `sendImageAsSticker`, `sendMp4AsSticker`, `sendStickerFromUrl`, `sendGiphyAsSticker`, `sendRawWebpAsSticker` | `sharp`, `ffmpeg` (optional) | Sharp has native deps |
| **File Transfer** | `sendFileFromUrl`, `sendGiphy` | `axios` | HTTP client for downloads |
| **Media Operations** | `decryptMedia`, `downloadMedia`, `getStickerDecryptable`, `forceStaleMediaUpdate` | `@open-wa/wa-decrypt`, `axios` | Core automation pattern |
| **Message Loading** | `loadEarlierMessages`, `loadAllEarlierMessages`, `loadAndGetAllMessages` | None | Complex WAPI orchestration |
| **Product/Catalog** | `sendProduct`, `sendCustomProduct`, `createProduct` | None | Business accounts only |

---

## v5.0.0 Critical Path (Ship These)

### 1. `decryptMedia` - Core automation pattern

```typescript
// Schema (already in @open-wa/schema)
export const decryptMedia = defineMethodV2('decryptMedia', {
    meta: {
        description: 'Decrypts media from a message',
        action: 'read',
        namespace: 'media',
        license: 'none',
    },
    input: z.object({
        message: z.any().describe('Message object containing media'),
    }),
    parameterOrder: ['message'],
    output: z.string().describe('Base64 encoded media'),
});

// Implementation (packages/core/src/implementations/media.ts)
export const decryptMediaImpl = implementMethod(
    decryptMedia,
    async function(this: Client, params) {
        const { message } = params;
        
        const url = message.clientUrl || message.deprecatedMms3Url;
        if (!url) throw new Error('No media URL in message');
        
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const decrypted = await waDecrypt(
            Buffer.from(response.data),
            message.mediaKey,
            message.type
        );
        
        return decrypted.toString('base64');
    }
);
```

### 2. `downloadMedia` - Depends on decryptMedia

```typescript
export const downloadMediaImpl = implementMethod(
    downloadMedia,
    async function(this: Client, params) {
        const { message, path } = params;
        
        const base64 = await this.decryptMedia(message);
        const buffer = Buffer.from(base64, 'base64');
        fs.writeFileSync(path, buffer);
        
        return path;
    }
);
```

### 3. `sendFileFromUrl` - Very common integration

```typescript
export const sendFileFromUrlImpl = implementMethod(
    sendFileFromUrl,
    async function(this: Client, params) {
        const { to, url, filename, caption, headers } = params;
        
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            headers: headers || {},
        });
        
        const buffer = Buffer.from(response.data);
        const base64 = buffer.toString('base64');
        const contentType = response.headers['content-type'] 
            || mime.lookup(filename || url) 
            || 'application/octet-stream';
        
        const dataUrl = `data:${contentType};base64,${base64}`;
        
        return await this.sendFile(to, dataUrl, filename, caption);
    }
);
```

### 4. `loadEarlierMessages` - History processing bots

```typescript
export const loadEarlierMessagesImpl = implementMethod(
    loadEarlierMessages,
    async function(this: Client, params) {
        const { chatId, count = 20, includeMe = false } = params;
        
        return await this.pup(
            (p: any) => (window as any).WAPI.loadEarlierMessages(
                p.chatId, 
                p.count, 
                p.includeMe
            ),
            { chatId, count, includeMe }
        );
    }
);
```

---

## v5.1.0 Deferred (Ship If Time Permits)

### Sticker Methods

| Method | Complexity | Dependencies |
|--------|------------|--------------|
| `sendImageAsSticker` | MEDIUM | `sharp` |
| `sendStickerFromUrl` | MEDIUM | `sharp`, `axios` |
| `sendRawWebpAsSticker` | LOW | None |

### Implementation Pattern for Stickers

```typescript
async function convertToStickerWebp(
    input: Buffer | string,
    metadata?: { keepScale?: boolean; circle?: boolean }
): Promise<Buffer> {
    let buffer: Buffer;
    
    if (typeof input === 'string') {
        if (input.startsWith('data:')) {
            const base64Data = input.split(',')[1];
            buffer = Buffer.from(base64Data, 'base64');
        } else {
            buffer = Buffer.from(input, 'base64');
        }
    } else {
        buffer = input;
    }
    
    let sharpInstance = sharp(buffer)
        .resize(512, 512, {
            fit: metadata?.keepScale ? 'inside' : 'cover',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .webp({ quality: 80 });
    
    if (metadata?.circle) {
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
```

---

## v5.2.0+ Deferred (Niche Use Cases)

| Method | Reason for Deferral |
|--------|---------------------|
| `sendMp4AsSticker` | Complex ffmpeg conversion, high break risk |
| `sendGiphyAsSticker` | Depends on external Giphy API |
| `sendCustomProduct` | Business accounts only, niche |
| All catalog methods | Business accounts only |

---

## Package Dependencies

```bash
# Core package
cd packages/core
pnpm add axios mime-types

# Optional for sticker conversion (v5.1.0)
pnpm add sharp
pnpm add -D @types/mime-types

# Note: sharp has native dependencies
# Ensure Docker images include build tools
```

---

## File Structure

```
packages/core/src/implementations/
├── media.ts           # decryptMedia, downloadMedia
├── files.ts           # sendFileFromUrl, sendGiphy
├── stickers.ts        # All sticker methods (v5.1.0)
├── messages.ts        # loadEarlierMessages, etc.
└── index.ts           # Re-exports
```

---

## Registration in Client

```typescript
// packages/core/src/api/Client.ts
import { 
    decryptMediaImpl, 
    downloadMediaImpl 
} from '../implementations/media';
import { sendFileFromUrlImpl } from '../implementations/files';

export class Client {
    // Complex methods with custom implementations
    decryptMedia = decryptMediaImpl.bind(this);
    downloadMedia = downloadMediaImpl.bind(this);
    sendFileFromUrl = sendFileFromUrlImpl.bind(this);
    // ... more as migrated
}
```

---

## Triage Summary

| Priority | Count | Methods |
|----------|-------|---------|
| v5.0.0 CRITICAL | 4 | `decryptMedia`, `downloadMedia`, `sendFileFromUrl`, `loadEarlierMessages` |
| v5.1.0 HIGH | 3 | `sendImageAsSticker`, `sendStickerFromUrl`, `getStickerDecryptable` |
| v5.2.0+ DEFER | 33 | Everything else |

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

## Expected Outcomes

| Before | After |
|--------|-------|
| 40 methods with mixed patterns | Clear schema + implementation separation |
| No dependency documentation | Explicit dependency matrix |
| All-or-nothing migration | Phased release (critical first) |
