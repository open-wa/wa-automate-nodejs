import assert from 'node:assert/strict';
import {
  getAbsoluteDocsUrl,
  getDocsSocialMeta,
  getOgDescription,
  getPageImage,
  getSlugsFromImagePath,
} from '../src/lib/og';

const pageImage = getPageImage(['getting-started', 'quickstart']);
assert.deepEqual(pageImage.segments, ['getting-started', 'quickstart', 'image.webp']);
assert.equal(pageImage.url, '/og/docs/getting-started/quickstart/image.webp');

assert.equal(
  getOgDescription({
    title: 'Quickstart',
    description: 'Visible description',
    summary: 'Summary',
    ogDescription: 'Social description',
  }),
  'Social description',
);
assert.equal(
  getOgDescription({ title: 'Quickstart', description: 'Visible description', summary: 'Summary' }),
  'Summary',
);

assert.equal(
  getAbsoluteDocsUrl('/og/docs/getting-started/quickstart/image.webp'),
  'https://docs.openwa.dev/og/docs/getting-started/quickstart/image.webp',
);

const meta = getDocsSocialMeta({
  title: 'Quickstart',
  description: 'Start here',
  imageUrl: 'https://docs.openwa.dev/og/docs/getting-started/quickstart/image.webp',
});
assert.deepEqual(meta.find((item) => 'property' in item && item.property === 'og:image'), {
  property: 'og:image',
  content: 'https://docs.openwa.dev/og/docs/getting-started/quickstart/image.webp',
});
assert.deepEqual(meta.find((item) => 'name' in item && item.name === 'twitter:card'), {
  name: 'twitter:card',
  content: 'summary_large_image',
});

assert.deepEqual(getSlugsFromImagePath('getting-started/quickstart/image.webp'), [
  'getting-started',
  'quickstart',
]);
assert.deepEqual(getSlugsFromImagePath('getting-started/quickstart/not-image.png'), []);

console.log('og helper tests passed');
