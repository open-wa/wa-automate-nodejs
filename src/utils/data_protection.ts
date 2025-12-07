import traverse from "traverse";

const truncateLength = 200,
  sensitiveKeys = [
    /cookie/i,
    /sessionData/i,
    /passw(or)?d/i,
    /^pw$/,
    /^pass$/i,
    /^ACCESS_KEY$/i,
    /^ADMIN_KEY$/i,
    /^SUPER_ADMIN_KEY$/i,
    /^WA_SESSION_DATA_BUCKET_AUTH$/i,
    /^AUTH$/i,
    /secret/i,
    /ACCESS_KEY_ID/i,
    /token/i,
    /api[-._]?key/i
  ];

export function isSensitiveKey(keyStr: string): boolean | undefined {
  if (keyStr) {
    return sensitiveKeys.some((regex) => regex.test(keyStr));
  }
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function redactObject(obj: any): any {
  if (typeof obj === "string") return;
  traverse(obj).forEach(function redactor(this: any) {
    if (isSensitiveKey(this.key)) {
      this.update(
        typeof this.node === "string" ? truncateMiddle(this.node) : "[REDACTED]"
      );
    } else if (
      typeof this.node === "string" &&
      this.node.length > truncateLength
    ) {
      this.update(truncate(this.node, truncateLength));
    }
  });
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.substr(0, n - 1) + "...[TRUNCATED]..." : str;
}

// remove the middle half of the string
export function truncateMiddle(str: string): string {
  const len = str.length;
  const n = len / 2;
  if (len <= n) return str;
  const half = Math.floor(n / 2);
  const start = Math.floor(len / 2) - half;
  const end = start + n;
  return str.substring(0, start) + "..." + str.substring(end);
}
