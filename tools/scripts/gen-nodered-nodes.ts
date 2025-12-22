#!/usr/bin/env node

/**
 * Node-RED Node Generator for open-wa v5
 * 
 * Generates Node-RED compatible nodes from the schema registry,
 * enabling visual workflow creation for WhatsApp automation.
 */

import { promises as fs } from 'node:fs/promises';
import path from 'node:path';
import type { registry } from '@open-wa/schema';

interface NodeRedNode {
    category: string;
    color: string;
    defaults: Record<string, any>;
    inputs: Array<{
        name: string;
        type: string;
        description: string;
        required?: boolean;
        default?: any;
    }>;
    outputs: Array<{
        name: string;
        type: string;
        description: string;
    }>;
}

interface NodeRedHtmlFile {
    name: string;
    category: string;
    info: string;
    icon: string;
    inputs?: Array<{
        name: string;
        type: string;
        description: string;
        required?: boolean;
        default?: any;
    }>;
    outputs?: Array<{
        name: string;
        type: string;
        description: string;
    }>;
}

interface NodeRedJsFile {
    name: string;
    category: string;
    icon: string;
    inputs: string[];
    outputs: string[];
}

function generateNode(methodName: string, definition: any): NodeRedNode {
    const inputSchema = definition.inputSchema;
    const outputSchema = definition.outputSchema;

    const inputs = inputSchema ? Object.entries(inputSchema._def.shape)
        .filter(([key]) => key !== 'shape' && key !== 'type')
        .map(([key, schema]) => ({
            name: key,
            type: getInputType(schema),
            description: key.replace(/([A-Z])/g, ' $1').toLowerCase(),
            required: inputSchema._def.shape[key]._def.type === 'ZodOptional' ? false : true,
            default: inputSchema._def.shape[key]._def.defaultValue
        })) : [];

    const outputs = outputSchema ? Object.entries(outputSchema._def.shape)
        .filter(([key]) => key !== 'shape' && key !== 'type')
        .map(([key, schema]) => ({
            name: key,
            type: getOutputType(schema),
            description: key.replace(/([A-Z])/g, ' $1').toLowerCase()
        })) : [];

    return {
        category: 'open-wa',
        color: '#00ff00',
        defaults: {
            sessionId: {
                value: '',
                type: 'string',
                description: 'WhatsApp session ID to use'
            },
            apiHost: {
                value: 'http://localhost:8080',
                type: 'string',
                description: 'open-wa server URL'
            }
        },
        inputs,
        outputs
    };
}

function getInputType(schema: any): string {
    switch (typeof schema) {
        case 'string': return 'string';
        case 'number': return 'number';
        case 'boolean': return 'boolean';
        case 'array': return 'array';
        default: return 'any';
    }
}

function getOutputType(schema: any): string {
    switch (typeof schema) {
        case 'string': return 'string';
        case 'number': return 'number';
        case 'boolean': return 'boolean';
        case 'array': return 'array';
        default: return 'any';
    }
}

function getOutputType(schema: any): string {
    if (schema._def.type === 'ZodString') return 'string';
    if (schema._def.type === 'ZodNumber') return 'number';
    if (schema._def.type === 'ZodBoolean') return 'boolean';
    if (schema._def.type === 'ZodArray') return 'array';
    if (schema._def.type === 'ZodOptional') return getOutputType(schema._def.innerType);
    return 'any';
}

