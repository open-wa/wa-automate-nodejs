import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { describeType, namedSchemas, typeLinks } from './type-documentation';
import { getHttpMethodDefinitions, type HttpMethodDefinition } from '../src/http-manifest';
import { clientRegistry, getParameterMetadata, type MethodDefinition, type ParameterMetadata } from '../src/registry';
import { eventRegistry, type EventDefinition } from '../src/events/registry';

import '../src/methods';
import '../src/events';

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
  namedType?: string;
};

type CanonicalMethodRecord = {
  id: string;
  anchor: string;
  name: string;
  namespacedName: string;
  namespace: string;
  description: string;
  license: string | null;
  aliases: string[];
  deprecatedAliases: string[];
  parameterOrder: string[];
  parameters: ParameterRow[];
  returnType: string;
  returnTypeLinks: Record<string, string>;
  sdkReturnType: string | null;
  returnCaveat?: string;
  returnNotes: string;
  route: { method: string; path: string; flatPath: string } | null;
  examples: {
    inProcessSdk: string;
    nodeCall: string;
    nodeClient: string;
    http: string;
    response: string;
  };
};

const generatorPath = 'packages/schema/scripts/gen-client-reference-docs.ts';
const docsDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../apps/docs/content/docs/reference/client');
const recordsPath = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../../apps/docs/src/generated/client-methods.json');

// The in-process Client facade can normalize the raw registry result. Read its
// public declarations so the UI does not silently apply one contract to both.
const sdkReturnTypes = new Map<string, string>();
const sdkMethodsDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../../client/src/methods');
for (const file of fs.readdirSync(sdkMethodsDir).filter((file) => file.endsWith('.ts'))) {
  const text = fs.readFileSync(path.join(sdkMethodsDir, file), 'utf8');
  const start = text.indexOf('export interface ');
  const end = text.indexOf('\nexport function ', start);
  for (const match of text.slice(start, end).matchAll(/^\s*(\w+)\([^\n]*\):\s*Promise<(.+)>;/gm)) {
    sdkReturnTypes.set(match[1], match[2]);
  }
}
const sdkAliases: Record<string, string> = { isPlugged: 'getIsPlugged', getLoadedMessageCount: 'getAmountOfLoadedMessages', getProfilePicture: 'getProfilePic' };

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

function escapeMdxText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

function pascalCase(value: string): string {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildAllParamsInterfaces(methods: MethodDefinition[]): string {
  const interfaces = methods.map((def) => {
    const rows = buildParameterRows(def);
    if (rows.length === 0) {
      return '';
    }

    const interfaceName = pascalCase(def.meta.functionName) + 'Params';
    const fields = rows.map((row) => {
      const docParts = [];
      if (row.description) {
        docParts.push(row.description.replace(/\*\//g, '*\\/'));
      }
      if (row.example && row.example !== '-') {
        const exampleCleaned = row.example.replace(/^`|`$/g, '').replace(/\\/g, '');
        docParts.push(`@example ${exampleCleaned.replace(/\*\//g, '*\\/')}`);
      }
      if (row.aliases.length > 0) {
        docParts.push(`@remarks Key aliases: ${row.aliases.map((a) => `'${a}'`).join(', ')}`);
      }
      if (row.deprecatedAliases.length > 0) {
        docParts.push(`@remarks Deprecated key aliases: ${row.deprecatedAliases.map((a) => `'${a}'`).join(', ')}`);
      }

      const docComment = docParts.length > 0
        ? `  /**\n   * ${docParts.map((part) => part.split('\n').join('\n   * ')).join('\n   * ')}\n   */\n`
        : '';

      const name = row.name;
      const optionalSign = row.required ? '' : '?';
      const tsType = cleanTsType(row.type);
      
      return `${docComment}  ${name}${optionalSign}: ${tsType};`;
    });

    return [
      `export interface ${interfaceName} {`,
      ...fields,
      `}`
    ].join('\n');
  }).filter(Boolean);

  return [
    '// This file is auto-generated by packages/schema/scripts/gen-client-reference-docs.ts',
    '// Do not edit this file directly.',
    '',
    ...interfaces
  ].join('\n\n') + '\n';
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
    const parts = uniqueStrings(compound.map(summarizeSchema));
    // `any` absorbs the union — an unstructured branch makes the whole thing any.
    if (parts.includes('any')) return 'any';
    return parts.join(' | ');
  }

  if (schema.allOf && schema.allOf.length > 0) {
    return uniqueStrings(schema.allOf.map(summarizeSchema)).join(' & ');
  }

  if (Array.isArray(schema.type)) {
    return schema.type.join(' | ');
  }

  if (schema.type === 'array') {
    const item = schema.items ? summarizeSchema(schema.items) : 'any';
    return `${item.includes(' | ') ? `(${item})` : item}[]`;
  }

  if (schema.type === 'object') {
    const propertyNames = schema.properties ? Object.keys(schema.properties) : [];
    if (propertyNames.length === 0) {
      return 'object';
    }

    const required = new Set(schema.required ?? []);
    return `{ ${sortStrings(propertyNames).map((name) => `${name}${required.has(name) ? '' : '?'}: ${summarizeSchema(schema.properties![name])}`).join('; ')} }`;
  }

  return (schema.type as string) ?? 'any';
}

/**
 * Introspect a Zod schema directly as a fallback when JSON-schema summarization
 * yields `unknown` (e.g. `z.any()`, branded/piped types some targets don't
 * serialize). Returns `any` for genuinely-unstructured schemas.
 */
function summarizeZodType(schema: z.ZodTypeAny, depth = 0): string {
  if (depth > 6 || !schema) return 'any';
  const def = ((schema as { def?: unknown; _def?: unknown }).def ??
    (schema as { _def?: unknown })._def) as
    | { type?: string; options?: z.ZodTypeAny[]; element?: z.ZodTypeAny; innerType?: z.ZodTypeAny; shape?: Record<string, z.ZodTypeAny>; values?: unknown[] }
    | undefined;
  const type = def?.type;

  switch (type) {
    case 'any':
      return 'any';
    case 'unknown':
      return 'unknown';
    case 'string':
    case 'number':
    case 'boolean':
    case 'null':
    case 'undefined':
      return type;
    case 'union':
      return uniqueStrings((def?.options ?? []).map((o) => summarizeZodType(o, depth + 1))).join(' | ') || 'any';
    case 'array':
      return `${def?.element ? summarizeZodType(def.element, depth + 1) : 'any'}[]`;
    case 'object': {
      const keys = def?.shape ? sortStrings(Object.keys(def.shape)) : [];
      return keys.length ? `object { ${keys.join(', ')} }` : 'object';
    }
    case 'optional':
    case 'nullable':
    case 'default':
    case 'brand':
    case 'pipe':
    case 'readonly':
      return def?.innerType ? summarizeZodType(def.innerType, depth + 1) : 'any';
    case 'enum':
      return (def?.values ?? []).map((v) => JSON.stringify(v)).join(' | ') || 'string';
    default:
      return 'any';
  }
}

/** Best-effort output type summary: JSON-schema first, Zod introspection fallback. */
function summarizeOutput(schema: z.ZodTypeAny): string {
  const inspect = (item: z.ZodTypeAny): void => {
    const def = item._zod.def as any;
    if (def.type === 'any') throw new Error('Method output uses any; supply its contract or explicitly document an unknown provider payload.');
    if (def.element) inspect(def.element);
    if (def.innerType) inspect(def.innerType);
    if (def.options) def.options.forEach(inspect);
  };
  inspect(schema);
  return describeType(schema);
}

function isUnstructuredOutput(summary: string): boolean {
  return summary === 'any' || summary === 'any[]';
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
      type: summarizeSchema(property) === 'any' && inputShape[name]
        ? summarizeZodType(inputShape[name])
        : summarizeSchema(property),
      required: inputShape[name] ? !inputShape[name].isOptional() : required.has(name),
      description: descriptionParts.join(' '),
      aliases: sortStrings(metadata?.keyAliases ?? []),
      deprecatedAliases: sortStrings(metadata?.deprecatedKeyAliases ?? []),
      example: stringifyExample(metadata?.example),
      namedType: metadata?.brandedType,
    };
  });
}
function cleanTsType(typeStr: string): string {
  let cleaned = typeStr.trim();
  if (!cleaned) {
    return 'any';
  }
  if (cleaned.startsWith('object {')) {
    const inner = cleaned.substring('object {'.length, cleaned.length - 1).trim();
    if (inner) {
      const parts = inner.split(',').map((p) => p.trim());
      return `{ ${parts.map((p) => `${p}: any;`).join(' ')} }`;
    }
    return 'Record<string, any>';
  }
  if (cleaned === 'object') {
    return 'Record<string, any>';
  }
  return cleaned;
}

