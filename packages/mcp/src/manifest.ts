import { getHttpMethodDefinitions, type HttpMethodDefinition } from '@open-wa/schema/http-manifest';
import { getCanonicalToolName } from './tool-naming';

/**
 * MCP-specific projection of a method capability.
 */
export interface McpToolDefinition {
  /**
   * The canonical namespaced tool name for MCP.
   * @example 'messages.sendText'
   */
  toolName: string;
  /**
   * The raw function name in the client.
   * @example 'sendText'
   */
  functionName: string;
  /**
   * The namespaced name (method part only).
   * @example 'sendText'
   */
  namespacedName: string;
  /**
   * The namespace this method belongs to.
   * @example 'messages'
   */
  namespace: string;
  /**
   * Human-readable description of the tool.
   */
  description: string;
  /**
   * Zod input schema.
   */
  inputSchema: HttpMethodDefinition['inputSchema'];
  /**
   * Zod output schema.
   */
  outputSchema: HttpMethodDefinition['outputSchema'];
  /**
   * Preserved parameter order for positional resolution.
   */
  parameterOrder: string[];
  /**
   * Known aliases for this method.
   */
  aliases: string[];
  /**
   * Deprecated aliases for this method.
   */
  deprecatedAliases: string[];
  /**
   * Map of payload key aliases to canonical keys.
   */
  keyAliasMap: Record<string, string>;
  /**
   * Optional metadata hints for AI clients.
   */
  annotations?: {
    title?: string;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
  };
}

/**
 * Projects the schema registry into a list of canonical MCP tool definitions.
 */
export function getMcpToolDefinitions(basePath = '/api'): McpToolDefinition[] {
  return getHttpMethodDefinitions(basePath).map((def) => {
    return {
      toolName: getCanonicalToolName(def.namespace, def.namespacedName),
      functionName: def.functionName,
      namespacedName: def.namespacedName,
      namespace: def.namespace,
      description: def.description,
      inputSchema: def.inputSchema,
      outputSchema: def.outputSchema,
      parameterOrder: def.parameterOrder,
      aliases: def.aliases,
      deprecatedAliases: def.deprecatedAliases,
      keyAliasMap: def.keyAliasMap,
      annotations: {
        title: def.functionName,
        // Hints can be derived from method names or hardcoded metadata in future
        readOnlyHint: def.functionName.startsWith('get') || def.functionName.startsWith('is'),
      },
    };
  });
}
