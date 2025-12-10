import { defineDocs, defineConfig } from 'fumadocs-mdx/config';

export const docs = defineDocs({
    dir: 'content/docs',
});

export default defineConfig({
    openapi: {
        input: './public/openapi.json',
        output: './content/openapi',
    },
});
