/**
 * Monomorphic radix tree node for MQTT-style wildcard routing.
 */
export class RadixNode<T> {
  segment: string;
  listeners: T[];
  children: Map<string, RadixNode<T>> | null;
  wildcardSingle: RadixNode<T> | null; // '+'
  wildcardMulti: RadixNode<T> | null; // '#'

  constructor(segment: string) {
    // Preserve property order for hidden-class stability.
    this.segment = segment;
    this.listeners = [];
    this.children = null;
    this.wildcardSingle = null;
    this.wildcardMulti = null;
  }
}
