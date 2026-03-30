import * as path from 'path';
import * as fs from 'fs';
import JSON5 from 'json5';

export const tryOpenFileAsObject = async (fileLocation: string, needArray = false): Promise<any> => {
    let res: any = undefined;
    const relativePath = path.join(path.resolve(process.cwd(), fileLocation || ''));
    const isJs = fileLocation.endsWith('.js') || fileLocation.endsWith('.cjs') || fileLocation.endsWith('.mjs');

    if (fs.existsSync(fileLocation) || fs.existsSync(relativePath)) {
        const fp: string = isJs
            ? (fs.existsSync(relativePath) ? relativePath : fileLocation)
            : (fs.existsSync(fileLocation) ? fileLocation : relativePath);

        try {
            let data;
            if (isJs) {
                // We use dynamic import for JS files in ESM context
                const imported = await import(path.resolve(fp));
                data = imported.default || imported;
            } else {
                data = JSON5.parse(fs.readFileSync(fp, 'utf8'));
            }

            if (data && (Array.isArray(data) === needArray)) res = data;
            if (data && typeof data === 'function') {
                res = await data(process.env.CURRENT_SESSION_ID || 'session');
            }
        } catch (error) {
            throw new Error(`Unable to parse config file. Please make sure ${fp} is valid. Error: ${error}`);
        }

        return res ? {
            ...res,
            confPath: fp
        } : undefined;
    }

    return undefined;
};
