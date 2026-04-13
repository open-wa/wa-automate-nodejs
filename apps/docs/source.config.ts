import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import {
    remarkAutoTypeTable,
    createGenerator,
    createFileSystemGeneratorCache,
} from 'fumadocs-typescript';

const generator = createGenerator({
    cache: createFileSystemGeneratorCache('.fumadocs-typescript'),
});

export const docs = defineDocs({
    dir: 'content/docs',
});

// export default defineConfig({
//     mdxOptions: {
//         remarkPlugins: (defaults) => [
//             ...defaults,
//             // [remarkAutoTypeTable, { generator }],
//         ],
//     },
// });
