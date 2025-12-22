# Codecs and Parameters Implementation Plan

## Overview

This document outlines the implementation plan for adding Zod codecs and reusable parameters to the `@open-wa/schema` package. The goal is to create intelligent, bi-directional transformations for common WhatsApp data types and provide a library of reusable, well-documented parameters.

## Background

Zod 4.1+ introduces **codecs** - schemas that define bi-directional transformations between input and output types:
- **Forward (decode)**: Convert user-friendly input → internal representation
- **Backward (encode)**: Convert internal representation → user-friendly output

This is perfect for WhatsApp API parameters where we want to accept flexible inputs (e.g., just a phone number) and automatically transform them to the required format (e.g., `447123456789@c.us`).

## File Structure

```
packages/schema/src/
├── codecs.ts          # Bi-directional transformation codecs
├── parameters.ts      # Reusable parameter schemas with metadata
├── enums.ts          # Existing enums
├── registry.ts       # Existing registry
├── implementor.ts    # Existing implementor
├── methods.ts        # Updated to use parameters.ts
└── index.ts          # Export codecs and parameters
```

---

## Part 1: Codecs (`codecs.ts`)

### 1.1 Chat ID Codec

**Purpose**: Intelligently convert phone numbers to proper WhatsApp chat IDs.

**Logic**:
- Input: Phone number (with or without suffix)
- Output: Properly formatted ChatId

**Rules**:
1. If input already has `@c.us`, `@g.us`, or `@lid` → pass through
2. Count digits in the number:
   - **18 digits** → Group chat → append `@g.us`
   - **14 digits** → Could be LID or Indonesian number
     - If starts with `62` (Indonesia) → append `@c.us`
     - Otherwise → append `@lid`
   - **< 14 digits** → Regular contact → append `@c.us`

**Implementation**:

```typescript
export const chatIdCodec = z.codec(
  z.string(), // Input: flexible string
  z.string(), // Output: formatted ChatId
  {
    decode: (input) => {
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
    encode: (chatId) => {
      // For encoding, just return as-is (already formatted)
      return chatId;
    }
  }
);
```

**Usage**:
```typescript
chatIdCodec.decode("447123456789");           // => "447123456789@c.us"
chatIdCodec.decode("447123456789@c.us");      // => "447123456789@c.us"
chatIdCodec.decode("123456789012345678");     // => "123456789012345678@g.us"
chatIdCodec.decode("62812345678901");         // => "62812345678901@c.us" (Indonesian)
chatIdCodec.decode("12345678901234");         // => "12345678901234@lid" (non-Indonesian 14 digits)
```

---

### 1.2 Contact ID Codec

**Purpose**: Convert phone numbers to contact IDs (always `@c.us`).

```typescript
export const contactIdCodec = z.codec(
  z.string(),
  z.string(),
  {
    decode: (input) => {
      if (input.includes('@c.us')) return input;
      const digits = input.replace(/\D/g, '');
      return `${digits}@c.us`;
    },
    encode: (contactId) => contactId
  }
);
```

---

### 1.3 Group ID Codec

**Purpose**: Convert to group chat IDs (always `@g.us`).

```typescript
export const groupIdCodec = z.codec(
  z.string(),
  z.string(),
  {
    decode: (input) => {
      if (input.includes('@g.us')) return input;
      const digits = input.replace(/\D/g, '');
      return `${digits}@g.us`;
    },
    encode: (groupId) => groupId
  }
);
```

---

### 1.4 File Input Codec

**Purpose**: Accept flexible file inputs and convert to the desired output format.

**Supported Inputs**:
- DataURL (`data:image/png;base64,...`)
- Base64 string
- File path (relative or absolute)
- URL (http/https)
- Buffer

**Output Types**:
- `DATA_URL`
- `BASE_64`
- `BUFFER`
- `TEMP_FILE_PATH`
- `READ_STREAM`

**Implementation Strategy**:

Since the file codec needs to support multiple output types, we'll create a **factory function** that generates codecs for each output type:

