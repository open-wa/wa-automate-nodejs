// Password gate for the concepts gallery. Every request needs HTTP Basic auth
// with the shared password (any username), and nothing is ever indexed: every
// response carries X-Robots-Tag and robots.txt disallows everything. The
// password is deliberately shared and memorable; it keeps strangers and crawlers
// out, not determined attackers.
const NOINDEX = "noindex, nofollow, noarchive, nosnippet, noimageindex";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nDisallow: /\n", {
        headers: { "content-type": "text/plain; charset=utf-8", "x-robots-tag": NOINDEX },
      });
    }
    if (!authorised(request, env.CONCEPTS_PASSWORD || "concepts")) {
      return new Response("This gallery is password protected.\n", {
        status: 401,
        headers: {
          "www-authenticate": 'Basic realm="Concepts", charset="UTF-8"',
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store",
          "x-robots-tag": NOINDEX,
        },
      });
    }
    const asset = await env.ASSETS.fetch(request);
    // Static assets ignore Range and always answer 200, and iPhone Safari won't play an
    // MP4 without a 206, so slice media ourselves.
    const range = request.headers.get("range");
    if (range && asset.status === 200 && /^(video|audio)\//.test(asset.headers.get("content-type") || "")) {
      return partial(asset, range);
    }
    const response = new Response(asset.body, asset);
    response.headers.set("x-robots-tag", NOINDEX);
    // Authenticated content must never sit in a shared cache.
    response.headers.set("cache-control", "private, max-age=0, must-revalidate");
    return response;
  },
};

async function partial(asset, range) {
  const bytes = await asset.arrayBuffer();
  const size = bytes.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  let start = match && match[1] ? Number(match[1]) : NaN;
  let end = match && match[2] ? Number(match[2]) : size - 1;
  if (match && !match[1] && match[2]) (start = Math.max(0, size - Number(match[2]))), (end = size - 1);
  end = Math.min(end, size - 1);
  const headers = new Headers(asset.headers);
  headers.set("x-robots-tag", NOINDEX);
  headers.set("cache-control", "private, max-age=0, must-revalidate");
  headers.set("accept-ranges", "bytes");
  if (!match || Number.isNaN(start) || start > end || start >= size) {
    headers.set("content-range", `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }
  headers.set("content-range", `bytes ${start}-${end}/${size}`);
  headers.set("content-length", String(end - start + 1));
  return new Response(bytes.slice(start, end + 1), { status: 206, headers });
}

function authorised(request, password) {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Basic ")) return false;
  let decoded;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return false;
  }
  return equal(decoded.slice(decoded.indexOf(":") + 1), password);
}

// Constant-time comparison so the response time doesn't leak the password.
function equal(a, b) {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}
