import { useRef, useState, type ComponentProps } from 'react';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Button } from '@/components/ui/button';
import { recordGrowthEvent } from '@/lib/growth-metrics';

type PreProps = ComponentProps<typeof defaultMdxComponents.pre>;

export function QuickstartPre(props: PreProps) {
  return props.title === 'Create your project' ? (
    <QuickstartCommand {...props} />
  ) : (
    <DefaultPre {...props} />
  );
}

const DefaultPre = defaultMdxComponents.pre;

function QuickstartCommand({ children, ...props }: PreProps) {
  const codeRef = useRef<HTMLPreElement>(null);
  const [copyStatus, setCopyStatus] = useState('');

  async function copyCommand() {
    const command = codeRef.current?.textContent;
    if (!command) return;
    try {
      await navigator.clipboard.writeText(command);
      recordGrowthEvent({ event: 'setup_command_copy', source: 'quickstart', setup: 'undecided' });
      setCopyStatus('Copied');
    } catch {
      setCopyStatus('Select the command to copy it.');
    }
  }

  return (
    <CodeBlock {...props} allowCopy={false} Actions={({ className }) => (
      <Button type="button" size="sm" variant="ghost" className={className} onClick={() => void copyCommand()}>
        <span aria-live="polite">{copyStatus || 'Copy command'}</span>
      </Button>
    )}>
      <Pre ref={codeRef}>{children}</Pre>
    </CodeBlock>
  );
}
