export function assertSessionPath(
  expectedSessionId: string,
  requestedSessionId: string | undefined,
  useSessionIdInPath: boolean
): { ok: true } | { ok: false; status: number; error: string } {
  if (!useSessionIdInPath) {
    return { ok: true };
  }

  if (!requestedSessionId) {
    return { ok: false, status: 404, error: 'Session id missing from request path' };
  }

  if (requestedSessionId !== expectedSessionId) {
    return { ok: false, status: 404, error: `Unknown session path: ${requestedSessionId}` };
  }

  return { ok: true };
}
