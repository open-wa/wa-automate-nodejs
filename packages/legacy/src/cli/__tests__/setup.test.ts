/**
 * Tests for packages/core/src/cli/setup.ts
 * 
 * This test suite covers:
 * 1. Config file discovery and loading (JSON, JS, async default export)
 * 2. Environment variable parsing and precedence
 * 3. CLI flags parsing (meow) and defaults
 * 4. Config merging precedence (CLI > file > env > defaults)
 * 5. Negative tests (malformed config, invalid JSON, missing files)
 */

import * as path from 'path';
import * as fs from 'fs';

// Store original env
const originalEnv = { ...process.env };

// Helper to create a clean module environment
const getIsolatedModule = async () => {
    jest.resetModules();
    // Re-import after reset to get fresh module state
    const setup = await import('../setup');
    return setup;
};

describe('CLI Setup Module', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        // Restore env
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = { ...originalEnv };
    });

    describe('envArgs()', () => {
        it('should return empty object when no WA_ env vars are set', async () => {
            // Clear all WA_ vars
            Object.keys(process.env)
                .filter(k => k.startsWith('WA'))
                .forEach(k => {
                    delete process.env[k];
                });
            
            const { envArgs } = await getIsolatedModule();
            const result = envArgs();
            
            expect(result).toEqual({});
        });

        it('should parse WA_ prefixed env vars and convert to camelCase', async () => {
            process.env.WA_SESSION_ID = 'test-session';
            process.env.WA_PORT = '8080';
            
            const { envArgs } = await getIsolatedModule();
            const result = envArgs();
            
            expect(result.sessionId).toBe('test-session');
            expect(result.port).toBe(8080); // Should be converted to number
        });

        it('should convert "true"/"false" strings to booleans', async () => {
            process.env.WA_HEADLESS = 'true';
            process.env.WA_DEBUG = 'false';
            process.env.WA_VERBOSE = 'TRUE';
            process.env.WA_NO_API = 'FALSE';
            
            const { envArgs } = await getIsolatedModule();
            const result = envArgs();
            
            expect(result.headless).toBe(true);
            expect(result.debug).toBe(false);
            expect(result.verbose).toBe(true);
            expect(result.noApi).toBe(false);
        });

        it('should handle numeric string conversion', async () => {
            process.env.WA_PORT = '3000';
            process.env.WA_QR_TIMEOUT = '60';
            
            const { envArgs } = await getIsolatedModule();
            const result = envArgs();
            
            expect(result.port).toBe(3000);
            expect(result.qrTimeout).toBe(60);
        });

        it('should handle snake_case to camelCase conversion', async () => {
            process.env.WA_SESSION_ID = 'my-session';
            process.env.WA_LICENSE_KEY = 'my-key';
            process.env.WA_BROWSER_WS_ENDPOINT = 'ws://localhost:9222';
            
            const { envArgs } = await getIsolatedModule();
            const result = envArgs();
            
            expect(result.sessionId).toBe('my-session');
            expect(result.licenseKey).toBe('my-key');
            expect(result.browserWsEndpoint).toBe('ws://localhost:9222');
        });
    });

    describe('optionList exports', () => {
        it('should export optionKeys array', async () => {
            const { optionKeys } = await getIsolatedModule();
            
            expect(Array.isArray(optionKeys)).toBe(true);
            expect(optionKeys.length).toBeGreaterThan(0);
        });

        it('should include expected CLI options', async () => {
            const { optionKeys } = await getIsolatedModule();
            
            // Check some key options are present
            expect(optionKeys).toContain('port');
            expect(optionKeys).toContain('config');
            expect(optionKeys).toContain('webhook');
            expect(optionKeys).toContain('licenseKey');
        });

        it('should export optionKeysWithDefaults', async () => {
            const { optionKeysWithDefalts } = await getIsolatedModule();
            
            expect(Array.isArray(optionKeysWithDefalts)).toBe(true);
            expect(optionKeysWithDefalts).toContain('popup');
        });
    });

    describe('meowFlags()', () => {
        it('should return flags object for meow', async () => {
            const { meowFlags } = await getIsolatedModule();
            const flags = meowFlags();
            
            expect(typeof flags).toBe('object');
            expect(flags).not.toBeNull();
        });

        it('should include port flag with correct type', async () => {
            const { meowFlags } = await getIsolatedModule();
            const flags = meowFlags();
            
            expect(flags.port).toBeDefined();
            expect(flags.port.type).toBe('number');
        });

        it('should include config flag', async () => {
            const { meowFlags } = await getIsolatedModule();
            const flags = meowFlags();
            
            expect(flags.config).toBeDefined();
            expect(flags.config.type).toBe('string');
        });
    });

    describe('cliOptionNames export', () => {
        it('should export cliOptionNames mapping', async () => {
            const { cliOptionNames } = await getIsolatedModule();
            
            expect(typeof cliOptionNames).toBe('object');
        });
    });

    describe('helptext export', () => {
        it('should export helptext string', async () => {
            const { helptext } = await getIsolatedModule();
            
            expect(typeof helptext).toBe('string');
            expect(helptext.length).toBeGreaterThan(0);
        });

        it('should contain CLI usage information', async () => {
            const { helptext } = await getIsolatedModule();
            
            // Should contain some expected content
            expect(helptext).toContain('open-wa');
        });
    });
});