```typescript
import { AdvancedFile } from '@open-wa/core/api/model';
import { assertFile, FileOutputTypes } from '@open-wa/core/utils/tools';

/**
 * Creates a file codec that transforms various file inputs to a specific output type
 */
export const createFileCodec = (outputType: keyof typeof FileOutputTypes) => {
  return z.codec(
    z.union([
      z.string(), // DataURL, Base64, FilePath, or URL
      z.instanceof(Buffer)
    ]),
    z.union([
      z.string(), // For DATA_URL, BASE_64, TEMP_FILE_PATH
      z.instanceof(Buffer), // For BUFFER
      z.any() // For READ_STREAM (Readable)
    ]),
    {
      decode: async (input, ctx) => {
        try {
          // Use the existing assertFile utility
          return await assertFile(input, 'file', outputType);
        } catch (err: any) {
          ctx.issues.push({
            code: 'custom',
            message: err.message,
            path: []
          });
          return z.NEVER;
        }
      },
      encode: (output) => output
    }
  );
};

// Pre-built codecs for common use cases
export const fileToDataUrlCodec = createFileCodec(FileOutputTypes.DATA_URL);
export const fileToBase64Codec = createFileCodec(FileOutputTypes.BASE_64);
export const fileToBufferCodec = createFileCodec(FileOutputTypes.BUFFER);
export const fileToTempPathCodec = createFileCodec(FileOutputTypes.TEMP_FILE_PATH);
export const fileToStreamCodec = createFileCodec(FileOutputTypes.READ_STREAM);
```

**Usage**:
```typescript
// Accept any file format, output as DataURL
await fileToDataUrlCodec.decode("./image.png");
await fileToDataUrlCodec.decode("https://example.com/image.png");
await fileToDataUrlCodec.decode("data:image/png;base64,...");
await fileToDataUrlCodec.decode(Buffer.from(...));
```

---

### 1.5 Message ID Codec

**Purpose**: Validate and normalize message IDs.

**Format**: `{boolean}_{ChatId}_{randomString}`

```typescript
export const messageIdCodec = z.codec(
  z.string(),
  z.string(),
  {
    decode: (input) => {
      // Validate format
      const parts = input.split('_');
      if (parts.length !== 3) {
        throw new Error('Invalid message ID format');
      }
      if (!['true', 'false'].includes(parts[0])) {
        throw new Error('Invalid message ID: first part must be boolean');
      }
      return input;
    },
    encode: (messageId) => messageId
  }
);
```

---

### 1.6 Additional Useful Codecs

#### Base64 to DataURL Codec

```typescript
export const base64ToDataUrlCodec = z.codec(
  z.string(), // Base64 string
  z.string(), // DataURL
  {
    decode: (base64, ctx) => {
      // Detect mime type or use default
      const mimeType = 'application/octet-stream'; // Could be enhanced
      return `data:${mimeType};base64,${base64}`;
    },
    encode: (dataUrl) => {
      // Extract base64 part
      return dataUrl.split(',')[1];
    }
  }
);
```

#### URL to DataURL Codec

```typescript
export const urlToDataUrlCodec = z.codec(
  z.url(),
  z.string(), // DataURL
  {
    decode: async (url, ctx) => {
      try {
        // Use existing getDUrl utility
        const { getDUrl } = await import('@open-wa/core/utils/tools');
        return await getDUrl(url);
      } catch (err: any) {
        ctx.issues.push({
          code: 'custom',
          message: `Failed to fetch URL: ${err.message}`,
          path: []
        });
        return z.NEVER;
      }
    },
    encode: (dataUrl) => {
      // Can't reliably convert back to URL
      throw new Error('Cannot encode DataURL back to URL');
    }
  }
);
```

---

## Part 2: Parameters (`parameters.ts`)

### 2.1 Purpose

Create a library of reusable, well-documented parameter schemas that can be imported and used across method definitions.

### 2.2 Structure

Each parameter should:
1. Have a descriptive name
2. Use appropriate codecs for transformation
3. Include metadata (examples, descriptions)
4. Be registered with `parameterRegistry`

### 2.3 Parameter Definitions

Based on `aliases.ts`, here are the key parameters:

#### Chat & Contact Parameters

