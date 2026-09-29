import { source } from '@/lib/source';
import type { InferPageType } from 'fumadocs-core/source';
import methods from '@/generated/client-methods.json';

export async function getLLMText(page: InferPageType<typeof source>) {
  // The interactive reference is rendered from records, so processed MDX alone
  // would omit its contracts and examples from Copy Markdown and the LLM feed.
  if (page.url === '/docs/reference/client/client') {
    return [
      `# ${page.data.title} (${page.url})`,
      'Connect a SocketClient to the Easy API, or create an in-process Client before using these methods.',
      ...methods.map((method) => [
        `## ${method.name}`, method.description,
        `Canonical reference: ${page.url}#${method.anchor}`,
        method.license ? `License: ${method.license}` : '',
        '### Parameters',
        ...method.parameters.map((parameter) => `- \`${parameter.name}${parameter.required ? '' : '?'}: ${parameter.type}\`: ${parameter.description}`),
        `### Returns\n\n\`Promise<${method.returnType}>\`\n\n${method.returnNotes}`,
        Object.entries(method.returnTypeLinks).map(([name, url]) => `[${name}](${url})`).join(', '),
        method.sdkReturnType ? `In-process Client: \`Promise<${method.sdkReturnType}>\`.` : 'Not declared on the in-process Client facade.',
        `### Node.js client\n\n\`\`\`ts\n${method.examples.nodeClient}\n\`\`\``,
        `### HTTP\n\n\`\`\`bash\n${method.examples.http}\n\`\`\``,
        method.aliases.length ? `Aliases: ${method.aliases.join(', ')}` : '',
      ].filter(Boolean).join('\n\n')),
    ].join('\n\n');
  }
  const processed = await page.data.getText('processed');
  return `# ${page.data.title} (${page.url})\n\n${processed}`;
}
