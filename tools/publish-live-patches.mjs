#!/usr/bin/env node
import { createHash, sign } from 'node:crypto';
import { readFile } from 'node:fs/promises';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function expand(template, hash) {
  if (!template.includes('{hash}'))
    throw new Error('Patch artifact URL templates must contain {hash}');
  return template.replaceAll('{hash}', hash);
}

async function upload(url, body) {
  const headers = { 'Content-Type': 'application/json' };
  if (process.env.PATCH_UPLOAD_TOKEN)
    headers['x-api-key'] = process.env.PATCH_UPLOAD_TOKEN;
  const response = await fetch(url, { method: 'POST', headers, body });
  if (!response.ok)
    throw new Error(
      `Patch upload failed at ${url}: HTTP ${response.status} ${await response.text()}`,
    );
}

async function verifyCdn(url, expectedHash, expectedSize) {
  let lastError;
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    try {
      const response = await fetch(
        `${url}${url.includes('?') ? '&' : '?'}release=${expectedHash}`,
        { cache: 'no-store' },
      );
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = new Uint8Array(await response.arrayBuffer());
      const hash = createHash('sha256').update(bytes).digest('hex');
      if (bytes.byteLength !== expectedSize || hash !== expectedHash) {
        throw new Error(
          `expected ${expectedSize}/${expectedHash}, received ${bytes.byteLength}/${hash}`,
        );
      }
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(5_000, attempt * 500)),
      );
    }
  }
  throw new Error(
    `Bunny CDN verification failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
  );
}

function canonicalize(manifest) {
  return JSON.stringify({
    version: manifest.version,
    hash: manifest.hash,
    url: manifest.url,
    size: manifest.size,
    publishedAt: manifest.publishedAt,
    ...(manifest.minCoreVersion
      ? { minCoreVersion: manifest.minCoreVersion }
      : {}),
    ...(manifest.maxCoreVersion
      ? { maxCoreVersion: manifest.maxCoreVersion }
      : {}),
  });
}

async function main() {
  const patchPath = process.argv[2] ?? 'patches.json';
  const bytes = await readFile(patchPath);
  const parsed = JSON.parse(bytes.toString('utf8'));
  if (
    !Array.isArray(parsed) ||
    !parsed.every((entry) => typeof entry === 'string')
  ) {
    throw new Error(
      'Patch bundle must be a JSON array of executable script strings',
    );
  }

  const hash = createHash('sha256').update(bytes).digest('hex');
  const uploadUrl = expand(
    required('PATCH_ARTIFACT_UPLOAD_URL_TEMPLATE'),
    hash,
  );
  const publicUrl = expand(
    required('PATCH_ARTIFACT_PUBLIC_URL_TEMPLATE'),
    hash,
  );
  await upload(uploadUrl, bytes);

  if (process.env.PATCH_POINTER_UPLOAD_URL) {
    await upload(process.env.PATCH_POINTER_UPLOAD_URL, bytes);
  }

  if (process.env.BUNNY_PURGE_URL) {
    const response = await fetch(process.env.BUNNY_PURGE_URL, {
      method: 'POST',
      headers: { AccessKey: required('BUNNY_ACCESS_KEY') },
    });
    if (!response.ok)
      throw new Error(
        `Bunny purge failed: HTTP ${response.status} ${await response.text()}`,
      );
  }

  await verifyCdn(publicUrl, hash, bytes.byteLength);

  const manifest = {
    version: 1,
    hash,
    url: publicUrl,
    size: bytes.byteLength,
    publishedAt: new Date().toISOString(),
    ...(process.env.PATCH_MIN_CORE_VERSION
      ? { minCoreVersion: process.env.PATCH_MIN_CORE_VERSION }
      : {}),
    ...(process.env.PATCH_MAX_CORE_VERSION
      ? { maxCoreVersion: process.env.PATCH_MAX_CORE_VERSION }
      : {}),
    signature: '',
  };
  manifest.signature = sign(
    null,
    Buffer.from(canonicalize(manifest)),
    required('OPENWA_PATCH_SIGNING_KEY').replaceAll('\\n', '\n'),
  ).toString('base64');

  const releaseResponse = await fetch(
    `${required('OPENWA_PATCH_CONTROL_URL').replace(/\/+$/, '')}/releases`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${required('OPENWA_PATCH_PUBLISH_TOKEN')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(manifest),
    },
  );
  if (!releaseResponse.ok) {
    throw new Error(
      `Release announcement failed: HTTP ${releaseResponse.status} ${await releaseResponse.text()}`,
    );
  }

  console.log(`Published live patch ${hash} (${bytes.byteLength} bytes)`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
