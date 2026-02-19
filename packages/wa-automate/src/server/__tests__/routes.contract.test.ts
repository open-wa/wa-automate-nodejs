// import { Hono } from 'hono';
import { clientRegistry } from '@open-wa/schema';
import '@open-wa/schema/methods';

describe('server route registration', () => {
    it('should register routes for all methods', () => {
        const methods = clientRegistry.getAll();
        
        methods.forEach((def) => {
            const { meta } = def;
            
            expect(meta.functionName).toBeTruthy();
            expect(typeof meta.functionName).toBe('string');
        });
    });

    it('should have valid HTTP methods', () => {
        const methods = clientRegistry.getAll();
        const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'AUTO', undefined];
        
        methods.forEach((def) => {
            expect(validMethods).toContain(def.meta.httpMethod);
        });
    });

    it('should have valid actions', () => {
        const methods = clientRegistry.getAll();
        const validActions = ['read', 'send', 'update', 'delete', undefined];
        
        methods.forEach((def) => {
            expect(validActions).toContain(def.meta.action);
        });
    });
});

describe('representative method validation', () => {
    const testCases = [
        {
            name: 'sendText',
            expectedInputKeys: ['to', 'content'],
            expectedNamespace: 'messages',
        },
        {
            name: 'getChat',
            expectedInputKeys: ['chatId'],
            expectedNamespace: 'chats',
        },
        {
            name: 'getContact',
            expectedInputKeys: ['contactId'],
            expectedNamespace: 'contacts',
        },
    ];

    testCases.forEach(({ name, expectedInputKeys, expectedNamespace }) => {
        describe(name, () => {
            const method = clientRegistry.get(name);
            
            it('should be registered', () => {
                expect(method).toBeDefined();
            });

            it('should have expected input keys', () => {
                const inputShape = Object.keys(method?.meta.inputSchema?.shape || {});
                expectedInputKeys.forEach(key => {
                    expect(inputShape).toContain(key);
                });
            });

            it('should have expected namespace', () => {
                expect(method?.meta.namespace).toBe(expectedNamespace);
            });

            it('should have parameter order matching input keys', () => {
                const order = method?.meta.parameterOrder || [];
                expectedInputKeys.forEach(key => {
                    expect(order).toContain(key);
                });
            });
        });
    });
});
