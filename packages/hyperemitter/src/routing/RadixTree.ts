import { RadixNode } from './RadixNode';

/** Segment trie; multi-segment wildcard states are deduplicated during matching. */
export class RadixTree<T> {
  private readonly root = new RadixNode<T>('');
  private readonly single: string;
  private readonly multi: string;
  constructor(private readonly delimiter = '.', private readonly style: 'mqtt' | 'eventemitter' = 'mqtt') {
    this.single = style === 'mqtt' ? '+' : '*';
    this.multi = style === 'mqtt' ? '#' : '**';
  }

  insert(pattern: string, value: T, prepend = false) {
    let node = this.root;
    for (const segment of pattern.split(this.delimiter)) {
      if (segment === this.single) {
        node = node.wildcardSingle ??= new RadixNode<T>(this.single);
      } else if (segment === this.multi) {
        node = node.wildcardMulti ??= new RadixNode<T>(this.multi);
        if (this.style === 'mqtt') break;
      } else {
        node.children ??= new Map();
        let child = node.children.get(segment);
        if (!child) node.children.set(segment, child = new RadixNode<T>(segment));
        node = child;
      }
    }
    if (prepend) node.listeners.unshift(value);
    else node.listeners.push(value);
  }

  remove(pattern: string, value: T) {
    let node = this.root;
    const path: Array<[RadixNode<T>, RadixNode<T>, string]> = [];
    for (const segment of pattern.split(this.delimiter)) {
      const child = segment === this.single ? node.wildcardSingle
        : segment === this.multi ? node.wildcardMulti : node.children?.get(segment);
      if (!child) return;
      path.push([node, child, segment]);
      node = child;
      if (segment === this.multi && this.style === 'mqtt') break;
    }
    const index = node.listeners.indexOf(value);
    if (index >= 0) node.listeners.splice(index, 1);
    for (const [parent, child, segment] of path.reverse()) {
      if (child.listeners.length || child.children?.size || child.wildcardSingle || child.wildcardMulti) break;
      if (segment === this.single) parent.wildcardSingle = null;
      else if (segment === this.multi) parent.wildcardMulti = null;
      else parent.children?.delete(segment);
    }
  }

  match(event: string): T[] {
    const segments = event.split(this.delimiter);
    if (this.style === 'mqtt') {
      const stack: Array<[RadixNode<T>, number]> = [[this.root, 0]];
      const results: T[] = [];
      while (stack.length) {
        const [node, index] = stack.pop()!;
        if (node.wildcardMulti) results.push(...node.wildcardMulti.listeners);
        if (index === segments.length) { results.push(...node.listeners); continue; }
        if (node.wildcardSingle) stack.push([node.wildcardSingle, index + 1]);
        const child = node.children?.get(segments[index]);
        if (child) stack.push([child, index + 1]);
      }
      return results;
    }
    const stack: Array<[RadixNode<T>, number]> = [[this.root, 0]];
    const visited = new Map<RadixNode<T>, Set<number>>();
    const collected = new Set<RadixNode<T>>();
    const results: T[] = [];
    while (stack.length) {
      const [node, index] = stack.pop()!;
      let indices = visited.get(node);
      if (indices?.has(index)) continue;
      if (!indices) visited.set(node, indices = new Set());
      indices.add(index);
      if ((index === segments.length || node.segment === this.multi) && !collected.has(node)) {
        results.push(...node.listeners);
        collected.add(node);
      }
      if (node.wildcardMulti) stack.push([node.wildcardMulti, index]);
      if (index < segments.length) {
        if (node.segment === this.multi) stack.push([node, index + 1]);
        if (node.wildcardSingle) stack.push([node.wildcardSingle, index + 1]);
        const child = node.children?.get(segments[index]);
        if (child) stack.push([child, index + 1]);
      }
    }
    return results;
  }
}
