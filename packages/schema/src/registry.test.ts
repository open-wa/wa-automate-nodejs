import { defineMethod, Registry, z } from './registry';

describe('Schema Registry', () => {
    it('should register and retrieve a method', () => {
        defineMethod('testMethod', {
            meta: { description: 'A test method' },
            input: z.object({ foo: z.string() }),
            output: z.object({ bar: z.number() }),
        });

        const retrieved = Registry.getMethod('testMethod');
        expect(retrieved).toBeDefined();
        expect(retrieved?.name).toBe('testMethod');
        expect(retrieved?.metadata.description).toBe('A test method');
    });

    it('should validate input using registered schema', () => {
        const TestMethod = defineMethod('validationTest', {
            meta: { description: 'Validation test' },
            input: z.object({ email: z.string().email() }),
            output: z.void(),
        });

        const valid = TestMethod.inputSchema.safeParse({ email: 'test@example.com' });
        expect(valid.success).toBe(true);

        const invalid = TestMethod.inputSchema.safeParse({ email: 'not-an-email' });
        expect(invalid.success).toBe(false);
    });
});
