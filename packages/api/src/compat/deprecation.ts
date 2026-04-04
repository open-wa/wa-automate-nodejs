export interface DeprecationNotice {
  route: string;
  message: string;
  replacement?: string;
}

export function applyDeprecationHeaders(c: any, notice: DeprecationNotice) {
  const parts = [notice.message];

  if (notice.replacement) {
    parts.push(`Use ${notice.replacement} instead.`);
  }

  c.header('X-OpenWA-Deprecated', notice.route);
  c.header('Warning', `299 open-wa "${parts.join(' ')}"`);
}

export function deprecatedJson(
  c: any,
  notice: DeprecationNotice,
  status = 200,
  extra: Record<string, unknown> = {}
) {
  applyDeprecationHeaders(c, notice);
  return c.json(
    {
      deprecated: true,
      route: notice.route,
      message: notice.message,
      replacement: notice.replacement,
      ...extra,
    },
    status as any
  );
}