function buildParameterTable(def: MethodDefinition, rows: ParameterRow[]): string {
  if (rows.length === 0) {
    return 'This method does not define input parameters.';
  }

  const interfaceName = pascalCase(def.meta.functionName) + 'Params';
  return `<AutoTypeTable path="./generated-method-params.ts" name="${interfaceName}" />`;
}

function buildGeneratedWarning(): string {
  return `> Generated file warning: \`${generatorPath}\` generates this page. Do not edit generated method content by hand.`;
}

function buildFrontmatter(title: string, description: string, icon?: string): string {
  const lines = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(description)}`,
  ];

  if (icon) {
    lines.push(`icon: ${JSON.stringify(icon)}`);
  }

  lines.push('---');
  return lines.join('\n');
}

function buildRouteBlock(route: HttpMethodDefinition | undefined): string {
  if (!route) {
    return [
      '### Routes',
      '',
      '| Type | Method | Path | Name | Status |',
      '| --- | --- | --- | --- | --- |',
      '| Primary | - | - | - | Not registered |',
    ].join('\n');
  }

  const aliasRows = route.aliasRoutes
    .filter((aliasRoute) => aliasRoute.path !== route.path)
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((aliasRoute) => [
      aliasRoute.deprecated ? 'Deprecated alias' : 'Alias',
      `\`${escapeTableCell(route.httpMethod)}\``,
      `\`${escapeTableCell(aliasRoute.path)}\``,
      `\`${escapeTableCell(aliasRoute.name)}\``,
      aliasRoute.deprecated ? '**Deprecated**' : 'Active',
    ]);

  const rows = [
    ['Primary', `\`${escapeTableCell(route.httpMethod)}\``, `\`${escapeTableCell(route.path)}\``, `\`${escapeTableCell(route.functionName)}\``, 'Active'],
    ...aliasRows,
  ];

  return [
    '### Routes',
    '',
    '| Type | Method | Path | Name | Status |',
    '| --- | --- | --- | --- | --- |',
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

function buildOverviewBlock(def: MethodDefinition): string {
  const meta = def.meta;
  const rows = [
    ['Namespace', `\`${escapeTableCell(meta.namespace ?? 'core')}\``],
    ['Action', meta.action ? `\`${escapeTableCell(meta.action)}\`` : '-'],
    ['Functionality', meta.functionality ? `\`${escapeTableCell(meta.functionality)}\`` : '-'],
    ['Positional parameter order', formatList(meta.parameterOrder)],
    ['Aliases', formatList(sortStrings(meta.allAliases ?? []))],
    ['Deprecated aliases', formatList(sortStrings(meta.deprecatedAliases ?? []))],
    ['License', meta.license ? `\`${escapeTableCell(meta.license)}\`` : '`none`'],
    ['WAPI override', meta.wapiOverride ? `\`${escapeTableCell(meta.wapiOverride)}\`` : '-'],
    ['Deprecated', meta.deprecated ? '**Yes**' : 'No'],
  ];

  return [
    '### Overview',
    '',
    '| Prop | Value |',
    '| --- | --- |',
    ...rows.map(([prop, value]) => `| ${prop} | ${value} |`),
  ].join('\n');
}

function buildOutputBlock(outputSummary: string, notes?: string): string {
  const lines = [
    '| Prop | Value |',
    '| --- | --- |',
    `| Return type | \`Promise<${escapeTableCell(outputSummary)}>\` |`,
    ...Object.entries(typeLinks(outputSummary)).map(([name, url]) => `| ${name} | [View fields](${url}) |`),
  ];
  if (isUnstructuredOutput(outputSummary)) {
    lines.push('');
    lines.push('> Returns raw, unstructured data from WhatsApp Web. Narrow or validate the shape before relying on specific fields.');
  }
  lines.push('');
  lines.push(notes ?? `The call resolves to \`${escapeMarkdownInline(outputSummary)}\`. A rejected Promise indicates input validation or dispatch failure.`);
  return lines.join('\n');
}

function buildReturnNotes(def: MethodDefinition, outputSummary: string): string {
  if (def.meta.functionName === 'sendText') {
    return 'A successful send returns a message ID as a string; some Easy API responses may serialize it as an object with `_serialized`. A boolean or a non-ID status string is not a message ID: the current WAPI can return values such as `Not a contact` or `Not able to send message to broadcast`. The in-process Client converts `Not a contact` into a rejected Promise because sending to an unknown number requires a Restricted or Premium license; the method is not otherwise license-gated. The in-process Client is declared as `Promise<string | false>`. Check returned values before passing them to another method, and handle rejected Promises for input, dispatch, license, or provider errors.';
  }

  if (def.meta.functionName === 'deleteMessage') {
    return 'Resolves to `boolean`: `true` means the runtime accepted the operation and `false` means it did not complete. Provider-side revoke can still be rejected, so the value is not proof that every recipient removed the message. A rejected Promise indicates input validation or dispatch failure.';
  }

  const description = def.meta.outputSchema.description;
  if (description) return description;
  return `Resolves to \`${escapeMarkdownInline(outputSummary)}\`. A rejected Promise indicates input validation or dispatch failure.`;
}

/** Illustrative JSON data follows the output schema, never a guessed ID for every object. */
function responseValue(schema: z.ZodType, depth = 0): unknown {
  if (depth > 8) return undefined;
  const def = schema._zod.def as any;
  const name = describeType(schema);
  if (name === 'DataURL') return 'data:image/png;base64,...';
  if (/^(ChatId|ContactId)$/.test(name)) return '447123456789@c.us';
  if (/^(GroupId|GroupChatId)$/.test(name)) return '447123456789-1445627445@g.us';
  if (name === 'MessageId') return 'true_447123456789@c.us_9C4D0965EA5C09D591334AB6BDB07FEB';
  switch (def.type) {
    case 'array': return [];
    case 'boolean': return true;
    case 'number': return 0;
    case 'string': return 'example';
    case 'literal': return [...def.values][0];
    case 'enum': return Object.values(def.entries)[0];
    case 'union': return responseValue(def.options[0], depth + 1);
    case 'optional': case 'nullable': case 'default': case 'readonly': return responseValue(def.innerType, depth + 1);
    case 'object': return Object.fromEntries(Object.entries(def.shape).filter(([, value]) => !(value as z.ZodType).isOptional()).map(([key, value]) => [key, responseValue(value as z.ZodType, depth + 1)]));
    case 'record': return {};
    default: return undefined;
  }
}
function buildResponseExample(schema: z.ZodType): string {
  return JSON.stringify({ success: true, data: responseValue(schema) }, null, 2);
}

function decodeMarkdownInline(value: string): string {
  return value.replace(/^`|`$/g, '').replace(/\\`/g, '`').replace(/\\\|/g, '|').replace(/&#123;/g, '{').replace(/&#125;/g, '}');
}

function sampleValueForParameter(row: ParameterRow): string {
  if (row.example !== '-') {
    const example = decodeMarkdownInline(row.example);
    return row.type.endsWith('[]') && !row.type.includes(' | ') && !example.startsWith('[') ? `[${example}]` : example;
  }

  if (row.name === 'options' && row.description.includes('Poll')) return '[\"Yes\", \"No\"]';
  if (row.type.startsWith('{') || row.type.startsWith('object') || row.type === 'unknown' || row.type === 'any') return '{}';
  if (row.type === 'string | string[]' && row.name === 'contactId') return JSON.stringify('447123456789@c.us');
  if (row.type.endsWith('[]')) return '[]';

  if (row.type.includes('number')) {
    return '1';
  }

  if (row.type.includes('boolean')) {
    return 'true';
  }

  if (row.type.startsWith('object') || row.type === 'unknown') {
    return '{}';
  }

  return JSON.stringify(row.name);
}

function buildPositionalCall(functionName: string, rows: ParameterRow[]): string {
  const argumentsList = rows.map((row) => sampleValueForParameter(row)).join(', ');
  return `const result = await client.${functionName}(${argumentsList});`;
}

function buildObjectCall(functionName: string, rows: ParameterRow[]): string {
  if (rows.length === 0) {
    return `const result = await client.${functionName}();`;
  }

  if (functionName === 'decryptMedia' || functionName === 'downloadMedia') {
    return `// Use the full media message received by your message handler.\nconst result = await client.${functionName}({ message${functionName === 'downloadMedia' ? ', path: \"./downloaded-media\"' : ''} });`;
  }
  const body = rows.map((row) => `  ${row.name}: ${sampleValueForParameter(row)},`).join('\n');
  return `const result = await client.${functionName}({\n${body}\n});`;
}

function buildJsonBody(rows: ParameterRow[], indent: string): string {
  if (rows.length === 0) {
    return '{}';
  }

  const entries = rows.map((row) => {
    const sample = sampleValueForParameter(row);
    try {
      return [row.name, JSON.parse(sample)] as const;
    } catch {
      return [row.name, sample] as const;
    }
  });

  return JSON.stringify(Object.fromEntries(entries), null, 2).split('\n').map((line, index) => index === 0 ? line : `${indent}${line}`).join('\n');
}

function buildCurlExample(route: HttpMethodDefinition | undefined, rows: ParameterRow[]): string {
  if (!route) {
    return '# HTTP route is not registered for this method yet.';
  }

  const url = `http://localhost:8080${route.path}`;
  if (rows.some((row) => row.name === 'message' && row.type.startsWith('{'))) {
    return `# Save the full incoming media message as the "message" field in request.json.\n# For downloadMedia, also set "path" to the destination filename.\ncurl -X ${route.httpMethod} "${url}" \\\n  -H "content-type: application/json" \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  --data-binary @request.json`;
  }
  if (route.httpMethod === 'GET' && rows.length > 0) {
    return [
      `curl -G ${JSON.stringify(url)} \\`,
      '  -H "x-api-key: YOUR_API_KEY" \\',
      ...rows.map((row, index) => {
        const suffix = index === rows.length - 1 ? '' : ' \\';
        return `  --data-urlencode ${JSON.stringify(`${row.name}=${sampleValueForParameter(row).replace(/^"|"$/g, '')}`)}${suffix}`;
      }),
    ].join('\n');
  }

  return [
    `curl -X ${route.httpMethod} ${JSON.stringify(url)} \\`,
    '  -H "content-type: application/json" \\',
    '  -H "x-api-key: YOUR_API_KEY" \\',
    `  --data '${buildJsonBody(rows, '  ')}'`,
  ].join('\n');
}

function buildUsageTabs(def: MethodDefinition, route: HttpMethodDefinition | undefined, rows: ParameterRow[], outputSummary: string): string {
  const namespace = def.meta.namespace ?? 'core';
  const namespacedName = def.meta.namespacedName ?? def.meta.functionName;
  const exampleRows = rows.filter((row) => row.required);
  const exampleCall = def.meta.functionName === 'sendText'
    ? buildPositionalCall(def.meta.functionName, exampleRows)
    : buildObjectCall(def.meta.functionName, exampleRows);

  const record = buildCanonicalMethodRecord(def, route);

  // Interface-aware usage: the tab shown follows the reader's site-wide
  // "preferred interface" choice. SocketClient is the same call surface over a
  // socket and is the basis for other-language clients.
  return [
    '### Usage',
    '',
    '<InterfaceTabs>',
    ...(record.sdkReturnType ? [
      '  <InterfaceTab value="Embedded">',
      '',
      '```ts',
      record.examples.inProcessSdk,
      '```',
      '',
      '  </InterfaceTab>',
    ] : []),
    '  <InterfaceTab value="SocketClient">',
    '',
    '```ts',
    "import { SocketClient } from '@open-wa/socket-client';",
    '',
    "const client = await SocketClient.connect('http://localhost:8080', 'YOUR_API_KEY');",
    exampleCall,
    '```',
    '',
    '  </InterfaceTab>',
    '  <InterfaceTab value="Easy API">',
    '',
    '```bash',
    buildCurlExample(route, exampleRows),
    '```',
    '',
    'Example response envelope:',
    '',
    '```json',
    buildResponseExample(def.meta.outputSchema),
    '```',
    '',
    '  </InterfaceTab>',
    '</InterfaceTabs>',
  ].join('\n');
}

function methodAnchor(functionName: string): string {
  return functionName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function buildCanonicalMethodRecord(
  def: MethodDefinition,
  route: HttpMethodDefinition | undefined,
): CanonicalMethodRecord {
  const parameters = buildParameterRows(def);
  const returnType = summarizeOutput(def.meta.outputSchema);
  const sdkReturnType = sdkReturnTypes.get(sdkAliases[def.meta.functionName] ?? def.meta.functionName) ?? null;
  const anchor = methodAnchor(def.meta.functionName);
  const exampleParameters = parameters.filter((parameter) => parameter.required);
  const exampleCall = def.meta.functionName === 'sendText'
    ? [
      `const result = await client.sendText(${sampleValueForParameter(parameters.find((parameter) => parameter.name === 'to')!)}, ${sampleValueForParameter(parameters.find((parameter) => parameter.name === 'content')!)});`,
      'const candidate = typeof result === \'string\' ? result : typeof result === \'object\' && result !== null && \'_serialized\' in result ? result._serialized : null;',
      'const messageId = typeof candidate === \'string\' && /^(true|false)_.+_.+$/.test(candidate) ? candidate : null;',
      'if (!messageId) {',
      '  throw new Error(`Message was not sent: ${String(result)}`);',
      '}',
      'console.log(\'Message ID:\', messageId);',
    ].join('\n')
    : buildObjectCall(def.meta.functionName, exampleParameters);

  return {
    id: `${slugForNamespace(def.meta.namespace ?? 'core')}.${anchor}`,
    anchor,
    name: def.meta.functionName,
    namespacedName: def.meta.namespace ? `${def.meta.namespace}.${def.meta.namespacedName}` : def.meta.functionName,
    namespace: def.meta.namespace ?? 'core',
    description: def.meta.description ?? `Client method ${def.meta.functionName}.`,
    license: def.meta.license && def.meta.license !== 'none' ? def.meta.license : null,
    aliases: sortStrings(def.meta.allAliases ?? []),
    deprecatedAliases: sortStrings(def.meta.deprecatedAliases ?? []),
    parameterOrder: [...def.meta.parameterOrder],
    parameters,
    returnType,
    returnTypeLinks: typeLinks(`${returnType} ${sdkReturnType ?? ''}`),
    sdkReturnType,
    returnCaveat: def.meta.outputSchema.description ?? (def.meta.outputSchema._zod.def as any).element?.description,
    returnNotes: buildReturnNotes(def, returnType),
    route: route ? { method: route.httpMethod, path: route.path, flatPath: route.aliasRoutes.find((alias) => alias.name === def.meta.functionName)?.path ?? route.path } : null,
    examples: {
      inProcessSdk: !sdkReturnType ? '' : def.meta.functionName === 'decryptMedia' || def.meta.functionName === 'downloadMedia'
        ? `// Use the full media message from your message handler.\nconst result = await client.${def.meta.functionName}(message${def.meta.functionName === 'downloadMedia' ? ', "./downloaded-media"' : ''});`
        : def.meta.functionName === 'sendText'
          ? [
            "const result = await client.sendText('447123456789@c.us', 'Hello from open-wa');",
            'const messageId = typeof result === \'string\' && /^(true|false)_.+_.+$/.test(result) ? result : null;',
            'if (!messageId) throw new Error(`Message was not sent: ${String(result)}`);',
            "console.log('Message ID:', messageId);",
          ].join('\n')
          : buildPositionalCall(sdkAliases[def.meta.functionName] ?? def.meta.functionName, exampleParameters),
      nodeCall: exampleCall,
      nodeClient: [
        "import { SocketClient } from '@open-wa/socket-client';",
        '',
        "const client = await SocketClient.connect('http://localhost:8080', 'YOUR_API_KEY');",
        exampleCall,
      ].join('\n'),
      http: buildCurlExample(route, exampleParameters),
      response: buildResponseExample(def.meta.outputSchema),
    },
  };
}

function buildMethodSignature(record: CanonicalMethodRecord): string {
  const parameters = record.parameterOrder.map((name) => {
    const parameter = record.parameters.find((item) => item.name === name);
    return `${name}${parameter?.required ? '' : '?'}: ${parameter?.type ?? 'unknown'}`;
  });
  return `client.${record.name}(${parameters.join(', ')}): Promise<${record.returnType}>`;
}

function buildMethodSection(def: MethodDefinition, route: HttpMethodDefinition | undefined): string {
  const record = buildCanonicalMethodRecord(def, route);
  const outputSummary = record.returnType;
  const parameters = record.parameters;

  const parts = [
    record.license ? `<span id="${record.anchor}---${record.license}" aria-hidden="true"></span>` : '',
    `## \`${def.meta.functionName}\``,
    '',
    record.description,
    '',
    `**Signature** \`${escapeMarkdownInline(buildMethodSignature(record))}\``,
    '',
    def.meta.functionName === 'sendText'
      ? 'Start with `await client.sendText(to, content)`. The registry still accepts an optional `options` value for compatibility, but the current Client implementation ignores it. Use `reply(to, content, messageId)` for quoted replies and `sendTextWithMentions(to, content, hideTags, mentions)` for mentions.'
      : '',
    '',
    buildUsageTabs(def, route, parameters, outputSummary),
    '',
    '### Parameters',
    '',
    buildParameterTable(def, parameters),
    '',
    '### Returns',
    '',
    buildOutputBlock(outputSummary, buildReturnNotes(def, outputSummary)),
    '',
    record.sdkReturnType ? `In-process Client resolves to \`Promise<${escapeMarkdownInline(record.sdkReturnType)}>\`. The contract above is for the remote Node.js client; HTTP wraps that result in its \`data\` property.` : 'This method is not declared on the in-process Client facade. Use the remote Node.js client or HTTP API.',
    record.returnCaveat ?? '',
    '',
    '<details>',
    '<summary>Advanced method metadata</summary>',
    '',
    buildOverviewBlock(def),
    '',
    buildRouteBlock(route),
    '',
    '</details>',
  ];

  const section = parts.filter((part, index) => part !== '' || parts[index - 1] !== '').join('\n');
  if (!record.license) {
    return section;
  }

  // Keep the whole method contract inside the tier treatment. The blank lines
  // make headings, tables, and tabs parse as Markdown children of the MDX node.
  return [
    `<LicensedMethodSection tier="${record.license}">`,
    '',
    section,
    '',
    '</LicensedMethodSection>',
  ].join('\n');
}

function slugForNamespace(namespace: string): string {
  return namespace.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
}

function buildGeneratedPage(title: string, description: string, body: string): string {
  return [
    buildFrontmatter(title, description, 'BookOpen'),
    '',
    `# ${title}`,
    '',
    body.trim(),
    '',
  ].join('\n');
}

// ── #5: lightweight flat client index (was a 177KB full dump) ────────────────
function buildClientIndexPage(methods: MethodDefinition[]): string {
  const rows = methods.map((def) => {
    const anchor = methodAnchor(def.meta.functionName);
    const license = def.meta.license && def.meta.license !== 'none' ? `\`${def.meta.license}\`` : '-';
    return `| [\`${def.meta.functionName}\`](/docs/reference/client/client#${anchor}) | \`${escapeTableCell(def.meta.namespace ?? 'core')}\` | ${escapeTableCell(def.meta.description ?? '')} | ${license} |`;
  });
  return buildGeneratedPage(
    'Client API',
    'Client methods, return values, and examples.',
    [
      '<ClientReference />',
      '',
      '<details>\n<summary>Plain-text method index</summary>\n',
      '',
      '| Method | Namespace | Description | License |',
      '| --- | --- | --- | --- |',
      ...rows,
      '\n</details>',
    ].join('\n'),
  );
}

// ── #6: methods grouped by license tier ─────────────────────────────────────
function buildLicensedMethodsPage(methods: MethodDefinition[]): string {
  const byTier = new Map<string, MethodDefinition[]>();
  for (const def of methods) {
    const tier = def.meta.license && def.meta.license !== 'none' ? def.meta.license : 'none';
    (byTier.get(tier) ?? byTier.set(tier, []).get(tier)!).push(def);
  }
  const tierOrder = sortStrings([...byTier.keys()].filter((t) => t !== 'none'));

  const sections = tierOrder.map((tier) => {
    const list = (byTier.get(tier) ?? []).sort((a, b) => a.meta.functionName.localeCompare(b.meta.functionName));
    const rows = list.map((def) => {
      return `| [\`${def.meta.functionName}\`](/docs/reference/client/client#${methodAnchor(def.meta.functionName)}) | \`${escapeTableCell(def.meta.namespace ?? 'core')}\` | ${escapeTableCell(def.meta.description ?? '')} |`;
    });
    const section = [
      `## \`${tier}\` (${list.length})`,
      '',
      '| Method | Namespace | Description |',
      '| --- | --- | --- |',
      ...rows,
    ].join('\n');
    return [
      `<LicensedMethodSection tier="${tier}">`,
      '',
      section,
      '',
      '</LicensedMethodSection>',
    ].join('\n');
  });

  const freeCount = (byTier.get('none') ?? []).length;
  const licensedCount = methods.length - freeCount;
  return buildGeneratedPage(
    'Licensed methods',
    'Client methods that require a license key, grouped by tier.',
    [
      `The method registry marks **${licensedCount}** methods as licensed. The tables group them by required tier; check each method’s reference for runtime and account requirements.`,
      '',
      sections.join('\n\n'),
    ].join('\n'),
  );
}

// ── #3 (#3338): internals pages, registry-derived ───────────────────────────
function buildBaseClientDispatchTable(methods: MethodDefinition[]): string {
  const rows = methods.map((def) => {
    const meta = def.meta;
    const dispatch = meta.wapiOverride ?? meta.functionName;
    return `| \`${meta.functionName}\` | \`${escapeTableCell(meta.namespace ?? 'core')}\` | \`${escapeTableCell(dispatch)}\` | ${formatList(meta.parameterOrder)} | \`${escapeTableCell(summarizeOutput(meta.outputSchema))}\` |`;
  });
  return ['| Method | Namespace | Dispatch target | Parameter order | Output |', '| --- | --- | --- | --- | --- |', ...rows].join('\n');
}

function buildFunctionAliasTable(methods: MethodDefinition[]): string {
  const rows: string[] = [];
  for (const def of methods) {
    const deprecated = new Set(def.meta.deprecatedAliases ?? []);
    for (const alias of sortStrings(def.meta.allAliases ?? [])) {
      if (alias === def.meta.functionName) continue;
      rows.push(`| \`${def.meta.functionName}\` | \`${escapeTableCell(alias)}\` | ${deprecated.has(alias) ? 'Yes' : 'No'} | ${alias.includes('.') ? 'Namespaced' : 'Flat'} |`);
    }
  }
  return ['| Canonical method | Alias | Deprecated | Kind |', '| --- | --- | --- | --- |', ...rows].join('\n');
}

function buildKeyAliasTable(methods: MethodDefinition[]): string {
  const seen = new Set<string>();
  const rows: string[] = [];
  for (const def of methods) {
    for (const [name, schema] of Object.entries(getInputShape(def))) {
      const meta = getParameterMetadata(schema);
      for (const alias of sortStrings(meta?.keyAliases ?? [])) {
        const key = `${name}:${alias}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push(`| \`${escapeTableCell(name)}\` | \`${escapeTableCell(alias)}\` | ${meta?.brandedType ? `\`${escapeTableCell(meta.brandedType)}\`` : '-'} | ${meta?.example !== undefined ? `\`${escapeMarkdownInline(JSON.stringify(meta.example))}\`` : '-'} |`);
      }
    }
  }
  return ['| Canonical key | Alias | Branded type | Example |', '| --- | --- | --- | --- |', ...sortStrings(rows)].join('\n');
}

function buildInternalsPages(
  methods: MethodDefinition[],
  namespaceCount: number,
  routes: Map<string, HttpMethodDefinition>,
): Record<string, string> {
  const methodCount = methods.length;
  const sendText = methods.find((d) => d.meta.functionName === 'sendText');

  return {
    'schema-pipeline': buildGeneratedPage('Schema pipeline', 'How method schemas become the client, types, OpenAPI, and these docs.', [
      'Every client method is defined once with `defineMethodV2()` and registered in `clientRegistry`. All downstream artifacts are projections of that single source of truth:',
      '',
      '```text',
      'packages/schema/src/methods/*.ts',
      '        |  defineMethodV2(...)',
      '        v',
      '  clientRegistry.getAll()',
      '        |',
      '        +-> gen-client-implementation.ts --> BaseClient / BaseNamespacedClient / AliasMap',
      '        +-> gen-types.ts                 --> generated Input/Output type aliases',
      '        +-> gen-openapi.ts               --> openapi.json',
      '        +-> gen-client-reference-docs.ts --> these reference pages',
      '```',
      '',
      `The registry currently holds **${methodCount} methods** across **${namespaceCount} namespaces**.`,
    ].join('\n')),

    'base-client': buildGeneratedPage('BaseClient', 'The generated flat client, its dispatch contract, and the full method table.', [
      '`BaseClient` is generated from the registry. Each method is a one-line binding, for example:',
      '',
      '```ts',
      '/** Sends a text message to a chat */',
      'public sendText = implementMethod(Methods.sendText);',
      '```',
      '',
      'At runtime each call normalizes arguments, validates them with the method\'s Zod input schema, then dispatches to `execute(meta.wapiOverride ?? meta.functionName, validatedParams)` (falling back to `pup()` page evaluation). See [Argument normalization](/docs/reference/client/argument-normalization).',
      '',
      '## Method dispatch table',
      '',
      buildBaseClientDispatchTable(methods),
    ].join('\n')),

    'namespaced-client': buildGeneratedPage('Namespaced client', 'How BaseNamespacedClient builds namespace objects from aliases.', [
      'Namespaced aliases group related methods. For example, `groups.create` resolves to `createGroup`, and `messages.sendText` resolves to `sendText`. Both names identify the same registered method.',
      '',
      'The [compact reference](/docs/reference/client/client) starts with flat method names. Turn on **Namespaced** beside **Expand parameters** to browse by namespace. Permanent method links stay the same.',
      '',
      'The [HTTP API](/docs/getting-started/easy-api) registers both forms, such as `/api/createGroup` and `/api/groups/create`. Its examples follow the switch. The [Node.js client](/docs/client-and-integrations/socket-client) and [in-process SDK](/docs/getting-started/custom-code) use flat calls such as `client.createGroup(...)`; they do not expose `client.groups.create(...)`, so their examples keep the callable form.',
      '',
      '`BaseNamespacedClient` is a generated base class for client implementations. It extends `BaseClient` and builds namespace objects from the registered aliases. It is not the class returned by `SocketClient.connect()`.',
      '',
      'See the full alias map on [Aliases](/docs/reference/client/aliases).',
    ].join('\n')),

    'argument-normalization': buildGeneratedPage('Argument normalization', 'Positional vs object arguments, alias resolution, validation, and dispatch.', [
      'Every generated method accepts either positional arguments (mapped by `parameterOrder`) or a single options object (with key aliases resolved).',
      '',
      '```ts',
      "await client.sendText('447123456789@c.us', 'Hello, world!');",
      '// positional args map by parameterOrder -> { to, content, options }',
      '',
      "await client.sendText({ chatId: '447123456789@c.us', text: 'Hello, world!' });",
      '// key aliases normalize -> { to, content }',
      '```',
      '',
      'Steps: 1) resolve positional/object args, 2) normalize key aliases, 3) `inputSchema.parseAsync()` validates, 4) dispatch to `execute(...)`. Invalid input rejects before any WhatsApp call.',
    ].join('\n')),

    aliases: buildGeneratedPage('Aliases', 'Function aliases and parameter key aliases across all methods.', [
      '## Function aliases',
      '',
      'Alternative names (including namespaced forms) that resolve to a canonical method.',
      '',
      buildFunctionAliasTable(methods),
      '',
      '## Parameter key aliases',
      '',
      'Alternative object keys accepted for a canonical parameter.',
      '',
      buildKeyAliasTable(methods),
    ].join('\n')),

    schemas: buildGeneratedPage('Data models', 'Core data models returned by client methods.', [
      'These are the main data models. Fields are derived from the exported types in `packages/schema/src/common-types.ts`.',
      '',
      '### Message',
      '<AutoTypeTable path="../../../../../../packages/schema/src/common-types.ts" name="Message" />',
      '',
      '### Contact',
      '<AutoTypeTable path="../../../../../../packages/schema/src/common-types.ts" name="Contact" />',
      '',
      '### Chat',
      '<AutoTypeTable path="../../../../../../packages/schema/src/common-types.ts" name="Chat" />',
      '',
      '### GroupMetadata',
      '<AutoTypeTable path="../../../../../../packages/schema/src/common-types.ts" name="GroupMetadata" />',
    ].join('\n')),

    'generated-types': buildGeneratedPage('Generated types', 'Where the generated input/output type aliases come from.', [
      '`gen-types.ts` emits input and output type aliases for every method from its `inputSchema` and `outputSchema` into `packages/schema/src/generated/types.ts`. `@open-wa/wa-automate-types-only` re-exposes this generated surface so consumers can import method types without the runtime.',
    ].join('\n')),

    'send-text-worked-example': buildGeneratedPage('Trace sendText through the runtime', 'Contributor walkthrough of how sendText is defined and dispatched.', [
      sendText
        ? [
            'This contributor walkthrough follows `sendText` from its schema definition to runtime dispatch. For the consumer contract, start with the [sendText method block](/docs/reference/client/messages#sendtext).',
            '',
            '## Consumer usage',
            '',
            '```ts',
            "import { create } from '@open-wa/wa-automate';",
            '',
            "const client = await create({ sessionId: 'docs-example' });",
            "const result = await client.sendText('447123456789@c.us', 'Hello from open-wa');",
            'if (typeof result === \'string\') {',
            '  console.log(`Sent message: ${result}`);',
            '} else {',
            '  console.error(\'The client did not return a message id\', result);',
            '}',
            '```',
            '',
            '## Runtime trace',
            '',
            '`sendText` is defined in `packages/schema/src/methods/messaging.ts`:',
            '',
            '```ts',
            "export const sendText = defineMethodV2('sendText', {",
            `  meta: { description: ${JSON.stringify(sendText.meta.description ?? '')}, namespace: ${JSON.stringify(sendText.meta.namespace ?? 'core')}, httpMethod: ${JSON.stringify((routes.get('sendText')?.httpMethod) ?? 'POST')} },`,
            `  parameterOrder: ${JSON.stringify(sendText.meta.parameterOrder)},`,
            '  // input: z.object({ to, content, options }), output: MessageId | boolean | string',
            '});',
            '```',
            '',
            '1. A positional call maps by `parameterOrder`.',
            '2. An object call resolves key aliases (`chatId` → `to`, `text` → `content`).',
            '3. `inputSchema.parseAsync()` validates before dispatch.',
            `4. Dispatch target is \`execute('${sendText.meta.wapiOverride ?? 'sendText'}', validatedParams)\`.`,
            '5. See the full reference on the [messages namespace page](/docs/reference/client/messages#sendtext).',
          ].join('\n')
        : 'The `sendText` method is not currently registered.',
    ].join('\n')),
  };
}

// ── #4: generated events reference from the event registry ──────────────────
function buildEventsPage(events: EventDefinition[]): string {
  const sorted = [...events].sort((a, b) => a.meta.eventName.localeCompare(b.meta.eventName));
  const rows = sorted.map((def) => {
    const m = def.meta;
    const payload = summarizeOutput(m.payloadSchema);
    const status = m.status ?? 'stable';
    const license = m.license && m.license !== 'none' ? `\`${m.license}\`` : '-';
    const eventAnchor = m.eventName.toLowerCase();
    return `| <span id="${eventAnchor}"></span>\`${escapeTableCell(m.eventName)}\` | \`${escapeTableCell(m.legacyName)}\` | ${escapeTableCell(m.description ?? '')} | \`${escapeTableCell(payload)}\` | ${status} | ${license} |`;
  });

  return buildGeneratedPage(
    'Events',
    'Generated reference for registered client events and their payloads.',
    [
      `open-wa emits **${sorted.length}** events. Subscribe with the client helper (\`client.onMessage\`), the legacy listener name, or the event bus wildcard. Payload types are derived from each event\'s registered schema.`,
      '',
      '| Event | Legacy listener | Description | Payload | Status | License |',
      '| --- | --- | --- | --- | --- | --- |',
      ...rows,
    ].join('\n'),
  );
}

const INTERNALS_PAGE_ORDER = [
  'schema-pipeline',
  'base-client',
  'namespaced-client',
  'argument-normalization',
  'aliases',
  'schemas',
  'generated-types',
  'return-types',
  'send-text-worked-example',
];

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
    if (entry.endsWith('.mdx') || entry === 'meta.json' || entry === 'methods-map.json' || entry === 'methods-records.json' || entry === 'generated-method-params.ts') {
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
  icon: 'BookOpen',
  pages: ['index', 'client', ...INTERNALS_PAGE_ORDER, 'events', 'licensed-methods', ...namespaces.map(slugForNamespace)],
};

const indexContent = [
  buildFrontmatter('Client API Reference', 'Generated reference for schema-registry client methods.', 'BookOpen'),
  '',
  '# Client API Reference',
  '',
  '`packages/schema/scripts/gen-client-reference-docs.ts` generates these pages from the schema registry and method files.',
  '',
  '<InterfacePreference />',
  '',
  '## Namespaces',
  '',
  '<Cards>',
  '',
  ...namespaces.map((namespace) => {
    const namespaceMethods = methodsByNamespace.get(namespace) ?? [];
    const slug = slugForNamespace(namespace);
    return [
      `  <Card title="${escapeMdxText(titleCase(namespace))}" href="./${slug}">`,
      `    ${namespaceMethods.length} client methods`,
      '  </Card>',
      '',
    ].join('\n');
  }),
  '</Cards>',
  '',
  '## How the client works',
  '',
  '- [Schema pipeline](/docs/reference/client/schema-pipeline) — one definition, many projections',
  '- [BaseClient](/docs/reference/client/base-client) — the generated flat client and dispatch table',
  '- [Namespaced client](/docs/reference/client/namespaced-client) — namespace member mapping',
  '- [Argument normalization](/docs/reference/client/argument-normalization) — positional vs object args, aliases',
  '- [Aliases](/docs/reference/client/aliases) — function and parameter key aliases',
  '- [Data models](/docs/reference/client/schemas) — Message, Contact, Chat, GroupMetadata',
  '- [Generated types](/docs/reference/client/generated-types) — where input/output type aliases come from',
  '- [Worked example: sendText](/docs/reference/client/send-text-worked-example)',
  '- [Events](/docs/reference/client/events) — registered events and payloads',
  '- [Licensed methods](/docs/reference/client/licensed-methods) — what needs a license key',
  '- [All client methods](/docs/reference/client/client) — alphabetical index',
].join('\n');

writeFileIfChanged(path.join(docsDir, 'index.mdx'), `${indexContent}\n`);
writeFileIfChanged(path.join(docsDir, 'meta.json'), `${JSON.stringify(meta, null, 2)}\n`);

// #5: the flat page is now a lightweight alphabetical index (was ~177KB); the
// full per-method detail lives on the namespace pages.
writeFileIfChanged(path.join(docsDir, 'client.mdx'), buildClientIndexPage(methods));

// #3 (#3338): registry-derived internals pages.
const internalsPages = buildInternalsPages(methods, namespaces.length, routesByFunctionName);
for (const [slug, content] of Object.entries(internalsPages)) {
  writeFileIfChanged(path.join(docsDir, `${slug}.mdx`), content);
}

// #4: generated events reference.
writeFileIfChanged(path.join(docsDir, 'events.mdx'), buildEventsPage(eventRegistry.getAll()));

// #6: methods grouped by license tier.
writeFileIfChanged(path.join(docsDir, 'licensed-methods.mdx'), buildLicensedMethodsPage(methods));

for (const namespace of namespaces) {
  const namespaceMethods = methodsByNamespace.get(namespace) ?? [];
  const pageContent = [
    buildFrontmatter(
      `${titleCase(namespace)} Client API`,
      `Generated client method reference for the ${namespace} namespace.`,
      'BookOpen'
    ),
    '',
    `# ${titleCase(namespace)} Client API`,
    '',
    `This page documents ${namespaceMethods.length} schema-registry client methods in the \`${namespace}\` namespace.`,
    '',
    namespaceMethods.map((def) => buildMethodSection(def, routesByFunctionName.get(def.meta.functionName))).join('\n\n'),
  ].join('\n');

  writeFileIfChanged(path.join(docsDir, `${slugForNamespace(namespace)}.mdx`), `${pageContent}\n`);
}

const methodsMap: Record<string, string> = {};
const canonicalMethodRecords: CanonicalMethodRecord[] = [];
for (const def of methods) {
  const record = buildCanonicalMethodRecord(def, routesByFunctionName.get(def.meta.functionName));
  canonicalMethodRecords.push(record);
  methodsMap[def.meta.functionName] = `/docs/reference/client/client#${record.anchor}`;
}

writeFileIfChanged(path.join(docsDir, 'methods-map.json'), `${JSON.stringify(methodsMap, null, 2)}\n`);
writeFileIfChanged(recordsPath, `${JSON.stringify(canonicalMethodRecords, null, 2)}\n`);

const interfacesContent = buildAllParamsInterfaces(methods);
writeFileIfChanged(path.join(docsDir, 'generated-method-params.ts'), interfacesContent);

console.log(`Successfully generated Client API reference docs: ${methods.length} methods across ${namespaces.length} namespaces, internals pages, licensed-methods page, flat index, methods map, and parameter interfaces`);

const modelPages = Object.entries(namedSchemas).map(([name, schema]) => {
  const def = schema._zod.def as any;
  const related = Object.entries(typeLinks(describeType(schema, true))).filter(([n]) => n !== name).map(([n, url]) => `[${n}](${url})`).join(', ');
  const lines = [`## ${name}`, '', schema.description ?? '', '', '<details>', '<summary>Type declaration</summary>', '', '```ts', `type ${name} = ${describeType(schema, true)}`, '```', '', '</details>', '', related ? `Related types: ${related}` : '', ''];
  if (def.type === 'object') {
    lines.push('| Field | Type | Required |', '| --- | --- | --- |');
    for (const [field, value] of Object.entries(def.shape)) {
      const item = value as z.ZodType;
      const type = describeType(item).replace(/ \| undefined$/, '');
      const links = Object.entries(typeLinks(type)).map(([n, url]) => `[${n}](${url})`).join(', ');
      lines.push(`| \`${field}\` | \`${escapeTableCell(type)}\`${links ? ` — ${links}` : ''} | ${item.isOptional() ? 'No' : 'Yes'} |`);
    }
    lines.push('', 'Additional provider fields may be present; narrow them before use.');
  }
  return lines.join('\n');
});
writeFileIfChanged(path.join(docsDir, 'return-types.mdx'), [
  buildFrontmatter('Return types', 'Named data models used by client method results.', 'Braces'),
  '', '# Return types', '',
  'These are TypeScript data shapes, not class instances. Follow a type from a method to inspect its fields. `unknown` marks a provider-controlled value that needs narrowing; it does not promise an undocumented shape.',
  '', ...modelPages,
].join('\n') + '\n');
