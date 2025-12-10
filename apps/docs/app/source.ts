import { docs } from '@/.source';
import { loader } from 'fumadocs-core/source';

export const { getPage, getPages, pageTree } = loader({
    baseUrl: '/docs',
    source: docs.toSource(),
});
