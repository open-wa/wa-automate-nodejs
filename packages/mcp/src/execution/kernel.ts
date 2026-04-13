import type { HttpMethodDefinition } from '@open-wa/schema';
import { normalizeMethodPayload } from './args';
import { invokeClientMethod } from './invoke';

/**
 * Context required to execute an Open-WA capability via any transport.
 */
export interface ExecutionContext {
  /**
   * The active client instance or proxy.
   */
  client: Record<string, (...args: any[]) => Promise<any> | any> | undefined;
  /**
   * The metadata definition for the method being invoked.
   */
  definition: HttpMethodDefinition;
  /**
   * The raw input payload (merged query + body, or MCP arguments).
   */
  payload: Record<string, unknown>;
  /**
   * Optional diagnostic emitter for logging.
   */
  elasticEmitter?: {
    log: (data: any) => void;
  };
  /**
   * The unique session identifier.
   */
  sessionId: string;
}

/**
 * Standardized result of a capability execution.
 */
export interface ExecutionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any;
  status: number;
}

/**
 * The shared execution kernel for Open-WA capabilities.
 * Ensures strict parity between HTTP API and MCP transport by centralizing
 * normalization, validation, and invocation logic.
 */
export async function executeCapability(
  ctx: ExecutionContext
): Promise<ExecutionResult> {
  const { client, definition, payload, elasticEmitter, sessionId } = ctx;
  const startTime = Date.now();
  const methodName = definition.functionName;

  try {
    // 1. Normalize aliases and legacy keys
    const normalizedPayload = normalizeMethodPayload(definition, payload);

    // 2. Validate against Zod schema (strict)
    const validated = await definition.inputSchema.parseAsync(normalizedPayload);

    // 3. Invoke the client method with positional argument resolution
    const result = await invokeClientMethod(client, definition, validated);

    // 4. Log successful execution to monitoring if available
    elasticEmitter?.log({
      level: 'info',
      component: 'api',
      method: methodName,
      sessionId,
      duration: Date.now() - startTime,
      statusCode: 200,
      message: `Successfully executed ${methodName}`,
    });

    return {
      success: true,
      data: result,
      status: 200,
    };
  } catch (error: any) {
    const isValidationError = error?.name === 'ZodError';
    const status = isValidationError ? 400 : 500;

    // Log failure to monitoring
    elasticEmitter?.log({
      level: 'error',
      component: 'api',
      method: methodName,
      sessionId,
      duration: Date.now() - startTime,
      statusCode: status,
      message: error?.message || 'Internal Server Error',
    });

    return {
      success: false,
      error: isValidationError ? 'Validation Error' : (error?.message || 'Internal Server Error'),
      details: isValidationError ? error.issues : undefined,
      status,
    };
  }
}
