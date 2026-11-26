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

    describe('RemoteClient.ts', () => {
        const remoteClientPath = path.join(generatedDir, 'RemoteClient.ts');
        const parametersPath = path.join(generatedDir, 'methodParameters.ts');

        it('declares named and positional signatures from the registry order', () => {
            const content = fs.readFileSync(remoteClientPath, 'utf-8');

            expect(content).toContain('sendText(params: T.SendTextInput): Promise<T.SendTextOutput>;');
            expect(content).toContain('sendText(to: T.SendTextInput["to"], content: T.SendTextInput["content"], options?: T.SendTextInput["options"]): Promise<T.SendTextOutput>;');
            // A required argument after an optional one keeps every earlier argument required.
            expect(content).toMatch(/sendReplyWithMentions\(to: [^,]+, content: [^,]+, replyMessageId: [^,]+, hideTags\?: /);
        });

        it('covers every registered method and flat alias', () => {
            const content = fs.readFileSync(remoteClientPath, 'utf-8');
            const inputs = content.slice(content.indexOf('export interface RemoteMethodInputs'), content.indexOf('export interface RemoteMethodOutputs'));

            for (const def of clientRegistry.getAll()) {
                const names = [def.meta.functionName, ...(def.meta.allAliases ?? []).filter((alias) => !alias.includes('.'))];
                for (const name of names) {
                    expect(inputs).toContain(`  ${name}: T.`);
                    expect(content).toContain(`  ${name}(`);
                }
            }
        });

        it('writes the positional parameter names without importing the schemas', () => {
            const content = fs.readFileSync(parametersPath, 'utf-8');

            expect(content).not.toMatch(/^import /m);
            expect(content).toContain('"sendText": ["to","content","options"],');
            expect(content).toContain('methodsWithObjectFirstParameter');
            expect(content).toMatch(/methodsWithObjectFirstParameter[^\n]*"decryptMedia"/);
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
            // Sub-headings are literal <h3> elements: out of the TOC, with no copy-link button.
            expect(content).toContain('<h3 id="sendtext-usage" className="scroll-m-28">Usage</h3>');
            expect(content).not.toContain('[!toc]');
            expect(content).toContain('<InterfaceTab value="SDK">');
            expect(content).toContain('<InterfaceTab value="SocketClient">');
            expect(content).toContain('<InterfaceTab value="HTTP">');
            expect(content).toContain('curl -X POST "http://localhost:8080/api/messages/sendText"');
            expect(content).toContain('<h3 id="sendtext-parameters" className="scroll-m-28">Parameters</h3>');
            expect(content).toContain('| `to` | `string` | Recipient chat ID. The target chat for a send operation. Also accepts `chatId`. |');
            expect(content).not.toContain('AutoTypeTable');
            expect(content).toContain('<h3 id="sendtext-returns" className="scroll-m-28">Returns</h3>');
            expect(content).toContain('Resolves to [`MessageId`](/docs/reference/client/return-types#messageid).');
            expect(content).toContain('**HTTP:** `POST /api/messages/sendText`, or `/api/sendText`. **Also named:** `messages.sendText`.');
            expect(content).not.toContain('<details>');
            expect(content).not.toContain('"options": {}');
            expect(content).not.toContain('**Signature**');
        });

        it('should render licensed methods inside the tier treatment with a license sentence', () => {
            expect(fs.existsSync(messagesPath)).toBe(true);
            const content = fs.readFileSync(messagesPath, 'utf-8');

            expect(content).toContain('<LicensedMethodSection tier="insiders">');
            expect(content).toContain('## `sendButtons`');
            expect(content).toContain('Needs an Insiders license.');
        });

        it('should link documented parameter types to Return types instead of expanding them', () => {
            const content = fs.readFileSync(messagesPath, 'utf-8');

            expect(content).toContain('client.sendInteractive(to: string, content: InteractiveContent): Promise<string>');
            expect(content).toContain('| `content` | [`InteractiveContent`](/docs/reference/client/return-types#interactivecontent) |');
            expect(fs.readFileSync(path.join(clientDocsDir, 'media.mdx'), 'utf-8')).toContain('client.decryptMedia(message: Message): Promise<DataURL>');
        });

        it('should make the A–Z page a lookup that links to namespace anchors', () => {
            const content = fs.readFileSync(path.join(clientDocsDir, 'client.mdx'), 'utf-8');
            const count = clientRegistry.getAll().length;

            expect(content).toContain(`<ClientReference total={${count}}>`);
            expect(content).toContain('| [`sendText`](/docs/reference/client/messages#sendtext) | Messages |');
            expect(content.match(/^\| \[`/gm)).toHaveLength(count);
            expect(content).not.toContain('<details>');
            expect(content).not.toContain('```');
        });

        it('should keep Return types declarations without repeating shared fields', () => {
            const content = fs.readFileSync(path.join(clientDocsDir, 'return-types.mdx'), 'utf-8');
            const story = content.slice(content.indexOf('## Story'), content.indexOf('\n## ', content.indexOf('## Story') + 1));

            expect(content).toContain('<TypeDeclaration name="Message" code={"type Message = {');
            expect(story).toContain('Story has the same fields as [Message](/docs/reference/client/return-types#message), apart from these.');
            expect(story).not.toContain('| `body` |');
        });

        it('should title the media method page apart from the media guide', () => {
            expect(fs.readFileSync(path.join(clientDocsDir, 'media.mdx'), 'utf-8')).toContain('title: "Media methods"');
        });

        it('should keep implementation mechanisms out of the generated pages', () => {
            const pages = fs.readdirSync(clientDocsDir).filter((fileName) => fileName.endsWith('.mdx'));
            for (const page of pages) {
                const content = fs.readFileSync(path.join(clientDocsDir, page), 'utf-8');
                expect(content, page).not.toMatch(/private patch|installed patch|\bwapi|webpack|inject|donor|schema-registry|Client API/i);
            }
        });

        it('should visibly label deprecated alias routes', () => {
            const contactsPath = path.join(clientDocsDir, 'contacts.mdx');
            expect(fs.existsSync(contactsPath)).toBe(true);
            const content = fs.readFileSync(contactsPath, 'utf-8');

            expect(content).toContain('## `blockContact`');
            expect(content).toContain('Deprecated routes: `/api/contactBlock`, `/api/contacts/contactBlock`.');
            expect(content).toContain('Deprecated names: `contactBlock`, `contacts.contactBlock`.');
        });
    });
});
