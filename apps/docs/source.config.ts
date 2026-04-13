import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import {
    remarkAutoTypeTable,
    createGenerator,
    createFileSystemGeneratorCache,
} from 'fumadocs-typescript';

const generator = createGenerator({
    cache: createFileSystemGeneratorCache('.fumadocs-typescript'),
    tsconfigPath: './tsconfig.json',
});

export const docs = defineDocs({
    dir: 'content/docs',
    docs: {
        postprocess: {
            includeProcessedMarkdown: true,
        },
    },
});

export default defineConfig({
    mdxOptions: {
        remarkPlugins: (defaults) => [
            ...defaults,
            [remarkAutoTypeTable, { 
                name: 'AutoTypeTable',
                generator,
            }],
        ],
    },
});