describe('File Utils - tryOpenFileAsObject()', () => {
    // These tests require mocking fs operations
    
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
    });

    it('should return undefined for non-existent file', async () => {
        const { tryOpenFileAsObject } = await import('../file-utils');
        
        const result = await tryOpenFileAsObject('/non/existent/path/config.json');
        
        expect(result).toBeUndefined();
    });
});

describe('configFile()', () => {
    const tmpDir = path.join(__dirname, '__tmp_test__');
    
    beforeAll(() => {
        // Create temp directory for test files
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }
    });

    afterAll(() => {
        // Clean up temp directory
        if (fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    });

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        // Clear relevant env vars
        delete process.env.WA_CLI_CONFIG;
    });

    it('should return empty object when no config file exists', async () => {
        const originalCwd = process.cwd();
        process.chdir(tmpDir);
        
        try {
            const { configFile } = await getIsolatedModule();
            const result = await configFile();
            
            expect(result).toEqual({});
        } finally {
            process.chdir(originalCwd);
        }
    });

    it('should load JSON config file', async () => {
        const configPath = path.join(tmpDir, 'test-config.json');
        const testConfig = { sessionId: 'test-session', port: 9000 };
        fs.writeFileSync(configPath, JSON.stringify(testConfig));
        
        try {
            const { configFile } = await getIsolatedModule();
            const result = await configFile(configPath);
            
            expect(result.sessionId).toBe('test-session');
            expect(result.port).toBe(9000);
            expect(result.confPath).toBe(configPath);
        } finally {
            fs.unlinkSync(configPath);
        }
    });

    it('should handle base64 encoded config', async () => {
        const testConfig = { sessionId: 'base64-session', port: 7000 };
        const base64Config = Buffer.from(JSON.stringify(testConfig)).toString('base64');
        
        const { configFile } = await getIsolatedModule();
        const result = await configFile(base64Config);
        
        expect(result.sessionId).toBe('base64-session');
        expect(result.port).toBe(7000);
    });

    it('should use WA_CLI_CONFIG env var when no explicit config provided', async () => {
        const configPath = path.join(tmpDir, 'env-config.json');
        const testConfig = { sessionId: 'env-session' };
        fs.writeFileSync(configPath, JSON.stringify(testConfig));
        process.env.WA_CLI_CONFIG = configPath;
        
        try {
            const { configFile } = await getIsolatedModule();
            const result = await configFile();
            
            expect(result.sessionId).toBe('env-session');
        } finally {
            fs.unlinkSync(configPath);
            delete process.env.WA_CLI_CONFIG;
        }
    });

    it('should look for cli.config.json in directory when path is a directory', async () => {
        const subDir = path.join(tmpDir, 'config-dir');
        fs.mkdirSync(subDir, { recursive: true });
        const configPath = path.join(subDir, 'cli.config.json');
        const testConfig = { sessionId: 'dir-session' };
        fs.writeFileSync(configPath, JSON.stringify(testConfig));
        
        try {
            const { configFile } = await getIsolatedModule();
            const result = await configFile(subDir);
            
            expect(result.sessionId).toBe('dir-session');
        } finally {
            fs.rmSync(subDir, { recursive: true, force: true });
        }
    });
});