```typescript
import { chatIdCodec, contactIdCodec, groupIdCodec, messageIdCodec } from './codecs';
import { parameterRegistry } from './registry';

/**
 * Chat ID parameter - accepts phone numbers or formatted chat IDs
 * Automatically converts to proper format (e.g., "447123456789" → "447123456789@c.us")
 */
export const chatIdParam = chatIdCodec.describe('Chat ID (phone number or formatted ID)');
parameterRegistry.set(chatIdParam, { 
  example: '447123456789@c.us' 
});

/**
 * Contact ID parameter - always formats as @c.us
 */
export const contactIdParam = contactIdCodec.describe('Contact ID (phone number)');
parameterRegistry.set(contactIdParam, { 
  example: '447123456789@c.us' 
});

/**
 * Group chat ID parameter - always formats as @g.us
 */
export const groupIdParam = groupIdCodec.describe('Group chat ID');
parameterRegistry.set(groupIdParam, { 
  example: '447123456789-1445627445@g.us' 
});

/**
 * Message ID parameter
 */
export const messageIdParam = messageIdCodec.describe('Message ID');
parameterRegistry.set(messageIdParam, { 
  example: 'false_447123456789@c.us_9C4D0965EA5C09D591334AB6BDB07FEB' 
});

/**
 * Generic "to" parameter - accepts any chat ID
 */
export const toParam = chatIdParam.describe('Recipient chat ID');
parameterRegistry.set(toParam, { 
  example: '447123456789@c.us' 
});
```

#### Content Parameters

```typescript
/**
 * Message content/text
 */
export const contentParam = z.string().min(1).describe('Message content');
parameterRegistry.set(contentParam, { 
  example: 'Hello, world!' 
});

/**
 * Caption for media messages
 */
export const captionParam = z.string().optional().describe('Media caption');
parameterRegistry.set(captionParam, { 
  example: 'Check out this image!' 
});

/**
 * Filename parameter
 */
export const filenameParam = z.string().optional().describe('Filename with extension');
parameterRegistry.set(filenameParam, { 
  example: 'document.pdf' 
});
```

#### File Parameters

```typescript
import { fileToDataUrlCodec, fileToBase64Codec } from './codecs';

/**
 * Image data - accepts file path, URL, DataURL, or Base64
 * Automatically converts to DataURL
 */
export const imageDataParam = fileToDataUrlCodec.describe('Image file (path, URL, DataURL, or Base64)');
parameterRegistry.set(imageDataParam, { 
  example: 'data:image/png;base64,iVBORw0KGgo...' 
});

/**
 * Generic file data parameter
 */
export const fileDataParam = fileToDataUrlCodec.describe('File (path, URL, DataURL, Base64, or Buffer)');
parameterRegistry.set(fileDataParam, { 
  example: 'data:application/pdf;base64,JVBERi0xLjQK...' 
});

/**
 * Audio data parameter
 */
export const audioDataParam = fileToDataUrlCodec.describe('Audio file (path, URL, DataURL, or Base64)');
parameterRegistry.set(audioDataParam, { 
  example: 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAA...' 
});

/**
 * Video data parameter
 */
export const videoDataParam = fileToDataUrlCodec.describe('Video file (path, URL, DataURL, or Base64)');
parameterRegistry.set(videoDataParam, { 
  example: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21...' 
});

/**
 * Document data parameter
 */
export const documentDataParam = fileToDataUrlCodec.describe('Document file (path, URL, DataURL, or Base64)');
parameterRegistry.set(documentDataParam, { 
  example: 'data:application/pdf;base64,JVBERi0xLjQK...' 
});

/**
 * Sticker data parameter
 */
export const stickerDataParam = fileToDataUrlCodec.describe('Sticker file (path, URL, DataURL, or Base64)');
parameterRegistry.set(stickerDataParam, { 
  example: 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAw...' 
});
```

#### Location Parameters

```typescript
/**
 * Latitude parameter
 */
export const latitudeParam = z.union([z.number(), z.string()]).describe('Latitude coordinate');
parameterRegistry.set(latitudeParam, { 
  example: 51.5074 
});

/**
 * Longitude parameter
 */
export const longitudeParam = z.union([z.number(), z.string()]).describe('Longitude coordinate');
parameterRegistry.set(longitudeParam, { 
  example: -0.1278 
});

/**
 * Location name/description
 */
export const locationNameParam = z.string().optional().describe('Location name or description');
parameterRegistry.set(locationNameParam, { 
  example: 'London, UK' 
});
```

#### Boolean & Option Parameters

