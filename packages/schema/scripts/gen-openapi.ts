import { OpenApiGeneratorV3, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import fs from 'fs';
import path from 'path';
import { clientRegistry } from '../src/registry';
import '../src/methods';

const generatedDir = path.join(__dirname, '../src/generated');
if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
}

const registry = new OpenAPIRegistry();

const methods = clientRegistry.getAll();

methods.forEach((def) => {
    try {
        console.log(`Registering ${def.meta.functionName}...`);
        registry.registerPath({
            method: 'post',
            path: `/${def.meta.functionName}`,
            description: def.meta.description,
            request: {
                body: {
                    content: {
                        'application/json': {
                            schema: def.meta.inputSchema as any,
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: 'Successful response',
                    content: {
                        'application/json': {
                            schema: def.meta.outputSchema as any,
                        },
                    },
                },
            },
        });
    } catch (error) {
        console.error(`\n❌ Failed to register path for ${def.meta.functionName}`);
        console.error(`   Input schema type: ${(def.meta.inputSchema as any)?._def?.typeName}`);
        console.error(`   Output schema type: ${(def.meta.outputSchema as any)?._def?.typeName}`);
        throw error;
    }
});

const generator = new OpenApiGeneratorV3(registry.definitions);

let document;
try {
    document = generator.generateDocument({
        openapi: '3.0.0',
        info: {
            title: 'Open WA API',
            version: '5.0.0',
            description: 'API definition for Open WA v5',
        },
        servers: [
            {
                url: 'http://localhost:3000',
            },
        ],
    });
} catch (error) {
    console.error('\n❌ Failed during document generation');
    console.error('This usually means one of the schemas has an unsupported type for OpenAPI');
    throw error;
}

fs.writeFileSync(
    path.join(generatedDir, 'openapi.json'),
    JSON.stringify(document, null, 2)
);

console.log('Successfully generated openapi.json');
