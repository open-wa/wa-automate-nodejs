import { OpenApiGeneratorV3, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import fs from 'fs';
import path from 'path';
import { Registry } from '../src/registry';
import '../src/methods'; // Ensure methods are registered

const generatedDir = path.join(__dirname, '../src/generated');
if (!fs.existsSync(generatedDir)) {
    fs.mkdirSync(generatedDir, { recursive: true });
}

const registry = new OpenAPIRegistry();

// Register all methods as API paths
const methods = Registry.getAllMethods();

methods.forEach((method) => {
    registry.registerPath({
        method: 'post',
        path: `/${method.name}`,
        description: method.metadata.description,
        request: {
            body: {
                content: {
                    'application/json': {
                        schema: method.inputSchema as any,
                    },
                },
            },
        },
        responses: {
            200: {
                description: 'Successful response',
                content: {
                    'application/json': {
                        schema: method.outputSchema as any,
                    },
                },
            },
        },
    });
});

const generator = new OpenApiGeneratorV3(registry.definitions);

const document = generator.generateDocument({
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

fs.writeFileSync(
    path.join(generatedDir, 'openapi.json'),
    JSON.stringify(document, null, 2)
);

console.log('Successfully generated openapi.json');
