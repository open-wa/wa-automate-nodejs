/**
 * Logic for stable, namespaced MCP tool names.
 */

/**
 * Returns the canonical namespaced tool name for MCP.
 * @example getCanonicalToolName('messages', 'sendText') -> 'messages.sendText'
 */
export function getCanonicalToolName(namespace: string, methodName: string): string {
  return `${namespace}.${methodName}`;
}
