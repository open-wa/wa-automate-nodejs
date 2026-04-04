/**
 * Tests for packages/core/src/cli/cli-options.ts
 * 
 * These tests verify the CLI option definitions are correct.
 */

describe('CLI Options', () => {
    beforeEach(() => {
        jest.resetModules();
    });

    it('should export optionList array', async () => {
        const { optionList } = await import('../cli-options');
        
        expect(Array.isArray(optionList)).toBe(true);
        expect(optionList.length).toBeGreaterThan(0);
    });

    it('should have required properties for each option', async () => {
        const { optionList } = await import('../cli-options');
        
        optionList.forEach(option => {
            expect(option).toHaveProperty('name');
            expect(typeof option.name).toBe('string');
        });
    });

    it('should include essential CLI options', async () => {
        const { optionList } = await import('../cli-options');
        const optionNames = optionList.map(o => o.name);
        
        // Core options
        expect(optionNames).toContain('port');
        expect(optionNames).toContain('config');
        expect(optionNames).toContain('session');
        expect(optionNames).toContain('webhook');
        expect(optionNames).toContain('license-key');
        expect(optionNames).toContain('help');
    });

    it('should have correct type for port option', async () => {
        const { optionList } = await import('../cli-options');
        const portOption = optionList.find(o => o.name === 'port');
        
        expect(portOption).toBeDefined();
        expect(portOption?.type).toBe(Number);
        expect(portOption?.default).toBe(8002);
        expect(portOption?.alias).toBe('p');
    });

    it('should have correct type for config option', async () => {
        const { optionList } = await import('../cli-options');
        const configOption = optionList.find(o => o.name === 'config');
        
        expect(configOption).toBeDefined();
        expect(configOption?.type).toBe(String);
        expect(configOption?.alias).toBe('c');
    });

    it('should have correct type for boolean options', async () => {
        const { optionList } = await import('../cli-options');
        
        const booleanOptions = ['no-api', 'verbose', 'socket', 'debug', 'cors'];
        
        booleanOptions.forEach(name => {
            const option = optionList.find(o => o.name === name);
            if (option && option.type) {
                expect(option.type).toBe(Boolean);
            }
        });
    });

    it('should have descriptions for all options', async () => {
        const { optionList } = await import('../cli-options');
        
        optionList.forEach(option => {
            // description is optional for 'help'
            if (option.name !== 'help') {
                expect(option.description).toBeDefined();
                expect(typeof option.description).toBe('string');
                expect(option.description!.length).toBeGreaterThan(0);
            }
        });
    });

    it('should have unique aliases', async () => {
        const { optionList } = await import('../cli-options');
        
        const aliases = optionList
            .filter(o => o.alias)
            .map(o => o.alias);
        
        const uniqueAliases = new Set(aliases);
        expect(aliases.length).toBe(uniqueAliases.size);
    });

    it('should have unique option names', async () => {
        const { optionList } = await import('../cli-options');
        
        const names = optionList.map(o => o.name);
        const uniqueNames = new Set(names);
        
        expect(names.length).toBe(uniqueNames.size);
    });

    it('should include chatwoot integration options', async () => {
        const { optionList } = await import('../cli-options');
        const optionNames = optionList.map(o => o.name);
        
        expect(optionNames).toContain('chatwoot-url');
        expect(optionNames).toContain('chatwoot-api-access-token');
        expect(optionNames).toContain('force-update-cw-webhook');
    });

    it('should include tunnel options', async () => {
        const { optionList } = await import('../cli-options');
        const optionNames = optionList.map(o => o.name);
        
        expect(optionNames).toContain('tunnel');
        expect(optionNames).toContain('cf-tunnel-host-domain');
        expect(optionNames).toContain('cf-tunnel-namespace');
    });

    it('should include security options', async () => {
        const { optionList } = await import('../cli-options');
        const optionNames = optionList.map(o => o.name);
        
        expect(optionNames).toContain('key');
        expect(optionNames).toContain('helmet');
        expect(optionNames).toContain('allow-ips');
        expect(optionNames).toContain('privkey');
        expect(optionNames).toContain('cert');
    });

    it('should have isMultiple flag for array options', async () => {
        const { optionList } = await import('../cli-options');
        
        const efOption = optionList.find(o => o.name === 'ef');
        expect(efOption).toBeDefined();
        expect((efOption as any)?.isMultiple).toBe(true);
        
        const allowIpsOption = optionList.find(o => o.name === 'allow-ips');
        expect(allowIpsOption).toBeDefined();
        expect((allowIpsOption as any)?.isMultiple).toBe(true);
    });

    it('should have default values for options with defaults', async () => {
        const { optionList } = await import('../cli-options');
        
        const optionsWithDefaults = optionList.filter(o => o.default !== undefined);
        
        expect(optionsWithDefaults.length).toBeGreaterThan(0);
        
        // Check specific defaults
        const portOption = optionList.find(o => o.name === 'port');
        expect(portOption?.default).toBe(8002);
        
        const hostOption = optionList.find(o => o.name === 'host');
        expect(hostOption?.default).toBe('localhost');
        
        const generateApiDocsOption = optionList.find(o => o.name === 'generate-api-docs');
        expect(generateApiDocsOption?.default).toBe(true);
    });
});
