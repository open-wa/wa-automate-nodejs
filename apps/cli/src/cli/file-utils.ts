import * as path from 'path';
import * as fs from 'fs';
import JSON5 from 'json5';
import { log } from '@open-wa/legacy';

export const tryOpenFileAsObject: (fileLocation: string, needArray?: boolean) => Promise<any> = async (fileLocation: string, needArray = false) => {
    let res: any = undefined;
    const relativePath = path.join(path.resolve(process.cwd(), fileLocation || ''));
    const isJs = fileLocation.endsWith(".js");
    log.info(`Checking exists: ${fileLocation || relativePath}`);

    if (fs.existsSync(fileLocation) || fs.existsSync(relativePath)) {
        const fp: string = isJs
            ? (fs.existsSync(relativePath) ? relativePath : fileLocation)
            : (fs.existsSync(fileLocation) ? fileLocation : relativePath);

        log.info("Attempting to open: " + fp);
        try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const data = isJs ? (require(fp) || {}).default : JSON5.parse(fs.readFileSync(fp, 'utf8'));
            if (data && (Array.isArray(data) === needArray)) res = data;
            if (data && typeof data === "function") {
                log.info("Found config as function, executing.")
                res = await data(process.env.CURRENT_SESSION_ID || "session")
            }
        } catch (error) {
            throw `Unable to parse config file as JSON. Please make sure ${fp} is a valid JSON config file`;
        }

        log.info(`${fp} is ${res ? 'valid' : 'invalid'}`);
        log.info(`contents: ${JSON.stringify(res)}`);

        return res ? {
            ...res,
            confPath: fp
        } : undefined;
    }

    return undefined;
}
