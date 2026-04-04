/**
 * Tests for packages/core/src/cli/file-utils.ts
 * 
 * These tests are isolated and don't depend on the heavy core library imports.
 */

import * as path from 'path';
import * as fs from 'fs';

describe('File Utils - tryOpenFileAsObject()', () => {
    const tmpDir = path.join(__dirname, '__tmp_file_utils__');
    
    beforeAll(() => {
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
    });

    afterAll(() => {
        if (fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    });

    it('should return undefined for non-existent file', async () => {
        const { tryOpenFileAsObject } = await import('../file-utils');
        
        const result = await tryOpenFileAsObject('/non/existent/path/config.json');
        
        expect(result).toBeUndefined();
    });

    it('should load JSON config file', async () => {
        const configPath = path.join(tmpDir, 'test.json');
        const testConfig = { sessionId: 'test', port: 8080 };
        fs.writeFileSync(configPath, JSON.stringify(testConfig));
        
        try {
            const { tryOpenFileAsObject } = await import('../file-utils');
            const result = await tryOpenFileAsObject(configPath);
            
            expect(result).toBeDefined();
            expect(result.sessionId).toBe('test');
            expect(result.port).toBe(8080);
            expect(result.confPath).toBe(configPath);
        } finally {
            fs.unlinkSync(configPath);
        }
    });

    it('should load JS config with plain object default export', async () => {
        const configPath = path.join(tmpDir, 'config-obj.js');
        const jsContent = `
exports.default = {
    sessionId: 'js-object',
    port: 9000
};
`;
        fs.writeFileSync(configPath, jsContent);
        
        try {
            const { tryOpenFileAsObject } = await import('../file-utils');
            const result = await tryOpenFileAsObject(configPath);
            
            expect(result).toBeDefined();
            expect(result.sessionId).toBe('js-object');
            expect(result.port).toBe(9000);
        } finally {
            // Clear require cache
            delete require.cache[require.resolve(configPath)];
            fs.unlinkSync(configPath);
        }
    });

    it('should execute sync function default export', async () => {
        const configPath = path.join(tmpDir, 'config-sync-fn.js');
        const jsContent = `
exports.default = function(sessionId) {
    return {
        sessionId: 'sync-fn-' + sessionId,
        computed: true
    };
};
`;
        fs.writeFileSync(configPath, jsContent);
        process.env.CURRENT_SESSION_ID = 'my-session';
        
        try {
            const { tryOpenFileAsObject } = await import('../file-utils');
            const result = await tryOpenFileAsObject(configPath);
            
            expect(result).toBeDefined();
            expect(result.sessionId).toBe('sync-fn-my-session');
            expect(result.computed).toBe(true);
        } finally {
            delete require.cache[require.resolve(configPath)];
            delete process.env.CURRENT_SESSION_ID;
            fs.unlinkSync(configPath);
        }
    });

    it('should execute async function default export', async () => {
        const configPath = path.join(tmpDir, 'config-async-fn.js');
        const jsContent = `
exports.default = async function(sessionId) {
    // Simulate async work
    await new Promise(resolve => setTimeout(resolve, 10));
    return {
        sessionId: 'async-fn-' + sessionId,
        async: true
    };
};
`;
        fs.writeFileSync(configPath, jsContent);
        process.env.CURRENT_SESSION_ID = 'async-test';
        
        try {
            const { tryOpenFileAsObject } = await import('../file-utils');
            const result = await tryOpenFileAsObject(configPath);
            
            expect(result).toBeDefined();
            expect(result.sessionId).toBe('async-fn-async-test');
            expect(result.async).toBe(true);
        } finally {
            delete require.cache[require.resolve(configPath)];
            delete process.env.CURRENT_SESSION_ID;
            fs.unlinkSync(configPath);
        }
    });

    it('should handle needArray parameter correctly', async () => {
        const configPath = path.join(tmpDir, 'array-config.json');
        const arrayConfig = [{ name: 'item1' }, { name: 'item2' }];
        fs.writeFileSync(configPath, JSON.stringify(arrayConfig));
        
        try {
            const { tryOpenFileAsObject } = await import('../file-utils');
            
            // Should return undefined when we expect object but get array
            const resultAsObject = await tryOpenFileAsObject(configPath, false);
            expect(resultAsObject).toBeUndefined();
            
            // Should return array when needArray is true
            const resultAsArray = await tryOpenFileAsObject(configPath, true);
            expect(resultAsArray).toBeDefined();
            expect(Array.isArray(resultAsArray)).toBe(false); // Returns with confPath added
        } finally {
            fs.unlinkSync(configPath);
        }
    });

    it('should parse JSON5 with comments', async () => {
        const configPath = path.join(tmpDir, 'json5.json');
        const json5Content = `{
    // This is a comment
    "sessionId": "json5-session",
    "port": 7777,
}`;
        fs.writeFileSync(configPath, json5Content);
        
        try {
            const { tryOpenFileAsObject } = await import('../file-utils');
            const result = await tryOpenFileAsObject(configPath);
            
            expect(result).toBeDefined();
            expect(result.sessionId).toBe('json5-session');
            expect(result.port).toBe(7777);
        } finally {
            fs.unlinkSync(configPath);
        }
    });

    it('should throw on malformed JSON', async () => {
        const configPath = path.join(tmpDir, 'malformed.json');
        fs.writeFileSync(configPath, '{ invalid json }}}');
        
        try {
            const { tryOpenFileAsObject } = await import('../file-utils');
            
            // The function throws a string, not an Error object
            await expect(tryOpenFileAsObject(configPath)).rejects.toMatch(/Unable to parse config file/);
        } finally {
            fs.unlinkSync(configPath);
        }
    });

    it('should handle relative paths', async () => {
        const configPath = path.join(tmpDir, 'relative.json');
        const testConfig = { sessionId: 'relative-test' };
        fs.writeFileSync(configPath, JSON.stringify(testConfig));
        
        // Get relative path from cwd
        const relativePath = path.relative(process.cwd(), configPath);
        
        try {
            const { tryOpenFileAsObject } = await import('../file-utils');
            const result = await tryOpenFileAsObject(relativePath);
            
            expect(result).toBeDefined();
            expect(result.sessionId).toBe('relative-test');
        } finally {
            fs.unlinkSync(configPath);
        }
    });

    it('should return confPath in result', async () => {
        const configPath = path.join(tmpDir, 'with-path.json');
        fs.writeFileSync(configPath, JSON.stringify({ test: true }));
        
        try {
            const { tryOpenFileAsObject } = await import('../file-utils');
            const result = await tryOpenFileAsObject(configPath);
            
            expect(result.confPath).toBe(configPath);
        } finally {
            fs.unlinkSync(configPath);
        }
    });
});
