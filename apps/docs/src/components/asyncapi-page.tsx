import { createAsyncAPIPage, type AsyncAPIPageProps_Preloaded } from '@fumadocs/asyncapi/ui';
import type { AsyncAPI } from '@fumadocs/asyncapi';
import { createShikiFactory } from 'fumadocs-core/highlight/shiki';
import { createHighlighter } from 'shiki/bundle/web';
import document from '@/generated/asyncapi.json';

const Page = createAsyncAPIPage({
  shiki: createShikiFactory({ init: () => createHighlighter({ themes: ['github-light', 'github-dark'], langs: ['json', 'yaml', 'bash', 'http'] }) }),
});

/** Browser-safe renderer: bundled data is produced by the generation script. */
export function AsyncAPIPage(props: Omit<AsyncAPIPageProps_Preloaded, 'preloaded'>) {
  return <Page {...props} preloaded={{ docs: { openwa: document as AsyncAPI.AsyncAPIObject } }} />;
}