```typescript
/**
 * Wait for message ID to be returned
 */
export const waitForIdParam = z.boolean().optional().default(false).describe('Wait for message ID');
parameterRegistry.set(waitForIdParam, { 
  example: true 
});

/**
 * Include own messages
 */
export const includeMeParam = z.boolean().optional().default(true).describe('Include own messages');
parameterRegistry.set(includeMeParam, { 
  example: true 
});

/**
 * Include notifications
 */
export const includeNotificationsParam = z.boolean().optional().default(false).describe('Include notification messages');
parameterRegistry.set(includeNotificationsParam, { 
  example: false 
});

/**
 * Only local deletion (don't delete for everyone)
 */
export const onlyLocalParam = z.boolean().optional().default(false).describe('Delete only locally');
parameterRegistry.set(onlyLocalParam, { 
  example: false 
});

/**
 * Skip own messages when forwarding
 */
export const skipMyMessagesParam = z.boolean().optional().default(false).describe('Skip own messages');
parameterRegistry.set(skipMyMessagesParam, { 
  example: false 
});

/**
 * Only get chats with new messages
 */
export const withNewMessagesOnlyParam = z.boolean().optional().default(false).describe('Only chats with unread messages');
parameterRegistry.set(withNewMessagesOnlyParam, { 
  example: false 
});
```

#### Array Parameters

```typescript
/**
 * Array of message IDs
 */
export const messageIdsParam = z.union([
  z.array(messageIdParam),
  messageIdParam
]).describe('Message ID(s) to process');
parameterRegistry.set(messageIdsParam, { 
  example: ['false_447123456789@c.us_ABC123', 'false_447123456789@c.us_DEF456'] 
});

/**
 * Mentioned user IDs
 */
export const mentionedJidListParam = z.array(contactIdParam).optional().describe('List of mentioned contact IDs');
parameterRegistry.set(mentionedJidListParam, { 
  example: ['447123456789@c.us', '441234567890@c.us'] 
});
```

#### Generic Options Parameter

```typescript
/**
 * Generic message options (for flexibility)
 */
export const messageOptionsParam = z.any().optional().describe('Additional message options');
parameterRegistry.set(messageOptionsParam, { 
  example: { quotedMsg: 'messageId', mentionedJidList: ['447123456789@c.us'] } 
});
```

---

## Part 3: Update `methods.ts`

### 3.1 Before (Current)

```typescript
const imgDataSchema = z.string().describe('Base64 data or URL');
parameterRegistry.set(imgDataSchema, { example: 'data:image/png;base64,iVBORw0KGgo...' });

export const sendImageV2 = defineMethodV2('sendImage', {
  meta: { /* ... */ },
  input: z.object({
    to: z.string().describe('The chat id to send to'),
    imgData: imgDataSchema,
    filename: z.string().optional().describe('Filename for the image'),
    caption: z.string().optional().describe('Caption for the image'),
    id: z.string().optional().describe('Quoted message ID'),
    waitForId: z.boolean().optional().default(false)
  }),
  parameterOrder: ['to', 'imgData', 'filename', 'caption', 'id', 'waitForId'],
  output: MessageIdReturnSchema.or(z.boolean()).or(z.string())
});
```

### 3.2 After (Using Parameters)

```typescript
import { 
  toParam, 
  imageDataParam, 
  filenameParam, 
  captionParam, 
  messageIdParam, 
  waitForIdParam 
} from './parameters';

export const sendImageV2 = defineMethodV2('sendImage', {
  meta: {
    description: 'Sends an image to a chat',
    action: 'send',
    namespace: 'messages',
    license: 'none',
    functionality: 'both',
    httpMethod: 'POST',
  },
  input: z.object({
    to: toParam,
    imgData: imageDataParam,
    filename: filenameParam,
    caption: captionParam,
    id: messageIdParam.optional(),
    waitForId: waitForIdParam
  }),
  parameterOrder: ['to', 'imgData', 'filename', 'caption', 'id', 'waitForId'],
  output: MessageIdReturnSchema.or(z.boolean()).or(z.string())
});
```

**Benefits**:
- ✅ No need to redefine schemas
- ✅ Consistent parameter definitions across methods
- ✅ Automatic transformations (phone number → chat ID, file path → DataURL)
- ✅ Centralized metadata and examples
- ✅ Easier to maintain and update

---

## Part 4: Additional Codec Suggestions

### 4.1 Timestamp Codecs

```typescript
// ISO datetime string to Date
export const isoDatetimeToDate = z.codec(z.iso.datetime(), z.date(), {
  decode: (isoString) => new Date(isoString),
  encode: (date) => date.toISOString(),
});

// Unix timestamp (seconds) to Date
export const unixSecondsToDate = z.codec(z.int().min(0), z.date(), {
  decode: (seconds) => new Date(seconds * 1000),
  encode: (date) => Math.floor(date.getTime() / 1000),
});

// Unix timestamp (milliseconds) to Date
export const unixMillisToDate = z.codec(z.int().min(0), z.date(), {
  decode: (millis) => new Date(millis),
  encode: (date) => date.getTime(),
});
```

