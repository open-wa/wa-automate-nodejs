import type * as PageTree from 'fumadocs-core/page-tree';

type TreeNode = PageTree.Node | PageTree.Root;

function childrenOf(node: TreeNode): PageTree.Node[] {
  if ('children' in node) return node.children;
  return [];
}

/** Page URLs in sidebar order, including folder index pages. */
export function pageUrlsInOrder(node: TreeNode): string[] {
  const urls: string[] = [];
  const visit = (current: TreeNode) => {
    if (current.type === 'page') {
      if (!current.external) urls.push(current.url);
      return;
    }
    if (current.type === 'folder' && current.index) urls.push(current.index.url);
    for (const child of childrenOf(current)) visit(child);
  };
  visit(node);
  return urls;
}

/** Where a folder should link: its index page, or else its first page. */
export function folderUrl(folder: PageTree.Folder): string | undefined {
  return folder.index?.url ?? pageUrlsInOrder(folder)[0];
}

/**
 * The first page under a URL prefix such as `/docs/guides`. Section URLs with
 * no index page redirect here, so they keep working as sections are reorganised.
 */
export function firstPageUnder(tree: PageTree.Root, sectionUrl: string): string | undefined {
  const prefix = `${sectionUrl.replace(/\/+$/, '')}/`;
  return pageUrlsInOrder(tree).find((url) => url.startsWith(prefix));
}

/** `folder` is the folder's path under content/docs, such as `build`. */
export type Crumb = { name: string; url?: string; folder?: string };

function nodeName(name: unknown): string {
  return typeof name === 'string' ? name : '';
}

/** Folders on the way to a page, outermost first, each linked to where it starts. */
export function folderCrumbs(tree: PageTree.Root, pageUrl: string): Crumb[] {
  const path: PageTree.Folder[] = [];
  const search = (nodes: PageTree.Node[]): boolean => {
    for (const node of nodes) {
      if (node.type === 'page' && node.url === pageUrl) return true;
      if (node.type === 'folder') {
        path.push(node);
        if (node.index?.url === pageUrl || search(node.children)) return true;
        path.pop();
      }
    }
    return false;
  };
  if (!search(tree.children)) return [];

  return path
    .filter((folder) => folder.index?.url !== pageUrl)
    .map((folder) => ({ name: nodeName(folder.name), url: folderUrl(folder), folder: folder.$ref?.folder }))
    .filter((crumb) => crumb.name.length > 0);
}
