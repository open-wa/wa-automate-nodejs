import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { tmpdir } from 'os';
import { Readable } from 'stream';

export const isUrl = (s: string) => {
    try {
        new URL(s);
        return true;
    } catch {
        return false;
    }
};

export const isDataUrl = (s: string) => typeof s === 'string' && !!s.match(/^data:((?:\w+\/(?:(?!;).)+)?)((?:;[\w\W]*?[^;])*),(.+)$/g);

export const isBase64 = (s: string) => {
    if (typeof s !== 'string') return false;
    const len = s.length;
    if (!len || len % 4 !== 0 || /[^A-Z0-9+/=]/i.test(s)) return false;
    const firstPaddingChar = s.indexOf('=');
    return firstPaddingChar === -1 || firstPaddingChar === len - 1 || (firstPaddingChar === len - 2 && s[len - 1] === '=');
};

export const getDUrl = async (url: string): Promise<string> => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
    const mime = res.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return `data:${mime};base64,${base64}`;
}

export const assertFile = async (input: any, outputType: string): Promise<any> => {
    let dUrl: string;

    if (Buffer.isBuffer(input)) {
        dUrl = `data:application/octet-stream;base64,${input.toString('base64')}`;
    } else if (typeof input === 'string') {
        if (isDataUrl(input)) dUrl = input;
        else if (isBase64(input)) dUrl = `data:application/octet-stream;base64,${input}`;
        else if (isUrl(input)) dUrl = await getDUrl(input);
        else {
            const resolvedPath = path.resolve(process.cwd(), input);
            if (fs.existsSync(resolvedPath)) {
                const buffer = await fs.promises.readFile(resolvedPath);
                dUrl = `data:application/octet-stream;base64,${buffer.toString('base64')}`;
            } else {
                throw new Error(`Cannot find file or process input: ${input.slice(0, 25)}`);
            }
        }
    } else {
        throw new Error('Invalid file input');
    }

    if (dUrl.includes('data:') && dUrl.includes('undefined')) {
        dUrl = dUrl.replace('undefined', 'application/octet-stream');
    }

    const base64 = dUrl.split(',')[1] || dUrl;

    switch (outputType) {
        case 'DATA_URL':
            return dUrl;
        case 'BASE_64':
            return base64;
        case 'BUFFER':
            return Buffer.from(base64, 'base64');
        case 'TEMP_FILE_PATH':
            const tempFilePath = path.join(tmpdir(), `${crypto.randomBytes(6).toString('hex')}.tmp`);
            await fs.promises.writeFile(tempFilePath, Buffer.from(base64, 'base64'));
            return tempFilePath;
        case 'READ_STREAM':
            return Readable.from(Buffer.from(base64, 'base64'));
        default:
            return input;
    }
};