function generateHtmlFile(definition: any): NodeRedHtmlFile {
    return {
        name: definition.name,
        category: 'open-wa',
        info: `WhatsApp ${definition.name} operation`,
        icon: `data:image/svg+xml;base64,${Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="40" height="40" viewBox="0 0 24 24">
  <path fill="#00ff00" d="M4 4h1v1H3c1L9 3l-3.9-1.414 0-3.74 1.31-1.69-1.819 1.09-.312 1.414L17 16h-4.656V12a2 2z"/>
</svg>`).toString('base64')}`
    };
}

function generateJsFile(definition: any): NodeRedJsFile {
    const htmlFile = generateHtmlFile(definition);
    const inputs = htmlFile.inputs ? htmlFile.inputs.map(inp => `'${inp.name}'`).join(',') : '';
    const outputs = htmlFile.outputs ? htmlFile.outputs.map(out => `'${out.name}'`).join(',') : '';

    return {
        name: htmlFile.name,
        category: 'open-wa',
        icon: 'whatsapp.svg',
        inputs,
        outputs
    };
}

async function main() {
    console.log('🎨 Generating Node-RED nodes from open-wa v5 schema...');
    
    const outputDir = path.join(process.cwd(), 'node-red-nodes');
    const htmlDir = path.join(outputDir, 'html');
    const jsDir = path.join(outputDir, 'js');
    
    // Ensure output directories exist
    await fs.promises.mkdir(htmlDir, { recursive: true });
    await fs.promises.mkdir(jsDir, { recursive: true });
    
    const htmlFiles: string[] = [];
    const jsFiles: string[] = [];
    
    // Generate nodes for each method in registry
    for (const [methodName, definition] of Object.entries(registry)) {
        if (typeof definition !== 'object' || !definition) continue;
        
        // Skip some internal methods
        if (methodName.startsWith('_') || methodName.startsWith('on') || methodName === 'constructor') {
            continue;
        }
        
        // Generate HTML file
        const htmlFile = generateHtmlFile({ name: methodName, ...definition });
        if (htmlFile.inputs) {
            htmlFile.inputs = Object.entries(definition.inputSchema?.shape || {})
                .filter(([key]) => key !== 'shape' && key !== 'type')
                .map(([key, schema]) => ({
                    name: key,
                    type: getInputType(schema),
                    description: key.replace(/([A-Z])/g, ' $1').toLowerCase(),
                    required: definition.inputSchema?.shape[key]?._def.type === 'ZodOptional' ? false : true,
                    default: definition.inputSchema?.shape[key]?._def.defaultValue
                }));
        }
        if (htmlFile.outputs) {
            htmlFile.outputs = Object.entries(definition.outputSchema?.shape || {})
                .filter(([key]) => key !== 'shape' && key !== 'type')
                .map(([key, schema]) => ({
                    name: key,
                    type: getOutputType(schema),
                    description: key.replace(/([A-Z])/g, ' $1').toLowerCase()
                }));
        }
        const htmlContent = generateHtmlContent(htmlFile);
        const htmlPath = path.join(htmlDir, `${methodName.toLowerCase()}.html`);
        await fs.promises.writeFile(htmlPath, htmlContent);
        htmlFiles.push(htmlPath);
        
        // Generate JavaScript file
        const jsFile = generateJsFile({ name: methodName, ...definition });
        const jsContent = generateJsContent(jsFile);
        const jsPath = path.join(jsDir, `${methodName.toLowerCase()}.js`);
        await fs.promises.writeFile(jsPath, jsContent);
        jsFiles.push(jsPath);
        
        console.log(`✅ Generated: ${methodName}`);
    }
    
    // Generate package.json for Node-RED nodes
    const packageJson = {
        name: 'node-red-contrib-open-wa-v5',
        version: '1.0.0',
        description: 'Node-RED nodes for open-wa v5 automation',
        keywords: ['node-red', 'open-wa', 'whatsapp', 'automation'],
        repository: 'https://github.com/open-wa/wa-automate-nodejs',
        license: 'MIT',
        dependencies: {
            'node-red': '^3.0.0'
        },
        nodeRed: {
            nodes: htmlFiles.map(f => path.relative(outputDir, f)).concat(jsFiles.map(f => path.relative(outputDir, f)))
        }
    };
    
    await fs.promises.writeFile(
        path.join(outputDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    );
    
    console.log(`📦 Generated ${htmlFiles.length + jsFiles.length} files in ${outputDir}`);
    console.log('🎯 Node-RED nodes ready for import!');
}

function generateHtmlContent(file: NodeRedHtmlFile): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>${file.name} - open-wa</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="icon" href="${file.icon}" type="image/svg+xml">
</head>
<body>
    <div class="node-info">
        <h1>${file.name}</h1>
        <h2>${file.info}</h2>
    </div>
    <script type="text/javascript">
        RED.nodes.registerType('open-wa', {
            color: '${file.color}',
            category: '${file.category}',
            defaults: ${JSON.stringify(file.defaults, null, 2)}
        });
    </script>
</body>
</html>
    `;
}

function generateJsContent(file: NodeRedJsFile): string {
    return `
/**
 * Node-RED node: ${file.name}
 * WhatsApp automation via open-wa v5
 */

RED.nodes.registerType('open-wa', {
    color: '${file.color}',
    category: '${file.category}',
    defaults: ${JSON.stringify(file.defaults, null, 2)},
    inputs: ${JSON.stringify(file.inputs)},
    outputs: ${JSON.stringify(file.outputs)},
    icon: '${file.icon}',
    label: function() {
        return this.name || '${file.name}';
    }
});

RED.nodes.registerType('${file.name}', {
    color: '${file.color}',
    category: '${file.category}',
    defaults: ${JSON.stringify(file.defaults, null, 2)},
    inputs: ${JSON.stringify(file.inputs)},
    outputs: ${JSON.stringify(file.outputs)},
    icon: '${file.icon}',
    label: function() {
        return this.name || '${file.name}';
    }
});
`;
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Generation failed:', error);
        process.exit(1);
    });
}