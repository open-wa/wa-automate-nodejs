import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/react-start';
import { ChangelogLayout, ReleaseCard } from '@/components/changelog';
import { getAbsoluteDocsUrl, getDocsSocialMeta, getPageImage } from '@/lib/og';

const loadChangelog = createServerFn({ method: 'GET' }).handler(async () => {
  const { getChangelog } = await import('@/lib/changelog.server');
  return getChangelog();
});

export const Route = createFileRoute('/changelog/')({
  loader: () => loadChangelog(),
  head: ({ loaderData }) => ({
    meta: getDocsSocialMeta({
      title: 'Changelog — OpenWA',
      description: 'New features, useful improvements, and what they mean for your WhatsApp integrations.',
      imageUrl: getAbsoluteDocsUrl(loaderData?.[0]?.image || getPageImage([]).url),
    }),
    links: [{ rel: 'canonical', href: getAbsoluteDocsUrl('/changelog') }],
  }),
  component: Changelog,
});

function Changelog() {
  const entries = Route.useLoaderData();
  return <ChangelogLayout>
    <header className="changelog-intro">
      <h1>What’s new in open-wa</h1>
      <p>Explore each release, try its examples, and find the changes to consider before you upgrade.</p>
    </header>
    <div className="release-feed">{entries.map((entry, index) => <ReleaseCard key={entry.version} entry={entry} latest={index === 0} />)}</div>
    <footer className="changelog-footer">Looking for an older version? <a href="https://github.com/open-wa/wa-automate-nodejs/releases">Browse the release archive ↗</a></footer>
  </ChangelogLayout>;
}
