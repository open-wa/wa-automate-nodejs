import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { api, command, repo, source, release, state, checkpoint, request, summary, version, runUrl } from './shared.mjs';

const v = version();
const notes = readFileSync(join(source, 'RELEASE_BODY.md'), 'utf8');
const entry = release(v);
let current = state(v);
api(`repos/${repo}/releases/${entry.id}`, { body: notes }, 'PATCH');
if (!current.packages?.length) {
  summary(`[open-wa ${v} release notes updated](${entry.html_url}).`);
  process.exit(0);
}
current = checkpoint(v, { notesCompletedAt: new Date().toISOString(), notesRun: runUrl });

// One standard announcement per release. Reruns edit its saved message ID.
if (!current.skipDiscord && current.availabilityCompletedAt) {
  if (!process.env.DISCORD_WEBHOOK_URL) throw new Error('DISCORD_WEBHOOK_URL is missing from the Release environment. Packages and release notes are already published.');
  const url = new URL(process.env.DISCORD_WEBHOOK_URL);
  if (current.discord?.messageId) url.pathname += `/messages/${current.discord.messageId}`;
  url.searchParams.set('wait', 'true');
  const bullets = notes.split('\n').filter(line => line.startsWith('- '));
  const selected = [];
  for (const bullet of bullets) {
    if (selected.length === 5 || [...selected, bullet].join('\n').length > 3000) break;
    selected.push(bullet);
  }
  const message = await (await request(url, {
    method: current.discord?.messageId ? 'PATCH' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: 'open-wa', allowed_mentions: { parse: [] },
      embeds: [{
        title: `open-wa ${v}`, url: entry.html_url, color: 0x2d6bff,
        description: `${selected.join('\n')}\n\n[Read all release notes](${entry.html_url})`,
      }],
    }),
  })).json();
  if (!message.id) throw new Error('Discord did not confirm the release announcement.');
  current = checkpoint(v, { discord: { messageId: message.id, channelId: message.channel_id, completedAt: new Date().toISOString() } });
}

if (current.issue && current.availabilityCompletedAt) {
  const marker = `<!-- openwa-release-complete:${v} -->`;
  const body = `${marker}\n[open-wa ${v} is available](${entry.html_url}). Package availability and the documentation deployment are confirmed; the release notes link the commits and related issues.`;
  const comments = JSON.parse(command('gh', ['api', `repos/${repo}/issues/${current.issue}/comments?per_page=100`, '--paginate', '--slurp'])).flat();
  const previous = comments.find(comment => comment.body.includes(marker));
  if (previous) api(`repos/${repo}/issues/comments/${previous.id}`, { body }, 'PATCH');
  else api(`repos/${repo}/issues/${current.issue}/comments`, { body });
}
if (current.availabilityCompletedAt) checkpoint(v, { completedAt: new Date().toISOString() });
summary(`## open-wa ${v} release notes published\n\n[Release notes](${entry.html_url}). ${current.skipDiscord ? 'Discord announcement skipped as requested.' : current.discord?.messageId ? 'Discord announcement saved; reruns update the same message.' : 'No automatic announcement was requested.'}`);
