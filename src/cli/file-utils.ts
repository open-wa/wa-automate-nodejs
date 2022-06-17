import * as path from 'path';
import * as fs from 'fs';
import JSON5 from 'json5';
import { log } from '../logging/logging';

export const tryOpenFileAsObject : (fileLocation: string, needArray ?: boolean) => any = (fileLocation : string , needArray = false) => {
    let res = undefined;
    let fp = undefined;
    const relativePath = path.join(path.resolve(process.cwd(), fileLocation || ''));
    const isJs = fileLocation.endsWith(".js") 
    log.info(`Checking exists: ${fileLocation || relativePath}`);
    if (fs.existsSync(fileLocation) || fs.existsSync(relativePath)) {
        fp = isJs ? fs.existsSync(relativePath) && relativePath : fs.existsSync(fileLocation) ? fileLocation : relativePath;
        log.info("Attempting to open: " + fp);
        try {
            const data = isJs ? (require(fp) || {}).default : JSON5.parse(fs.readFileSync(fp, 'utf8'));
            if (data && (Array.isArray(data) == needArray)) res = data;
        } catch (error) {
            throw `Unable to parse config file as JSON. Please make sure ${fp} is a valid JSON config file`;
        }
    } else return
    log.info(`${fp} is ${res ? 'valid' : 'invalid'}`);
    return res && {
        ...(res || {}),
        confPath: fp
    };
}