import { createGenerator } from 'fumadocs-typescript';
import path from 'node:path';

const generator = createGenerator({
    tsconfigPath: './tsconfig.json'
});

async function test() {
    const filePath = '/Users/Mohammed/projects/tools/wa/packages/schema/src/common-types.ts';
    console.log('Testing path:', filePath);
    try {
        const result = await generator.generateTypeTable({ path: filePath, name: 'Contact' });
        console.log('Result:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('Error generating type table:', err);
    }
}

test();
