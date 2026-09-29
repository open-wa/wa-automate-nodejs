import type { ReactNode } from 'react';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { baseOptions } from '@/lib/layout.shared';
import type { ChangelogEntry } from '@/lib/changelog.server';
import '@/styles/changelog.css';

export function ChangelogLayout({ children }: { children: ReactNode }) {
  const options = baseOptions();
  const links = options.links?.filter(item => !(item as { hideOnHomepage?: boolean }).hideOnHomepage);
  return <HomeLayout {...options} links={links}><main className="changelog">{children}</main></HomeLayout>;
}

export function ReleaseDate({ date }: { date: string }) {
  return <time dateTime={date}>{new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(date))}</time>;
}

export function ReleaseCard({ entry, latest }: { entry: ChangelogEntry; latest: boolean }) {
  return <article className="release-row">
    <aside className="release-meta">
      <span className="release-version">v{entry.version}</span>
      <ReleaseDate date={entry.date} />
      {latest && <span className="release-tag">Latest release</span>}
    </aside>
    <div className="release-card">
      {entry.audience && <p className="release-audience">{entry.audience}</p>}
      <h2><a href={entry.url}>{entry.headline}</a></h2>
      <p className="release-description">{entry.description}</p>
      {entry.image && <a href={entry.url} tabIndex={-1} aria-hidden="true">
        <img className="release-cover" src={entry.image} alt="" width="1440" height="900" loading={latest ? 'eager' : 'lazy'} />
      </a>}
      <ul className="release-highlights">{entry.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}</ul>
      <a className="release-read" href={entry.url}>Explore this release <ArrowRight size={18} aria-hidden="true" /></a>
    </div>
  </article>;
}

export function ReleaseArticle({ entry, children }: { entry: ChangelogEntry; children: ReactNode }) {
  return <>
    <a className="release-back" href="/changelog"><ArrowLeft size={16} aria-hidden="true" /> All releases</a>
    <article className="release-article">
      <header className="release-article-header">
        <div className="release-article-meta"><span className="release-version">v{entry.version}</span><ReleaseDate date={entry.date} /></div>
        <h1>{entry.headline}</h1>
        <p className="release-description">{entry.description}</p>
        {entry.audience && <p className="release-audience">{entry.audience}</p>}
        {entry.image && <img className="release-cover" src={entry.image} alt={`OpenWA ${entry.version}: ${entry.headline}`} width="1440" height="900" />}
      </header>
      {children}
      <footer className="release-article-footer">
        <a className="release-read" href="/changelog"><ArrowLeft size={16} aria-hidden="true" /> All releases</a>
        <a href={entry.releaseUrl}>Full release on GitHub ↗</a>
      </footer>
    </article>
  </>;
}
