import { createServerFn } from '@tanstack/react-start';
import { notFound } from '@tanstack/react-router';
import { source } from '@/lib/source';

export const docsLoader = createServerFn({
  method: 'GET',
})
  .inputValidator((slugs: string[]) => slugs)
  .handler(async ({ data: slugs }) => {
    try {
      const page = source.getPage(slugs);
      if (!page) throw notFound();

      return {
        path: page.path,
        pageTree: await source.serializePageTree(source.pageTree),
      };
    } catch (err: any) {
      console.error("Docs serverFn Error for slugs", slugs, ":", err);
      throw err;
    }
  });
