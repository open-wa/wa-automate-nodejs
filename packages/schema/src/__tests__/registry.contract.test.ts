import { clientRegistry } from '../registry';
import '../methods'; // Trigger registration

describe('clientRegistry contract', () => {
    describe('registration', () => {
        it('should have registered methods', () => {
            const methods = clientRegistry.getAll();
            expect(methods.length).toBeGreaterThan(100); // We have 121 methods
        });

        it('should have unique method names', () => {
            const names = clientRegistry.getNames();
            const uniqueNames = new Set(names);
            expect(uniqueNames.size).toBe(names.length);
        });

        it('should have required metadata for each method', () => {
            const methods = clientRegistry.getAll();
            
            methods.forEach((def) => {
                expect(def.meta.functionName).toBeTruthy();
                expect(def.meta.parameterOrder).toBeInstanceOf(Array);
                expect(def.meta.inputSchema).toBeDefined();
                expect(def.meta.outputSchema).toBeDefined();
            });
        });
    });

    describe('lookup', () => {
        it('should find method by name', () => {
            const sendText = clientRegistry.get('sendText');
            expect(sendText).toBeDefined();
            expect(sendText?.meta.functionName).toBe('sendText');
        });

        it('should find method by schema', () => {
            const sendTextDef = clientRegistry.get('sendText');
            expect(sendTextDef).toBeDefined();
            
            const foundBySchema = clientRegistry.getBySchema(sendTextDef!.schema);
            expect(foundBySchema?.meta.functionName).toBe('sendText');
        });

        it('should return undefined for non-existent method', () => {
            const notFound = clientRegistry.get('thisMethodDoesNotExist');
            expect(notFound).toBeUndefined();
        });
    });

    describe('namespaces', () => {
        it('should have methods in messaging namespace', () => {
            const messagingMethods = clientRegistry.getByNamespace('messages');
            expect(messagingMethods.length).toBeGreaterThan(0);
        });

        it('should have methods in chats namespace', () => {
            const chatMethods = clientRegistry.getByNamespace('chats');
            expect(chatMethods.length).toBeGreaterThan(0);
        });
    });

    describe('critical methods exist', () => {
        const criticalMethods = [
            'sendText',
            'sendImage', 
            'sendFile',
            'getChat',
            'getAllChats',
            'getContact',
            'getAllContacts',
            'getMe',
            'getConnectionState',
        ];

        criticalMethods.forEach((name) => {
            it(`should have ${name} registered`, () => {
                expect(clientRegistry.has(name)).toBe(true);
            });
        });
    });
});
