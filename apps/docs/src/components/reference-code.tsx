import * as React from 'react';

function flattenText(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return flattenText(node.props.children);
  return '';
}

/**
 * A code block on a generated reference page. The server renders the code as
 * plain text in a `<pre>`, and the highlighted block with its copy button (the
 * MDX children) replaces it once it nears the viewport. A highlighted block
 * costs about 2.5 KB of HTML, and Messages has close to a hundred of them.
 */
export function ReferenceCode({ children }: { children: React.ReactNode }) {
  const [highlighted, setHighlighted] = React.useState(false);
  const placeholder = React.useRef<HTMLPreElement>(null);

  React.useEffect(() => {
    const element = placeholder.current;
    if (!element) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setHighlighted(true);
        observer.disconnect();
      }
    }, { rootMargin: '800px 0px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (highlighted) return <>{children}</>;
  return (
    <pre ref={placeholder} className="not-prose my-4 overflow-auto rounded-xl border bg-fd-card px-4 py-3.5 text-[0.8125rem] leading-relaxed shadow-sm">
      <code>{flattenText(children).replace(/\n$/, '')}</code>
    </pre>
  );
}
