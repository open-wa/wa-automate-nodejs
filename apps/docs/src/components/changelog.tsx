// The changelog pages were removed; release notes live on GitHub. The blog
// still uses this date formatter and the shared `release-*` reading styles.
import '@/styles/changelog.css';

export function ReleaseDate({ date }: { date: string }) {
  return <time dateTime={date}>{new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(date))}</time>;
}
