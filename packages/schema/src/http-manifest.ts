import { clientRegistry, MethodDefinition } from './registry';

export interface HttpMethodDefinition {
  functionName: string;
  path: string;
  namespace: string;
  description: string;
  inputSchema: MethodDefinition['meta']['inputSchema'];
  outputSchema: MethodDefinition['meta']['outputSchema'];
  parameterOrder: string[];
}

export function getHttpMethodDefinitions(basePath = '/api'): HttpMethodDefinition[] {
  return clientRegistry.getAll().map((def) => ({
    functionName: def.meta.functionName,
    path: `${basePath}/${def.meta.functionName}`,
    namespace: def.meta.namespace || 'core',
    description: def.meta.description || def.meta.functionName,
    inputSchema: def.meta.inputSchema,
    outputSchema: def.meta.outputSchema,
    parameterOrder: def.meta.parameterOrder,
  }));
}
