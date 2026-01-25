/**
 * Mock for is-url-superb ESM module
 */
const isUrl = (str: string): boolean => {
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
};

export default isUrl;