### 4.2 Color Codec (for stories, etc.)

```typescript
// Hex color with/without # to normalized hex
export const hexColorCodec = z.codec(
  z.string().regex(/^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/),
  z.string(),
  {
    decode: (input) => {
      // Remove # if present, ensure uppercase
      return input.replace('#', '').toUpperCase();
    },
    encode: (hex) => hex
  }
);
```

### 4.3 JSON String Codec

```typescript
// JSON string to parsed object
export const jsonStringCodec = <T extends z.ZodType>(schema: T) =>
  z.codec(z.string(), schema, {
    decode: (jsonString, ctx) => {
      try {
        return JSON.parse(jsonString);
      } catch (err: any) {
        ctx.issues.push({
          code: 'invalid_format',
          format: 'json',
          input: jsonString,
          message: err.message,
        });
        return z.NEVER;
      }
    },
    encode: (value) => JSON.stringify(value),
  });
```

---

## Part 5: Implementation Checklist

### Phase 1: Core Codecs
- [ ] Create `src/codecs.ts`
- [ ] Implement `chatIdCodec` with digit counting logic
- [ ] Implement `contactIdCodec`
- [ ] Implement `groupIdCodec`
- [ ] Implement `messageIdCodec`
- [ ] Implement file codec factory (`createFileCodec`)
- [ ] Export pre-built file codecs
- [ ] Add unit tests for each codec

### Phase 2: Parameters Library
- [ ] Create `src/parameters.ts`
- [ ] Define chat/contact parameters using codecs
- [ ] Define content parameters
- [ ] Define file parameters (image, audio, video, document, sticker)
- [ ] Define location parameters
- [ ] Define boolean/option parameters
- [ ] Define array parameters
- [ ] Register all parameters with `parameterRegistry`

### Phase 3: Additional Codecs
- [ ] Implement timestamp codecs (ISO, Unix seconds, Unix millis)
- [ ] Implement color codec for hex colors
- [ ] Implement JSON string codec
- [ ] Implement base64 ↔ DataURL codec
- [ ] Implement URL → DataURL codec

### Phase 4: Update Methods
- [ ] Update `sendTextV2` to use parameters
- [ ] Update `sendImageV2` to use parameters
- [ ] Update all other V2 methods to use parameters
- [ ] Remove inline parameter definitions

### Phase 5: Documentation & Testing
- [ ] Add JSDoc comments to all codecs
- [ ] Add JSDoc comments to all parameters
- [ ] Create usage examples in comments
- [ ] Write comprehensive unit tests
- [ ] Update package exports in `index.ts`
- [ ] Create migration guide for existing code

---

## Part 6: Usage Examples

### Example 1: Using Chat ID Codec Directly

```typescript
import { chatIdCodec } from '@open-wa/schema';

// Decode: flexible input → formatted output
const chatId1 = chatIdCodec.decode("447123456789");
// => "447123456789@c.us"

const chatId2 = chatIdCodec.decode("447123456789-1445627445");
// => "447123456789-1445627445@g.us" (18 digits)

const chatId3 = chatIdCodec.decode("12345678901234");
// => "12345678901234@lid" (14 digits, non-Indonesian)

// Already formatted? No problem
const chatId4 = chatIdCodec.decode("447123456789@c.us");
// => "447123456789@c.us"
```

### Example 2: Using File Codec

```typescript
import { fileToDataUrlCodec } from '@open-wa/schema';

// All of these work!
const dataUrl1 = await fileToDataUrlCodec.decode("./image.png");
const dataUrl2 = await fileToDataUrlCodec.decode("https://example.com/image.png");
const dataUrl3 = await fileToDataUrlCodec.decode("data:image/png;base64,...");
const dataUrl4 = await fileToDataUrlCodec.decode(Buffer.from(...));

// All return: "data:image/png;base64,..."
```

### Example 3: Using Parameters in Method Definitions

```typescript
import { defineMethodV2 } from './registry';
import { toParam, contentParam, messageOptionsParam } from './parameters';

export const sendTextV2 = defineMethodV2('sendText', {
  meta: {
    description: 'Sends a text message',
    action: 'send',
    namespace: 'messages',
    license: 'none',
    functionality: 'both',
    httpMethod: 'POST',
  },
  input: z.object({
    to: toParam,              // Automatically converts phone numbers
    content: contentParam,     // Pre-configured with validation
    options: messageOptionsParam
  }),
  parameterOrder: ['to', 'content', 'options'],
  output: MessageIdReturnSchema
});
```

