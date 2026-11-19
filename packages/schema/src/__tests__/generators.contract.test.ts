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
        const referenceMetaPath = path.join(clientDocsDir, '../meta.json');
        const messagesPath = path.join(clientDocsDir, 'messages.mdx');

        it('should create the overview page and list namespaces first in the sidebar', () => {
            expect(fs.existsSync(indexPath)).toBe(true);
            expect(fs.existsSync(referenceMetaPath)).toBe(true);

            const indexContent = fs.readFileSync(indexPath, 'utf-8');
            const meta = JSON.parse(fs.readFileSync(referenceMetaPath, 'utf-8'));

            expect(indexContent).toContain('title: "Overview"');
            expect(indexContent).toContain('<Cards>');
            expect(indexContent).toContain('<Card title="Messages" href="/docs/reference/client/messages">');
            expect(indexContent).not.toContain('gen-client-reference-docs');
            expect(indexContent).not.toMatch(/schema[- ]registry/i);
            expect(meta.title).toBe('API reference');
            expect(meta.pages.slice(0, 3)).toEqual(['!index', 'client/index', 'client/messages']);
            expect(meta.pages.indexOf('client/messages')).toBeLessThan(meta.pages.indexOf('create'));
            expect(meta.pages.at(-1)).toBe('client/send-text-worked-example');
            expect(meta.pages).not.toContain('workspaces');
        });

        it('should create a generated MDX page for every namespace', () => {
            const namespaces = Array.from(new Set(clientRegistry.getAll().map((def) => def.meta.namespace || 'core'))).sort();
            const mdxFiles = fs
                .readdirSync(clientDocsDir)
                .filter((fileName) => fileName.endsWith('.mdx') && fileName !== 'index.mdx' && fileName !== 'client.mdx')
                .sort();

            expect(mdxFiles).toEqual(expect.arrayContaining(namespaces.map((namespace) => `${namespace === 'events' ? 'whatsapp-events' : namespace.toLowerCase()}.mdx`)));
        });

        it('should order methods by use and render sendText details', () => {
            expect(fs.existsSync(messagesPath)).toBe(true);
            const content = fs.readFileSync(messagesPath, 'utf-8');

            expect(content).toContain('title: "Messages"');
            expect(content.indexOf('## `sendText`')).toBeGreaterThan(-1);
            expect(content.indexOf('## `sendText`')).toBeLessThan(content.indexOf('## `sendImage`'));
            expect(content.indexOf('## `sendImage`')).toBeLessThan(content.indexOf('## `deleteMessage`'));
            expect(content).toContain('```ts\nclient.sendText(to: string, content: string, options?: unknown): Promise<MessageId>\n```');
            expect(content).toContain('### Usage [!toc] [#sendtext-usage]');
            expect(content).toContain('<InterfaceTab value="SDK">');
            expect(content).toContain('<InterfaceTab value="SocketClient">');
            expect(content).toContain('<InterfaceTab value="HTTP">');
            expect(content).toContain('curl -X POST "http://localhost:8080/api/messages/sendText"');
            expect(content).toContain('### Parameters [!toc] [#sendtext-parameters]');
            expect(content).toContain('<AutoTypeTable path="./generated-method-params.ts" name="SendTextParams" />');
            expect(content).toContain('### Returns [!toc] [#sendtext-returns]');
            expect(content).toContain('Resolves to [`MessageId`](/docs/reference/client/return-types#messageid).');
            expect(content).toContain('| Namespace | `messages` |');
            expect(content).toContain('| Positional parameter order | `to`, `content`, `options` |');
            expect(content).toContain('| Aliases | `messages.sendText` |');
            expect(content).toContain('**HTTP routes**');
            expect(content).toContain('| Primary | `POST` | `/api/messages/sendText` | `sendText` | Active |');
            expect(content).toContain('| Alias | `POST` | `/api/sendText` | `sendText` | Active |');
            expect(content).not.toContain('"options": {}');
            expect(content).not.toContain('**Signature**');
        });

        it('should render licensed methods inside the tier treatment with a license sentence', () => {
            expect(fs.existsSync(messagesPath)).toBe(true);
            const content = fs.readFileSync(messagesPath, 'utf-8');

            expect(content).toContain('<LicensedMethodSection tier="insiders">');
            expect(content).toContain('## `sendButtons`');
            expect(content).toContain('Needs an Insiders license.');
            expect(content).toContain('| License | `insiders` |');
        });

        it('should keep implementation mechanisms out of the generated pages', () => {
            const pages = fs.readdirSync(clientDocsDir).filter((fileName) => fileName.endsWith('.mdx'));
            for (const page of pages) {
                const content = fs.readFileSync(path.join(clientDocsDir, page), 'utf-8');
                expect(content, page).not.toMatch(/private patch|installed patch|\bwapi|webpack|inject|donor|schema-registry|Client API/i);
            }
        });

        it('should visibly label deprecated alias routes in route tables', () => {
            const contactsPath = path.join(clientDocsDir, 'contacts.mdx');
            expect(fs.existsSync(contactsPath)).toBe(true);
            const content = fs.readFileSync(contactsPath, 'utf-8');

            expect(content).toContain('## `blockContact`');
            expect(content).toContain('| Deprecated alias | `PUT` | `/api/contactBlock` | `contactBlock` | **Deprecated** |');
            expect(content).toContain('| Deprecated alias | `PUT` | `/api/contacts/contactBlock` | `contacts.contactBlock` | **Deprecated** |');
        });
    });
});