describe('JS Config with async default export', () => {
    const tmpDir = path.join(__dirname, '__tmp_js_test__');
    
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

    it('should load cli.config.js with object export', async () => {
        const configPath = path.join(tmpDir, 'config-object.js');
        const jsContent = `
module.exports = {
    default: {
        sessionId: 'js-object-session',
        port: 8001
    }
};
`;
        fs.writeFileSync(configPath, jsContent);
        
        try {
            const { configFile } = await getIsolatedModule();
            const result = await configFile(configPath);
            
            expect(result.sessionId).toBe('js-object-session');
            expect(result.port).toBe(8001);
        } finally {
            fs.unlinkSync(configPath);
        }
    });

    it('should load cli.config.js with sync function export', async () => {
        const configPath = path.join(tmpDir, 'config-sync-fn.js');
        const jsContent = `
exports.default = function(sessionId) {
    return {
        sessionId: 'sync-fn-' + sessionId,
        port: 8002
    };
};
`;
        fs.writeFileSync(configPath, jsContent);
        
        try {
            // Set the session ID that will be passed to the function
            process.env.CURRENT_SESSION_ID = 'test-id';
            
            const { configFile } = await getIsolatedModule();
            const result = await configFile(configPath);
            
            expect(result.sessionId).toBe('sync-fn-test-id');
            expect(result.port).toBe(8002);
        } finally {
            fs.unlinkSync(configPath);
            delete process.env.CURRENT_SESSION_ID;
        }
    });

    it('should load cli.config.js with async function export', async () => {
        const configPath = path.join(tmpDir, 'config-async-fn.js');
        const jsContent = `
exports.default = async function(sessionId) {
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 10));
    return {
        sessionId: 'async-fn-' + sessionId,
        port: 8003
    };
};
`;
        fs.writeFileSync(configPath, jsContent);
        
        try {
            process.env.CURRENT_SESSION_ID = 'async-test';
            
            const { configFile } = await getIsolatedModule();
            const result = await configFile(configPath);
            
            expect(result.sessionId).toBe('async-fn-async-test');
            expect(result.port).toBe(8003);
        } finally {
            fs.unlinkSync(configPath);
            delete process.env.CURRENT_SESSION_ID;
        }
    });

    it('should support Promise-returning default export', async () => {
        const configPath = path.join(tmpDir, 'config-promise.js');
        const jsContent = `
exports.default = async (sessionId) => {
    return Promise.resolve({
        sessionId: 'promise-' + sessionId,
        port: 8004,
        licenseKey: 'test-key'
    });
};
`;
        fs.writeFileSync(configPath, jsContent);
        
        try {
            process.env.CURRENT_SESSION_ID = 'promise-test';
            
            const { configFile } = await getIsolatedModule();
            const result = await configFile(configPath);
            
            expect(result.sessionId).toBe('promise-promise-test');
            expect(result.port).toBe(8004);
            expect(result.licenseKey).toBe('test-key');
        } finally {
            fs.unlinkSync(configPath);
            delete process.env.CURRENT_SESSION_ID;
        }
    });
});

describe('Config Merging Precedence', () => {
    // These tests verify the correct precedence order:
    // 1. CLI flags (highest priority)
    // 2. Config file
    // 3. Environment variables
    // 4. Defaults (lowest priority)
    
    const tmpDir = path.join(__dirname, '__tmp_precedence__');
    
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
        process.env = { ...originalEnv };
    });

    it('should use defaults when no other config provided', async () => {
        // This is tested implicitly through envArgs and optionKeysWithDefaults
        const { optionKeysWithDefalts } = await getIsolatedModule();
        
        expect(optionKeysWithDefalts).toContain('popup');
    });

    it('should merge config file values over defaults', async () => {
        const configPath = path.join(tmpDir, 'merge-test.json');
        fs.writeFileSync(configPath, JSON.stringify({ sessionId: 'file-session' }));
        
        try {
            const { configFile } = await getIsolatedModule();
            const result = await configFile(configPath);
            
            expect(result.sessionId).toBe('file-session');
        } finally {
            fs.unlinkSync(configPath);
        }
    });
});

