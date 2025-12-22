import { z } from 'zod';
import { defineMethodV2 } from './registry';
import { implementMethod } from './implementor';

describe('implementor.ts', () => {
    const testSchema = defineMethodV2('testFunc', {
        meta: {
            description: 'A test function',
        },
        input: z.object({
            id: z.string(),
            count: z.number(),
        }),
        parameterOrder: ['id', 'count'],
        output: z.string(),
    });

    it('should correctly normalize positional arguments', async () => {
        interface TestParams { id: string; count: number; }
        let receivedParams: TestParams | null = null;
        const mockClient = {
            testFunc: implementMethod(testSchema, async function (params: TestParams) {
                receivedParams = params;
                return 'ok';
            })
        };

        await mockClient.testFunc('user-1', 42);
        expect(receivedParams).toEqual({ id: 'user-1', count: 42 } as TestParams);
    });

    it('should correctly normalize named object arguments', async () => {
        let receivedParams: any = null;
        const mockClient = {
            testFunc: implementMethod(testSchema, async function (params) {
                receivedParams = params;
                return 'ok';
            })
        };

        await mockClient.testFunc({ id: 'user-2', count: 100 });
        expect(receivedParams).toEqual({ id: 'user-2', count: 100 });
    });

    it('should throw ZodError for invalid positional inputs', async () => {
        const mockClient = {
            testFunc: implementMethod(testSchema, async () => 'ok')
        };

        // Wrong type for count
        await expect(mockClient.testFunc('user-1', 'not-a-number' as any))
            .rejects.toThrow();
    });

    it('should throw ZodError for invalid named inputs', async () => {
        const mockClient = {
            testFunc: implementMethod(testSchema, async () => 'ok')
        };

        // Missing required field 'count'
        await expect(mockClient.testFunc({ id: 'user-3' } as any))
            .rejects.toThrow();
    });

    it('should preserve this context', async () => {
        class Client {
            name = 'test-client';
            testFunc = implementMethod(testSchema, async function (this: Client, params) {
                return `${this.name}-${params.id}`;
            });
        }

        const client = new Client();
        const result = await client.testFunc('xyz', 1);
        expect(result).toBe('test-client-xyz');
    });

    it('should bridge to pup by default', async () => {
        const mockClient = {
            pup: jest.fn().mockResolvedValue('pup-result'),
            testFunc: implementMethod(testSchema)
        };

        const result = await mockClient.testFunc('user-4', 10);
        expect(result).toBe('pup-result');
        expect(mockClient.pup).toHaveBeenCalled();
    });
});
