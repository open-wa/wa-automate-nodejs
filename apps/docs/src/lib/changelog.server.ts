import { source } from '@/lib/source';

export function getChangelog() {
  return source.getPages().flatMap(page => {
    const release = page.data.release;
    if (!release) return [];
    return [{
      ...release,
      description: page.data.description ?? '',
      path: page.path,
      url: `/changelog/${release.version}`,
      sourceUrl: page.url,
      releaseUrl: `https://github.com/open-wa/wa-automate-nodejs/releases/tag/v${release.version}`,
    }];
  }).sort((a, b) => b.date.localeCompare(a.date));
}

export type ChangelogEntry = ReturnType<typeof getChangelog>[number];
