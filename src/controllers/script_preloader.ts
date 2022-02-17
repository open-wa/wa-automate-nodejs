import * as path from 'path';
import * as fs from 'fs';
import { log } from '../logging/logging';

const read : (_path) => Promise<string> = (_path) => new Promise((resolve, reject) => {
    fs.readFile(require.resolve(path.join(__dirname, '../lib', _path)), 'utf8', (err, file) => {
      if (err) reject(err)
      resolve(file as string)
    })
  })

export class ScriptLoader {
    scripts = [
        // stage 1
        'axios.min.js',
        'jsSha.min.js',
        'qr.min.js',
        'base64.js',
        'hash.js',
        //stage 2
        'wapi.js',
        //stage 3,
        'launch.js'
    ]
    contentRegistry: {
        [key: string]: string;
    } = {}

    constructor() {
        this.contentRegistry = {}
    }

    async loadScripts() {
        await Promise.all(this.scripts.map(this.getScript.bind(this)));
        return this.contentRegistry;
    }

    async getScript(scriptName: string) {
        if (!this.contentRegistry[scriptName]) {
            this.contentRegistry[scriptName] = await read(scriptName);
            log.info("SCRIPT READY: " + scriptName);
        }
        return this.contentRegistry[scriptName];
    }

    flush() {
        this.contentRegistry = {}
    }

    getScripts() {
        return this.contentRegistry;
    }
}

const scriptLoader = new ScriptLoader();
export {scriptLoader};