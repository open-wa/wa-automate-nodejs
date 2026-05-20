import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { visit } from 'unist-util-visit';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const methodsMapPath = path.resolve(currentDir, '../content/docs/reference/client/methods-map.json');

let methodsMap: Record<string, string> = {};
try {
    if (fs.existsSync(methodsMapPath)) {
        methodsMap = JSON.parse(fs.readFileSync(methodsMapPath, 'utf8'));
    }
} catch (e) {
    console.error('Failed to load methods-map.json', e);
}

const STATIC_MAPPINGS: Record<string, string> = {
    'Client': '/docs/reference/client/client',
    'ConfigObject': '/docs/guides/config-schema',
    'Message': '/docs/reference/client/messages',
    'SimpleListener': '/docs/reference/client/client',
    'GroupMetadata': '/docs/reference/client/groups',
    'onAck': '/docs/reference/client/messages#onack',
    'onMessage': '/docs/reference/client/messages#onmessage',
    'onAnyMessage': '/docs/reference/client/messages#onanymessage',
};

function resolveLink(entity: string): string | null {
    if (STATIC_MAPPINGS[entity]) {
        return STATIC_MAPPINGS[entity];
    }
    if (entity.startsWith('ConfigObject.')) {
        const field = entity.split('.')[1];
        return `/docs/guides/config-schema#${field.toLowerCase()}`;
    }
    if (methodsMap[entity]) {
        return methodsMap[entity];
    }
    const foundKey = Object.keys(methodsMap).find(k => k.toLowerCase() === entity.toLowerCase());
    if (foundKey) {
        return methodsMap[foundKey];
    }
    return null;
}

function remarkBracketLinks() {
    return (tree: any) => {
        // 1. Traverse parent nodes to handle the 3-node sequence of backticked double-brackets: [[`Entity`]]
        visit(tree, (node: any) => {
            if (node.children && Array.isArray(node.children)) {
                const children = node.children;
                for (let i = 0; i < children.length - 2; i++) {
                    const node1 = children[i];
                    const node2 = children[i + 1];
                    const node3 = children[i + 2];
                    
                    if (
                        node1.type === 'text' && node1.value.endsWith('[[') &&
                        node2.type === 'inlineCode' &&
                        node3.type === 'text' && node3.value.startsWith(']]')
                    ) {
                        node1.value = node1.value.slice(0, -2);
                        node3.value = node3.value.slice(2);
                        
                        const entity = node2.value;
                        const url = resolveLink(entity);
                        
                        if (url) {
                            children[i + 1] = {
                                type: 'link',
                                url,
                                title: null,
                                children: [node2]
                            };
                        }
                    }
                }
            }
        });

        // 2. Traverse text nodes to handle standard double brackets: [[Entity]] and single brackets [Entity]
        visit(tree, 'text', (node: any, index: any, parent: any) => {
            if (!parent || index === undefined) return;
            const text = node.value;
            
            // First check double brackets: [[Entity]]
            const doubleRegex = /\[\[([a-zA-Z0-9_\.]+)\]\]/g;
            if (doubleRegex.test(text)) {
                doubleRegex.lastIndex = 0;
                const newNodes = [];
                let lastIndex = 0;
                let match;
                
                while ((match = doubleRegex.exec(text)) !== null) {
                    const matchIndex = match.index;
                    const entity = match[1];
                    
                    if (matchIndex > lastIndex) {
                        newNodes.push({
                            type: 'text',
                            value: text.slice(lastIndex, matchIndex)
                        });
                    }
                    
                    const url = resolveLink(entity);
                    if (url) {
                        newNodes.push({
                            type: 'link',
                            url,
                            title: null,
                            children: [
                                {
                                    type: 'inlineCode',
                                    value: entity
                                }
                            ]
                        });
                    } else {
                        newNodes.push({
                            type: 'inlineCode',
                            value: entity
                        });
                    }
                    
                    lastIndex = doubleRegex.lastIndex;
                }
                
                if (lastIndex < text.length) {
                    newNodes.push({
                        type: 'text',
                        value: text.slice(lastIndex)
                    });
                }
                
                parent.children.splice(index, 1, ...newNodes);
                return index + newNodes.length;
            }
            
            // Then check single brackets: [Entity] (ONLY if they resolve)
            const singleRegex = /\[([a-zA-Z0-9_\.]+)\]/g;
            if (singleRegex.test(text)) {
                singleRegex.lastIndex = 0;
                const newNodes = [];
                let lastIndex = 0;
                let match;
                let hasResolved = false;
                
                while ((match = singleRegex.exec(text)) !== null) {
                    const matchIndex = match.index;
                    const entity = match[1];
                    const url = resolveLink(entity);
                    
                    if (url) {
                        hasResolved = true;
                        if (matchIndex > lastIndex) {
                            newNodes.push({
                                type: 'text',
                                value: text.slice(lastIndex, matchIndex)
                            });
                        }
                        
                        newNodes.push({
                            type: 'link',
                            url,
                            title: null,
                            children: [
                                {
                                    type: 'text',
                                    value: entity
                                }
                            ]
                        });
                        
                        lastIndex = singleRegex.lastIndex;
                    }
                }
                
                if (hasResolved) {
                    if (lastIndex < text.length) {
                        newNodes.push({
                            type: 'text',
                            value: text.slice(lastIndex)
                        });
                    }
                    parent.children.splice(index, 1, ...newNodes);
                    return index + newNodes.length;
                }
            }
        });

        // 3. Traverse linkReference nodes to resolve standard bracket shortcuts: [Shortcut]
        visit(tree, 'linkReference', (node: any) => {
            const label = node.label || node.identifier;
            if (label) {
                const url = resolveLink(label);
                if (url) {
                    node.type = 'link';
                    node.url = url;
                    node.title = null;
                }
            }
        });
    };
}

const processor = unified().use(remarkParse).use(remarkBracketLinks).use(remarkStringify);

const testCases = [
    {
        input: 'Represents [[onAck]] and [[ConfigObject.sessionId]].',
        expected: [
            '(/docs/reference/client/messages#onack)',
            '(/docs/guides/config-schema#sessionid)',
            '`onAck`',
            '`ConfigObject.sessionId`'
        ]
    },
    {
        input: 'Please check [[`Message`]] for detail.',
        expected: [
            '(/docs/reference/client/messages)',
            '`Message`'
        ]
    },
    {
        input: 'See [Client] documentation.',
        expected: [
            '(/docs/reference/client/client)',
            'Client'
        ]
    },
    {
        input: 'An [[UnresolvedEntity]] defaults to code.',
        expected: [
            '`UnresolvedEntity`'
        ]
    }
];

let failed = false;

for (const [idx, tc] of testCases.entries()) {
    const output = processor.processSync(tc.input).toString();
    console.log(`Test Case ${idx + 1} Input:`, tc.input);
    console.log(`Test Case ${idx + 1} Output:`, output);
    
    const missing = tc.expected.filter(str => !output.includes(str));
    if (missing.length > 0) {
        console.error(`❌ Test Case ${idx + 1} FAILED! Missing substrings:`, missing);
        failed = true;
    } else {
        console.log(`✅ Test Case ${idx + 1} PASSED`);
    }
    console.log('---');
}

if (failed) {
    console.error('Remark plugin tests failed!');
    process.exit(1);
} else {
    console.log('All Remark plugin tests passed successfully!');
}
