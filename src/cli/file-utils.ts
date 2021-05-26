import * as path from 'path';
import * as fs from 'fs';
import JSON5 from 'json5';

export const tryOpenFileAsObject : (fileLocation: string, needArray ?: boolean) => any = (fileLocation : string , needArray = false) => {
    let res = undefined;
    const relativePath = path.join(path.resolve(process.cwd(), fileLocation || ''));
    if (fs.existsSync(fileLocation) || fs.existsSync(relativePath)) {
        const fp = fs.existsSync(fileLocation) ? fileLocation : relativePath;
        try {
            const data = JSON5.parse(fs.readFileSync(fp, 'utf8'));
            if (data && (Array.isArray(data) == needArray)) res = data;
        } catch (error) {
            throw `Unable to parse config file as JSON. Please make sure ${fp} is a valid JSON config file`;
        }
    }
    return res;
}