### Example 4: Client Usage (End User)

```typescript
import { Client } from '@open-wa/wa-automate';

const client = new Client();

// User can pass just a phone number - codec handles the rest!
await client.sendText("447123456789", "Hello!");
// Internally converted to: "447123456789@c.us"

// Or use the full format
await client.sendText("447123456789@c.us", "Hello!");

// Send image with flexible file input
await client.sendImage("447123456789", "./photo.jpg", "photo.jpg", "Check this out!");
// File path automatically converted to DataURL
```

---

## Part 7: Benefits Summary

### For Developers
- ✅ **Reusable**: Define once, use everywhere
- ✅ **Type-safe**: Full TypeScript support
- ✅ **Validated**: Automatic validation on decode
- ✅ **Documented**: Centralized examples and descriptions
- ✅ **Maintainable**: Update in one place, affects all methods

### For End Users
- ✅ **Flexible**: Accept multiple input formats
- ✅ **Intuitive**: Just pass a phone number, not `447123456789@c.us`
- ✅ **Forgiving**: File paths, URLs, DataURLs all work
- ✅ **Validated**: Clear error messages when input is invalid

### For API Design
- ✅ **Consistent**: Same parameters across all methods
- ✅ **Smart**: Automatic transformations reduce boilerplate
- ✅ **Extensible**: Easy to add new codecs and parameters
- ✅ **Backward Compatible**: Existing code still works

---

## Part 8: Testing Strategy

### Unit Tests for Codecs

```typescript
describe('chatIdCodec', () => {
  it('should convert phone number to contact ID', () => {
    expect(chatIdCodec.decode('447123456789')).toBe('447123456789@c.us');
  });

  it('should convert 18-digit number to group ID', () => {
    expect(chatIdCodec.decode('123456789012345678')).toBe('123456789012345678@g.us');
  });

  it('should convert 14-digit non-Indonesian to LID', () => {
    expect(chatIdCodec.decode('12345678901234')).toBe('12345678901234@lid');
  });

  it('should convert 14-digit Indonesian to contact ID', () => {
    expect(chatIdCodec.decode('62812345678901')).toBe('62812345678901@c.us');
  });

  it('should pass through already formatted IDs', () => {
    expect(chatIdCodec.decode('447123456789@c.us')).toBe('447123456789@c.us');
    expect(chatIdCodec.decode('123@g.us')).toBe('123@g.us');
    expect(chatIdCodec.decode('123@lid')).toBe('123@lid');
  });
});
```

### Integration Tests

```typescript
describe('sendImageV2 with file codec', () => {
  it('should accept file path', async () => {
    const result = await sendImageV2.parse([{
      to: '447123456789',
      imgData: './test.png',
      filename: 'test.png'
    }]);
    expect(result.to).toBe('447123456789@c.us');
    expect(result.imgData).toMatch(/^data:image\/png;base64,/);
  });

  it('should accept URL', async () => {
    const result = await sendImageV2.parse([{
      to: '447123456789',
      imgData: 'https://example.com/image.png',
      filename: 'image.png'
    }]);
    expect(result.imgData).toMatch(/^data:image\/png;base64,/);
  });
});
```

---

## Part 9: Migration Path

### For Existing Code

1. **No Breaking Changes**: Existing methods continue to work
2. **Gradual Adoption**: Migrate methods one at a time to use parameters
3. **Backward Compatible**: Old parameter definitions still valid

### Migration Example

**Before**:
```typescript
client.sendText("447123456789@c.us", "Hello");
```

**After** (still works!):
```typescript
client.sendText("447123456789", "Hello"); // Codec handles conversion
client.sendText("447123456789@c.us", "Hello"); // Still works
```

---

## Conclusion

This implementation will provide:
- **Smart parameter handling** with automatic transformations
- **Reusable, well-documented parameters** for consistency
- **Flexible input formats** for better developer experience
- **Type-safe, validated** inputs with clear error messages
- **Backward compatibility** with existing code

The codec system leverages Zod 4.1's bi-directional transformation capabilities to create an intelligent, user-friendly API that "just works" while maintaining type safety and validation.
