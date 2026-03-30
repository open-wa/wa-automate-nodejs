import { RadixNode } from './RadixNode.js';

/**
 * Radix tree with MQTT-style wildcards.
 * Complexity: O(K) where K = number of path segments.
 */
export class RadixTree<T> {
  private readonly delimiter: string;
  private readonly root: RadixNode<T>;

  constructor(delimiter = '.') {
    this.delimiter = delimiter;
    this.root = new RadixNode<T>('');
  }

  insert(pattern: string, value: T) {
    const segments = this.tokenize(pattern);
    let node = this.root;

    for (const segment of segments) {
      if (segment === '+') {
        if (!node.wildcardSingle) node.wildcardSingle = new RadixNode<T>('+');
        node = node.wildcardSingle;
        continue;
      }
      if (segment === '#') {
        if (!node.wildcardMulti) node.wildcardMulti = new RadixNode<T>('#');
        node = node.wildcardMulti;
        break; // '#' consumes the rest
      }
      if (!node.children) node.children = new Map();
      let child = node.children.get(segment);
      if (!child) {
        child = new RadixNode<T>(segment);
        node.children.set(segment, child);
      }
      node = child;
    }

    node.listeners.push(value);
  }

  remove(pattern: string, value: T) {
    const path: Array<[RadixNode<T>, string]> = [];
    let node = this.root;
    const segments = this.tokenize(pattern);

    for (const segment of segments) {
      path.push([node, segment]);
      if (segment === '+') {
        if (!node.wildcardSingle) return;
        node = node.wildcardSingle;
      } else if (segment === '#') {
        if (!node.wildcardMulti) return;
        node = node.wildcardMulti;
        break;
      } else {
        if (!node.children) return;
        const next = node.children.get(segment);
        if (!next) return;
        node = next;
      }
    }

    const idx = node.listeners.indexOf(value);
    if (idx !== -1) {
      node.listeners.splice(idx, 1);
    }
  }

  match(event: string): T[] {
    const segments = this.tokenize(event);
    const stack: Array<{ node: RadixNode<T>; index: number }> = [
      { node: this.root, index: 0 }
    ];
    const results: T[] = [];

    while (stack.length > 0) {
      const { node, index } = stack.pop()!;

      if (index === segments.length) {
        // Exact depth match
        if (node.listeners.length) results.push(...node.listeners);
        // '#' can also match empty suffix
        if (node.wildcardMulti && node.wildcardMulti.listeners.length) {
          results.push(...node.wildcardMulti.listeners);
        }
        continue;
      }

      const seg = segments[index];

      // Exact child
      if (node.children) {
        const child = node.children.get(seg);
        if (child) {
          stack.push({ node: child, index: index + 1 });
        }
      }

      // Single-level wildcard '+'
      if (node.wildcardSingle) {
        stack.push({ node: node.wildcardSingle, index: index + 1 });
      }

      // Multi-level wildcard '#'
      if (node.wildcardMulti) {
        // '#' consumes the rest, so we can collect listeners directly
        if (node.wildcardMulti.listeners.length) {
          results.push(...node.wildcardMulti.listeners);
        }
        // But it can also match additional segments
        stack.push({ node: node.wildcardMulti, index: index + 1 });
      }
    }

    return results;
  }

  private tokenize(path: string): string[] {
    // Simple tokenizer; allocations are acceptable for initial implementation.
    return path.split(this.delimiter);
  }
}
