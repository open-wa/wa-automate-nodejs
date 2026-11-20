import * as React from 'react';
import { DynamicCodeBlock } from 'fumadocs-ui/components/dynamic-codeblock';

/**
 * A type's full TypeScript declaration on the Return types page. The field
 * table above it already lists the same fields, so the highlighted code only
 * renders once the reader opens it instead of doubling the page's HTML.
 */
export function TypeDeclaration({ name, code }: { name: string; code: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <details className="my-4 rounded-xl border border-fd-border px-4 py-2 not-prose" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary className="cursor-pointer text-sm font-medium">
        TypeScript declaration of <code>{name}</code>
      </summary>
      {open ? <div className="mt-2"><DynamicCodeBlock lang="ts" code={code} /></div> : null}
    </details>
  );
}
