const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const zoneName = process.env.CLOUDFLARE_ZONE || 'openwa.dev';
const targetName = process.env.DNS_AID_TARGET || 'docs.openwa.dev';
const apply = process.argv.includes('--apply');

if (!apiToken) {
  throw new Error(
    'CLOUDFLARE_API_TOKEN is required. Use a token with DNS, DNSSEC, and Zone Settings edit access.',
  );
}

if (!apply) {
  throw new Error(
    'Refusing to change Cloudflare without --apply. Run the package script after reviewing dns-aid.zone.',
  );
}

async function cloudflare(path, init = {}) {
  const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  const body = await response.json();

  if (!response.ok || !body.success) {
    const detail =
      body.errors
        ?.map((error) => `${error.code}: ${error.message}`)
        .join(', ') || response.statusText;
    throw new Error(
      `Cloudflare ${init.method || 'GET'} ${path} failed: ${detail}`,
    );
  }

  return body.result;
}

async function upsertDnsRecord(zoneId, record) {
  const existing = await cloudflare(
    `/zones/${zoneId}/dns_records?type=${record.type}&name=${encodeURIComponent(record.name)}`,
  );
  const current = existing[0];
  const path = current
    ? `/zones/${zoneId}/dns_records/${current.id}`
    : `/zones/${zoneId}/dns_records`;

  return cloudflare(path, {
    method: current ? 'PUT' : 'POST',
    body: JSON.stringify(record),
  });
}

const zones = await cloudflare(`/zones?name=${encodeURIComponent(zoneName)}`);
const zone = zones.find((candidate) => candidate.name === zoneName);
if (!zone) throw new Error(`Cloudflare zone not found: ${zoneName}`);

const content = `1 ${targetName}. mandatory=alpn,port alpn="mcp,h2" port=443`;
const recordNames = [
  `_index._agents.${zoneName}`,
  `_index._agents.${targetName}`,
];

const records = [];
for (const name of recordNames) {
  const result = await upsertDnsRecord(zone.id, {
    type: 'SVCB',
    name,
    content,
    ttl: 3600,
    proxied: false,
    comment: 'DNS-AID MCP discovery for open-wa documentation',
  });
  records.push({
    id: result.id,
    name: result.name,
    type: result.type,
    content: result.content,
  });
}

let markdownForAgents;
try {
  markdownForAgents = await cloudflare(
    `/zones/${zone.id}/settings/content_converter`,
    {
      method: 'PATCH',
      body: JSON.stringify({ value: 'on' }),
    },
  );
} catch (error) {
  markdownForAgents = {
    status: 'application-fallback-required',
    detail: error instanceof Error ? error.message : String(error),
  };
}

let dnssec = await cloudflare(`/zones/${zone.id}/dnssec`);
if (dnssec.status !== 'active') {
  dnssec = await cloudflare(`/zones/${zone.id}/dnssec`, { method: 'POST' });
}

console.log(
  JSON.stringify(
    {
      zone: { id: zone.id, name: zone.name },
      records,
      markdownForAgents,
      dnssec: {
        status: dnssec.status,
        digest: dnssec.digest,
        digestAlgorithm: dnssec.digest_algorithm,
        digestType: dnssec.digest_type,
        ds: dnssec.ds,
        keyTag: dnssec.key_tag,
      },
      registrarAction:
        dnssec.status === 'active'
          ? 'Confirm the returned DS record is published at the registrar, then verify dig +dnssec DS openwa.dev.'
          : 'Publish the returned DS record at the registrar to complete the chain of trust.',
    },
    null,
    2,
  ),
);
