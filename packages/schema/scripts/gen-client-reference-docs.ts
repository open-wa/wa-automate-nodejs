import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { getHttpMethodDefinitions, type HttpMethodDefinition } from '../src/http-manifest';
import { clientRegistry, getParameterMetadata, type MethodDefinition, type ParameterMetadata } from '../src/registry';

import '../src/methods';

type JsonSchema = {
  type?: string | string[];
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];
  enum?: Array<string | number | boolean | null>;
  const?: string | number | boolean | null;
  format?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  additionalProperties?: boolean | JsonSchema;
};

type ParameterRow = {
  name: string;
  type: string;
  required: boolean;
  description: string;
  aliases: string[];
  deprecatedAliases: string[];
  example: string;
};

const generatorPath = 'packages/schema/scripts/gen-client-reference-docs.ts';
const docsDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../apps/docs/content/docs/reference/client');

function sortStrings(values: string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function schemaToJsonSchema(schema: z.ZodTypeAny): JsonSchema {
  const serializableSchema = schema as z.ZodTypeAny & {
    toJSONSchema?: (params?: { target?: string }) => unknown;
  };

  if (typeof serializableSchema.toJSONSchema !== 'function') {
    return {};
  }

  return serializableSchema.toJSONSchema({ target: 'openapi-3.0' }) as JsonSchema;
}

function getInputShape(def: MethodDefinition): Record<string, z.ZodTypeAny> {
  return def.meta.inputSchema.shape as Record<string, z.ZodTypeAny>;
}

function stringifyExample(value: ParameterMetadata['example'] | undefined): string {
  if (value === undefined) {
    return '-';
  }

  return `\`${escapeMarkdownInline(JSON.stringify(value))}\``;
}

function escapeMarkdownInline(value: string): string {
  return value.replace(/`/g, '\\`').replace(/\|/g, '\\|');
}

function escapeTableCell(value: string): string {
  return escapeMarkdownInline(value.replace(/\n/g, ' '));
}

function formatList(values: string[]): string {
  return values.length > 0 ? values.map((value) => `\`${escapeMarkdownInline(value)}\``).join(', ') : '-';
}

function titleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

function summarizeSchema(schema: JsonSchema): string {
  if (schema.const !== undefined) {
    return JSON.stringify(schema.const);
  }

  if (schema.enum && schema.enum.length > 0) {
    return schema.enum.map((value) => JSON.stringify(value)).join(' | ');
  }

  const compound = schema.anyOf ?? schema.oneOf;
  if (compound && compound.length > 0) {
    return uniqueStrings(compound.map(summarizeSchema)).join(' | ');
  }

  if (schema.allOf && schema.allOf.length > 0) {
    return uniqueStrings(schema.allOf.map(summarizeSchema)).join(' & ');
  }

  if (Array.isArray(schema.type)) {
    return schema.type.join(' | ');
  }

  if (schema.type === 'array') {
    return `${schema.items ? summarizeSchema(schema.items) : 'unknown'}[]`;
  }

  if (schema.type === 'object') {
    const propertyNames = schema.properties ? Object.keys(schema.properties) : [];
    if (propertyNames.length === 0) {
      return 'object';
    }

    return `object { ${sortStrings(propertyNames).join(', ')} }`;
  }

  return schema.type ?? 'unknown';
}

function buildParameterRows(def: MethodDefinition): ParameterRow[] {
  const inputSchema = schemaToJsonSchema(def.meta.inputSchema);
  const properties = inputSchema.properties ?? {};
  const required = new Set(inputSchema.required ?? []);
  const inputShape = getInputShape(def);
  const orderedNames = uniqueStrings([
    ...def.meta.parameterOrder,
    ...sortStrings(Object.keys(properties).filter((name) => !def.meta.parameterOrder.includes(name))),
  ]);

  return orderedNames.map((name) => {
    const property = properties[name] ?? {};
    const metadata = inputShape[name] ? getParameterMetadata(inputShape[name]) : undefined;
    const descriptionParts = uniqueStrings([
      property.description,
      metadata?.formatDescription,
      metadata?.brandedType ? `Branded type: ${metadata.brandedType}` : undefined,
      metadata?.pattern ? `Pattern: ${metadata.pattern}` : property.pattern ? `Pattern: ${property.pattern}` : undefined,
    ]);

    return {
      name,
      type: summarizeSchema(property),
      required: required.has(name),
      description: descriptionParts.join(' '),
      aliases: sortStrings(metadata?.keyAliases ?? []),
      deprecatedAliases: sortStrings(metadata?.deprecatedKeyAliases ?? []),
      example: stringifyExample(metadata?.example),
    };
  });
}

function buildParameterTable(rows: ParameterRow[]): string {
  if (rows.length === 0) {
    return 'This method does not define input parameters.';
  }

  const tableRows = rows.map((row) =>
    `| \`${escapeTableCell(row.name)}\` | ${escapeTableCell(row.type)} | ${row.required ? 'Yes' : 'No'} | ${escapeTableCell(row.description || '-')} | ${formatList(row.aliases)} | ${formatList(row.deprecatedAliases)} | ${row.example} |`
  );

  return [
    '| Name | Type | Required | Description | Key aliases | Deprecated key aliases | Example |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...tableRows,
  ].join('\n');
}

function buildGeneratedWarning(): string {
  return `> Generated file warning: this page is generated by \`${generatorPath}\`. Do not edit generated method content by hand.`;
}

function buildFrontmatter(title: string, description: string): string {
  return `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\n---`;
}

function buildRouteBlock(route: HttpMethodDefinition | undefined): string {
  if (!route) {
    return '- HTTP route: -';
  }

  const aliasRoutes = route.aliasRoutes
    .filter((aliasRoute) => aliasRoute.path !== route.path)
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((aliasRoute) => `  - \`${route.httpMethod} ${aliasRoute.path}\`${aliasRoute.deprecated ? ' (deprecated)' : ''}`);

  return [
    `- HTTP route: \`${route.httpMethod} ${route.path}\``,
    aliasRoutes.length > 0 ? ['- HTTP alias routes:', ...aliasRoutes].join('\n') : '- HTTP alias routes: -',
  ].join('\n');
}

function buildMetadataBlock(def: MethodDefinition, route: HttpMethodDefinition | undefined): string {
  const meta = def.meta;
  const values = [
    `- Namespace: \`${meta.namespace ?? 'core'}\``,
    buildRouteBlock(route),
    `- Aliases: ${formatList(sortStrings(meta.allAliases ?? []))}`,
    `- Deprecated aliases: ${formatList(sortStrings(meta.deprecatedAliases ?? []))}`,
    meta.license ? `- License: \`${meta.license}\`` : undefined,
    meta.functionality ? `- Functionality: \`${meta.functionality}\`` : undefined,
    meta.action ? `- Action: \`${meta.action}\`` : undefined,
    meta.wapiOverride ? `- WAPI override: \`${meta.wapiOverride}\`` : undefined,
    meta.deprecated ? '- Deprecated: Yes' : undefined,
    `- Positional parameter order: ${formatList(meta.parameterOrder)}`,
  ];

  return uniqueStrings(values).join('\n');
}

function buildMethodSection(def: MethodDefinition, route: HttpMethodDefinition | undefined): string {
  const outputSummary = summarizeSchema(schemaToJsonSchema(def.meta.outputSchema));
  const parameters = buildParameterRows(def);

  return [
    `## \`${def.meta.functionName}\``,
    '',
    def.meta.description ?? `Client method ${def.meta.functionName}.`,
    '',
    buildMetadataBlock(def, route),
    '',
    '### Parameters',
    '',
    buildParameterTable(parameters),
    '',
    '### Output',
    '',
    `Returns: \`${escapeMarkdownInline(outputSummary)}\``,
  ].join('\n');
}

function slugForNamespace(namespace: string): string {
  return namespace.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
}

function writeFileIfChanged(filePath: string, content: string): void {
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, 'utf-8') === content) {
    return;
  }

  fs.writeFileSync(filePath, content);
}

