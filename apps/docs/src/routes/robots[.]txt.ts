import { createFileRoute } from '@tanstack/react-router';
import { SITE_ORIGIN } from '@/lib/site';

// Search and answer engines may crawl everything; crawlers that collect
// training data may not. The Content-Signal line states the same policy.
const SEARCH_CRAWLERS = ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot', 'Googlebot'];
const TRAINING_CRAWLERS = ['GPTBot', 'ClaudeBot', 'Google-Extended', 'CCBot', 'Applebot-Extended'];

const content = [
  ...SEARCH_CRAWLERS.map((agent) => `User-agent: ${agent}\nAllow: /`),
  ...TRAINING_CRAWLERS.map((agent) => `User-agent: ${agent}\nDisallow: /`),
  'User-agent: *\nAllow: /\nContent-Signal: ai-train=no, search=yes, ai-input=yes',
  `Sitemap: ${SITE_ORIGIN}/sitemap.xml`,
].join('\n\n');

export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET() {
        return new Response(`${content}\n`, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
          },
        });
      },
    },
  },
});