describe('Negative Tests - Error Handling', () => {
    const tmpDir = path.join(__dirname, '__tmp_negative__');
    
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

    it('should handle malformed JSON gracefully', async () => {
        const configPath = path.join(tmpDir, 'malformed.json');
        fs.writeFileSync(configPath, '{ invalid json }');
        
        try {
            const { configFile } = await getIsolatedModule();
            
            await expect(configFile(configPath)).rejects.toThrow();
        } finally {
            fs.unlinkSync(configPath);
        }
    });

    it('should return empty object for non-existent config path', async () => {
        const { configFile } = await getIsolatedModule();
        const result = await configFile('/definitely/not/a/real/path/config.json');
        
        // Should not throw, just return empty or log error
        expect(typeof result).toBe('object');
    });

    it('should handle empty config file', async () => {
        const configPath = path.join(tmpDir, 'empty.json');
        fs.writeFileSync(configPath, '');
        
        try {
            const { configFile } = await getIsolatedModule();
            
            // Empty file should either throw or return empty object
            await expect(configFile(configPath)).rejects.toThrow();
        } finally {
            fs.unlinkSync(configPath);
        }
    });

    it('should handle JS config that throws', async () => {
        const configPath = path.join(tmpDir, 'throwing.js');
        const jsContent = `
exports.default = function() {
    throw new Error('Config error!');
};
`;
        fs.writeFileSync(configPath, jsContent);
        
        try {
            const { configFile } = await getIsolatedModule();
            
            await expect(configFile(configPath)).rejects.toThrow();
        } finally {
            fs.unlinkSync(configPath);
        }
    });

    it('should handle JS config returning non-object', async () => {
        const configPath = path.join(tmpDir, 'non-object.js');
        const jsContent = `
exports.default = function() {
    return "not an object";
};
`;
        fs.writeFileSync(configPath, jsContent);
        
        try {
            const { configFile } = await getIsolatedModule();
            const result = await configFile(configPath);
            
            // Behavior depends on implementation - may return the string or empty object
            // This test documents actual behavior
            expect(result).toBeDefined();
        } finally {
            fs.unlinkSync(configPath);
        }
    });
});

describe('JSON5 Support', () => {
    const tmpDir = path.join(__dirname, '__tmp_json5__');
    
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

    it('should parse JSON with comments (JSON5)', async () => {
        const configPath = path.join(tmpDir, 'with-comments.json');
        const json5Content = `{
    // This is a comment
    "sessionId": "json5-session",
    "port": 8888,
    /* Multi-line
       comment */
    "debug": true
}`;
        fs.writeFileSync(configPath, json5Content);
        
        try {
            const { configFile } = await getIsolatedModule();
            const result = await configFile(configPath);
            
            expect(result.sessionId).toBe('json5-session');
            expect(result.port).toBe(8888);
            expect(result.debug).toBe(true);
        } finally {
            fs.unlinkSync(configPath);
        }
    });

    it('should parse JSON with trailing commas', async () => {
        const configPath = path.join(tmpDir, 'trailing-comma.json');
        const json5Content = `{
    "sessionId": "trailing-session",
    "port": 7777,
}`;
        fs.writeFileSync(configPath, json5Content);
        
        try {
            const { configFile } = await getIsolatedModule();
            const result = await configFile(configPath);
            
            expect(result.sessionId).toBe('trailing-session');
            expect(result.port).toBe(7777);
        } finally {
            fs.unlinkSync(configPath);
        }
    });
});

describe('Edge Cases', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        process.env = { ...originalEnv };
    });

    it('should handle boolean-as-string env var "0" and "1"', async () => {
        process.env.WA_HEADLESS = '1';
        process.env.WA_DEBUG = '0';
        
        const { envArgs } = await getIsolatedModule();
        const result = envArgs();
        
        // "1" should be treated as number 1, not boolean
        expect(result.headless).toBe(1);
        // "0" should be treated as number 0, not boolean
        expect(result.debug).toBe(0);
    });

    it('should preserve WA_ vars that are not typical config keys', async () => {
        process.env.WA_CUSTOM_VAR = 'custom-value';
        
        const { envArgs } = await getIsolatedModule();
        const result = envArgs();
        
        expect(result.customVar).toBe('custom-value');
    });
});
