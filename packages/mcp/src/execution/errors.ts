/**
 * MCP execution error types.
 *
 * Maintains the separation between protocol-level errors
 * (JSON-RPC envelope issues) and tool-level errors
 * (open-wa runtime invocation failures).
 */

/**
 * A tool execution error from the open-wa runtime.
 * This should be surfaced as `isError: true` in MCP tool results,
 * NOT as a JSON-RPC protocol error.
 */
export class ToolExecutionError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.name = 'ToolExecutionError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * A validation error from Zod schema parsing.
 * This should be surfaced as `isError: true` in MCP tool results
 * with the validation details attached.
 */
export class ToolValidationError extends ToolExecutionError {
  constructor(message: string, details?: unknown) {
    super(message, 400, details);
    this.name = 'ToolValidationError';
  }
}

/**
 * Thrown when the client/session is not ready for execution.
 */
export class SessionNotReadyError extends ToolExecutionError {
  constructor(message = 'Session is not connected or ready for execution') {
    super(message, 503);
    this.name = 'SessionNotReadyError';
  }
}

/**
 * Thrown when authentication is missing or invalid.
 */
export class AuthenticationError extends ToolExecutionError {
  constructor(message = 'Authentication required. Provide a valid API key.') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}