function cleanGeneratedDocs(): void {
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
    return;
  }

  for (const entry of fs.readdirSync(docsDir)) {
    if (entry.endsWith('.mdx') || entry === 'meta.json') {
      fs.rmSync(path.join(docsDir, entry));
    }
  }
}

const methods = clientRegistry
  .getAll()
  .slice()
  .sort((left, right) => left.meta.functionName.localeCompare(right.meta.functionName));
const routesByFunctionName = new Map(
  getHttpMethodDefinitions('/api')
    .slice()
    .sort((left, right) => left.functionName.localeCompare(right.functionName))
    .map((route) => [route.functionName, route])
);
const methodsByNamespace = new Map<string, MethodDefinition[]>();

for (const def of methods) {
  const namespace = def.meta.namespace ?? 'core';
  const namespaceMethods = methodsByNamespace.get(namespace) ?? [];
  namespaceMethods.push(def);
  methodsByNamespace.set(namespace, namespaceMethods);
}

cleanGeneratedDocs();

const namespaces = sortStrings(Array.from(methodsByNamespace.keys()));
const meta = {
  title: 'Client API',
  pages: ['index', ...namespaces.map(slugForNamespace)],
};

const indexContent = [
  buildFrontmatter('Client API Reference', 'Generated reference for schema-registry client methods.'),
  '',
  '# Client API Reference',
  '',
  buildGeneratedWarning(),
  '',
  'These pages are generated from `packages/schema/src/registry.ts` and `packages/schema/src/methods/*.ts`.',
  '',
  '## Namespaces',
  '',
  ...namespaces.map((namespace) => {
    const namespaceMethods = methodsByNamespace.get(namespace) ?? [];
    const slug = slugForNamespace(namespace);
    return `- [${titleCase(namespace)}](./${slug}) (${namespaceMethods.length} methods)`;
  }),
].join('\n');

writeFileIfChanged(path.join(docsDir, 'index.mdx'), `${indexContent}\n`);
writeFileIfChanged(path.join(docsDir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`);

for (const namespace of namespaces) {
  const namespaceMethods = methodsByNamespace.get(namespace) ?? [];
  const pageContent = [
    buildFrontmatter(
      `${titleCase(namespace)} Client API`,
      `Generated client method reference for the ${namespace} namespace.`
    ),
    '',
    `# ${titleCase(namespace)} Client API`,
    '',
    buildGeneratedWarning(),
    '',
    `This page documents ${namespaceMethods.length} schema-registry client methods in the \`${namespace}\` namespace.`,
    '',
    namespaceMethods.map((def) => buildMethodSection(def, routesByFunctionName.get(def.meta.functionName))).join('\n\n'),
  ].join('\n');

  writeFileIfChanged(path.join(docsDir, `${slugForNamespace(namespace)}.mdx`), `${pageContent}\n`);
}

console.log(`Successfully generated Client API reference docs with ${methods.length} methods across ${namespaces.length} namespaces`);
