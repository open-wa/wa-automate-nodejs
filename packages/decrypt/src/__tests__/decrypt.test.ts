import { describe, it, expect } from 'vitest';
import { createCipheriv, createHmac, randomBytes, hkdfSync } from 'node:crypto';

import {
  decryptMedia,
  bleachMessage,
  mediaTypes,
  MissingCriticalDataError,
} from '../index';
import type { DecryptableMessage } from '../types';
import { decryptBuffer } from '../crypto';

/**
 * Build a synthetic encrypted payload matching WhatsApp's scheme:
 * HKDF → AES-256-CBC → ciphertext with WhatsApp's 10-byte authentication tag.
 */
function encryptTestPayload(
  plaintext: Buffer,
  mediaKeyBase64: string,
  type: string,
): Buffer {
  const mediaKeyBytes = Buffer.from(mediaKeyBase64, 'base64');
  const info = `WhatsApp ${mediaTypes[type.toUpperCase()]} Keys`;

  const expanded = Buffer.from(
    hkdfSync('sha256', mediaKeyBytes, Buffer.alloc(32), info, 112),
  );
  const iv = expanded.subarray(0, 16);
  const cipherKey = expanded.subarray(16, 48);

  const cipher = createCipheriv('aes-256-cbc', cipherKey, iv);
  cipher.setAutoPadding(false);

  // Manually apply PKCS#7 padding
  const padding = 16 - (plaintext.length % 16);
  const padded = Buffer.concat([
    plaintext,
    Buffer.alloc(padding, padding),
  ]);

  const ciphertext = Buffer.concat([cipher.update(padded), cipher.final()]);
  const mac = createHmac('sha256', expanded.subarray(48, 80)).update(iv).update(ciphertext).digest().subarray(0, 10);
  return Buffer.concat([ciphertext, mac]);
}

describe('decryptBuffer', () => {
  it('decrypts a synthetic payload correctly', () => {
    const mediaKey = randomBytes(32).toString('base64');
    const plaintext = Buffer.from('hello open-wa decrypt');

    const encrypted = encryptTestPayload(plaintext, mediaKey, 'IMAGE');

    const result = decryptBuffer(
      encrypted,
      mediaKey,
      'IMAGE',
      plaintext.length,
      'image/jpeg',
    );

    expect(result.toString()).toBe('hello open-wa decrypt');
  });

  it('handles different media types', () => {
    for (const type of ['VIDEO', 'AUDIO', 'DOCUMENT', 'STICKER']) {
      const mediaKey = randomBytes(32).toString('base64');
      const plaintext = Buffer.from(`test-${type}`);
      const encrypted = encryptTestPayload(plaintext, mediaKey, type);

      const result = decryptBuffer(
        encrypted,
        mediaKey,
        type,
        plaintext.length,
        'application/octet-stream',
      );

      expect(result.toString()).toBe(`test-${type}`);
    }
  });
  it('removes a complete block of PKCS#7 padding and works without an expected size', () => {
    const key = randomBytes(32).toString('base64');
    const plain = Buffer.alloc(16, 7);
    const encrypted = encryptTestPayload(plain, key, 'PTT');
    expect(decryptBuffer(encrypted, key, 'ptt', plain.length, 'audio/ogg').equals(plain)).toBe(true);
    expect(decryptBuffer(encrypted, key, 'ptt', undefined, 'audio/ogg').equals(plain)).toBe(true);
  });
  it('rejects corrupted ciphertext and authentication tags', () => {
    const key = randomBytes(32).toString('base64');
    const encrypted = encryptTestPayload(Buffer.from('voice note'), key, 'PTT');
    const badCiphertext = Buffer.from(encrypted); badCiphertext[0] ^= 1;
    const badTag = Buffer.from(encrypted); badTag[badTag.length - 1] ^= 1;
    expect(() => decryptBuffer(badCiphertext, key, 'ptt')).toThrow('authentication');
    expect(() => decryptBuffer(badTag, key, 'ptt')).toThrow('authentication');
  });
});

describe('bleachMessage', () => {
  it('keeps only decryption-relevant fields', () => {
    const msg = {
      type: 'image',
      mediaKey: 'abc',
      mimetype: 'image/jpeg',
      size: 1000,
      filehash: 'xyz',
      deprecatedMms3Url: 'https://example.com',
      // These should be stripped:
      sender: 'user@c.us',
      body: 'some text',
      chat: { id: 'chat@g.us' },
    };

    const result = bleachMessage(msg);

    expect(result).toHaveProperty('type');
    expect(result).toHaveProperty('mediaKey');
    expect(result).toHaveProperty('mimetype');
    expect(result).toHaveProperty('size');
    expect(result).toHaveProperty('filehash');
    expect(result).toHaveProperty('deprecatedMms3Url');
    expect(result).not.toHaveProperty('sender');
    expect(result).not.toHaveProperty('body');
    expect(result).not.toHaveProperty('chat');
  });
});

describe('decryptMedia validation', () => {
  it('throws MissingCriticalDataError when mediaKey is missing', async () => {
    const bad = {
      filehash: 'x',
      mimetype: 'image/jpeg',
      type: 'image',
      size: 100,
      deprecatedMms3Url: 'https://example.com',
    } as unknown as DecryptableMessage;

    await expect(decryptMedia(bad)).rejects.toThrow(MissingCriticalDataError);
  });

  it('throws MissingCriticalDataError when multiple fields are missing', async () => {
    const bad = {
      type: 'image',
      deprecatedMms3Url: 'https://example.com',
    } as unknown as DecryptableMessage;

    await expect(decryptMedia(bad)).rejects.toThrow(MissingCriticalDataError);
  });
});

describe('mediaTypes', () => {
  it('maps all expected types', () => {
    expect(mediaTypes['IMAGE']).toBe('Image');
    expect(mediaTypes['VIDEO']).toBe('Video');
    expect(mediaTypes['AUDIO']).toBe('Audio');
    expect(mediaTypes['PTT']).toBe('Audio');
    expect(mediaTypes['DOCUMENT']).toBe('Document');
    expect(mediaTypes['STICKER']).toBe('Image');
  });
});
