import { loader, type LoaderPlugin } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { docs } from 'fumadocs-mdx:collections/server';

/**
 * Label a page in the sidebar (and every other page-tree view) with its
 * `sidebarTitle`, so a long task title can stay the H1, `<title>` and OG title.
 */
function sidebarTitlePlugin(): LoaderPlugin {
  return {
    name: 'openwa:sidebar-title',
    transformPageTree: {
      file(node, filePath) {
        if (!filePath) return node;
        const file = this.storage.read(filePath);
        if (file?.format === 'page' && 'sidebarTitle' in file.data && typeof file.data.sidebarTitle === 'string') {
          node.name = file.data.sidebarTitle;
        }
        return node;
      },
    },
  };
}

export const source = loader({
    source: docs.toFumadocsSource(),
    baseUrl: '/docs',
    plugins: [sidebarTitlePlugin(), lucideIconsPlugin()],
});
