import { source } from '@/lib/source';
import { getEditorialSource } from '@/lib/editorial.server';
import { publicEditorialImageUrl } from '@/lib/editorial-markdown';

function legacyReleases() {
  return source.getPages().flatMap(page => {
    const release = page.data.release;
    if (!release) return [];
    return [{...release,description:page.data.description ?? '',path:page.path,url:`/changelog/${release.version}`,sourceUrl:page.url,releaseUrl:`https://github.com/open-wa/wa-automate-nodejs/releases/tag/v${release.version}`}];
  });
}
export type ChangelogEntry = ReturnType<typeof legacyReleases>[number] & {bodyMarkdown?: string};
export async function getChangelog(): Promise<ChangelogEntry[]> {
  const cms = await getEditorialSource('changelog');
  const entries = new Map<string, ChangelogEntry>();
  for (const page of cms.getPages()) {
    const entry = page.data;
    if (!entry.version || !entry.publishedAt) continue;
    entries.set(entry.version, {
      version:entry.version,date:entry.publishedAt,headline:entry.title,description:entry.description,
      audience:entry.audience ?? undefined,image:publicEditorialImageUrl(entry.image),highlights:entry.highlights,
      path:page.path,url:`/changelog/${encodeURIComponent(entry.version)}`,sourceUrl:page.url,bodyMarkdown:entry.bodyMarkdown,
      releaseUrl:`https://github.com/open-wa/wa-automate-nodejs/releases/tag/v${encodeURIComponent(entry.version)}`,
    });
  }
  return [...entries.values()].sort((a,b) => b.date.localeCompare(a.date));
}
