export interface ClientMethodDefinitionLike {
  functionName: string;
  parameterOrder: string[];
  wapiOverride?: string;
}

/**
 * Invokes a client method by resolving its implementation from the client instance
 * and mapping the payload to positional arguments if necessary.
 */
export async function invokeClientMethod(
  client: Record<string, (...args: any[]) => Promise<any> | any> | undefined,
  def: ClientMethodDefinitionLike,
  payload: unknown
): Promise<any> {
  if (!client) {
    throw new Error('Client not initialized');
  }

  const method = client[def.functionName] ?? (def.wapiOverride ? client[def.wapiOverride] : undefined);

  if (typeof method !== 'function') {
    throw new Error(`Method ${def.functionName} not implemented on Client`);
  }

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return await method.call(client);
  }

  const resolvedArgs = def.parameterOrder.map((key) => (payload as Record<string, unknown>)[key]);
  return await method.call(client, ...resolvedArgs);
}
