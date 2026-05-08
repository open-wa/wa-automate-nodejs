import fs from 'fs';
import path from 'path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { clientRegistry } from '../registry';
import '../methods';

const generatedDir = path.join(__dirname, '../generated');
const clientDocsDir = path.join(__dirname, '../../../../apps/docs/content/docs/reference/client');
const execFileAsync = promisify(execFile);

describe('generator outputs', () => {
    describe('openapi.json', () => {
        const openapiPath = path.join(generatedDir, 'openapi.json');
        
        it('should exist', () => {
            expect(fs.existsSync(openapiPath)).toBe(true);
        });

        it('should be valid JSON', () => {
            const content = fs.readFileSync(openapiPath, 'utf-8');
            expect(() => JSON.parse(content)).not.toThrow();
        });

        it('should have paths for registered methods', () => {
            const content = JSON.parse(fs.readFileSync(openapiPath, 'utf-8'));
            const pathCount = Object.keys(content.paths || {}).length;
            const methodCount = clientRegistry.getAll().length;
            
            expect(pathCount).toBeGreaterThan(methodCount * 0.9);
        });

        it('should have valid OpenAPI structure', () => {
            const content = JSON.parse(fs.readFileSync(openapiPath, 'utf-8'));
            
            expect(content.openapi).toBe('3.0.3');
            expect(content.info).toBeDefined();
            expect(content.info.title).toBeTruthy();
            expect(content.paths).toBeDefined();
        });
    });

    describe('types.ts', () => {
        const typesPath = path.join(generatedDir, 'types.ts');
        
        it('should exist', () => {
            expect(fs.existsSync(typesPath)).toBe(true);
        });

        it('should have type exports for methods', () => {
            const content = fs.readFileSync(typesPath, 'utf-8');
            
            expect(content).toContain('SendTextInput');
            expect(content).toContain('SendTextOutput');
            expect(content).toContain('export type');
        });

        it.skip('should not have TypeScript errors', async () => {
            if (!process.env.TS_CHECK) {
                return;
            }

            await expect(execFileAsync('npx', ['tsc', '--noEmit', typesPath])).resolves.toBeDefined();
        });
    });

    describe('BaseClient.ts', () => {
        const baseClientPath = path.join(generatedDir, 'BaseClient.ts');
        const generatedIndexPath = path.join(generatedDir, 'index.ts');
        
        it('should exist', () => {
            expect(fs.existsSync(baseClientPath)).toBe(true);
        });

        it('should have method implementations', () => {
            const content = fs.readFileSync(baseClientPath, 'utf-8');
            
            expect(content).toContain('sendText = implementMethod');
            expect(content).toContain('public sendText');
        });

        it('should have at least expected method count', () => {
            const content = fs.readFileSync(baseClientPath, 'utf-8');
            const methodCount = clientRegistry.getAll().length;
            
            const matches = content.match(/implementMethod/g) || [];
            expect(matches.length).toBeGreaterThanOrEqual(methodCount);
        });

        it('should create a generated package index', () => {
            expect(fs.existsSync(generatedIndexPath)).toBe(true);
            const content = fs.readFileSync(generatedIndexPath, 'utf-8');
            expect(content).toContain("export * from './BaseClient'");
            expect(content).toContain("export * from './types'");
        });
    });

    describe('Client API reference docs', () => {
        const indexPath = path.join(clientDocsDir, 'index.mdx');
        const metaPath = path.join(clientDocsDir, 'meta.json');
        const messagesPath = path.join(clientDocsDir, 'messages.mdx');

        it('should create client docs index and navigation metadata', () => {
            expect(fs.existsSync(indexPath)).toBe(true);
            expect(fs.existsSync(metaPath)).toBe(true);

            const indexContent = fs.readFileSync(indexPath, 'utf-8');
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

            expect(indexContent).toContain('Generated file warning');
            expect(indexContent).toContain('packages/schema/scripts/gen-client-reference-docs.ts');
            expect(meta.title).toBe('Client API');
            expect(meta.pages).toContain('messages');
        });

        it('should create one generated MDX page per namespace', () => {
            const namespaces = Array.from(new Set(clientRegistry.getAll().map((def) => def.meta.namespace || 'core'))).sort();
            const mdxFiles = fs
                .readdirSync(clientDocsDir)
                .filter((fileName) => fileName.endsWith('.mdx') && fileName !== 'index.mdx')
                .sort();

            expect(mdxFiles).toEqual(namespaces.map((namespace) => `${namespace.toLowerCase()}.mdx`));
        });

        it('should include sendText method details from the schema registry', () => {
            expect(fs.existsSync(messagesPath)).toBe(true);
            const content = fs.readFileSync(messagesPath, 'utf-8');

            expect(content).toContain('Generated file warning');
            expect(content).toContain('packages/schema/scripts/gen-client-reference-docs.ts');
            expect(content).toContain('## `sendText`');
            expect(content).toContain('- Namespace: `messages`');
            expect(content).toContain('- HTTP route: `POST /api/messages/sendText`');
            expect(content).toContain('- Aliases: `messages.sendText`');
            expect(content).toContain('| `to` |');
            expect(content).toContain('Recipient chat ID');
            expect(content).toContain('| `content` |');
            expect(content).toContain('Message content');
            expect(content).toContain('Returns: `');
        });
    });
});
