import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { clientRegistry, getParameterMetadata } from '../src/registry';

import '../src/methods';

/**
 * Generates the typed surface of a client that calls the Easy API remotely
 * (for example `@open-wa/socket-client`).
 *
 * The Easy API routes every call through the method registry: it validates the
 * named input against the method's schema and then calls the Client method with
 * the arguments in `parameterOrder`. The signatures written here come from the
 * same registry entries, so a remote call is typed with exactly what the API
 * accepts, both as named parameters and as positional arguments.
 */

const generatedDir = path.join(fileURLToPath(new URL('.', import.meta.url)), '../src/generated');
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}

type MethodDefinition = ReturnType<typeof clientRegistry.getAll>[number];

const RESERVED_WORDS = new Set([
  'arguments', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default',
  'delete', 'do', 'else', 'enum', 'eval', 'export', 'extends', 'false', 'finally', 'for', 'function',
  'if', 'implements', 'import', 'in', 'instanceof', 'interface', 'let', 'new', 'null', 'package',
  'private', 'protected', 'public', 'return', 'static', 'super', 'switch', 'this', 'throw', 'true',
  'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
]);

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function sortStrings(values: string[]) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function parameterName(key: string) {
  const identifier = /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : key.replace(/[^A-Za-z0-9_$]/g, '_');
  return RESERVED_WORDS.has(identifier) ? `${identifier}_` : identifier;
}

/** A key the input type marks optional: `.optional()` or `.default()`. */
function acceptsOmission(schema: unknown): boolean {
  const optin = (schema as { _zod?: { optin?: string } })._zod?.optin;
  return optin === 'optional' || optin === 'defaulted';
}

const SCALAR_TYPES = new Set(['string', 'number', 'boolean', 'bigint', 'enum', 'literal', 'array', 'tuple', 'date', 'template_literal', 'nan', 'null', 'undefined', 'void']);

/**
 * Whether a parameter can be given a plain object. A remote client needs this
 * to tell `method({ ...named })` from `method(objectArgument)`.
 */
function mayBeObject(schema: unknown, depth = 0): boolean {
  const def = (schema as { _zod?: { def?: Record<string, unknown> } })._zod?.def;
  if (!def || depth > 8) return true;
  const type = String(def.type);
  if (SCALAR_TYPES.has(type)) return false;
  if (type === 'union') return (def.options as unknown[]).some((option) => mayBeObject(option, depth + 1));
  if (type === 'pipe') return mayBeObject(def.in, depth + 1);
  if (def.innerType) return mayBeObject(def.innerType, depth + 1);
  return true;
}

function docComment(lines: string[]) {
  const body = lines
    .flatMap((line) => line.split('\n'))
    .map((line) => `   * ${line.replace(/\*\//g, '*\\/')}`.trimEnd())
    .join('\n');
  return `  /**\n${body}\n   */\n`;
}

function flatAliases(def: MethodDefinition) {
  return sortStrings((def.meta.allAliases ?? []).filter((alias) => !alias.includes('.')));
}

function signatures(name: string, def: MethodDefinition, doc: string[]) {
  const typeName = capitalize(def.meta.functionName);
  const input = `T.${typeName}Input`;
  const output = `Promise<T.${typeName}Output>`;
  const order = def.meta.parameterOrder;
  const shape = def.meta.inputSchema.shape as Record<string, unknown>;
  const comment = docComment(doc);

  if (order.length === 0) {
    return `${comment}  ${name}(): ${output};\n`;
  }

  const omittable = order.map((key) => acceptsOmission(shape[key]));
  // A positional argument can only be left out when every argument after it can be too.
  const positional = order.map((key, index) => {
    const optional = omittable.slice(index).every(Boolean);
    return `${parameterName(key)}${optional ? '?' : ''}: ${input}[${JSON.stringify(key)}]`;
  });
  const named = `params${omittable.every(Boolean) ? '?' : ''}: ${input}`;

  // The positional overload is last so `Parameters<RemoteClientMethods[...]>` resolves to it.
  return `${comment}  ${name}(${named}): ${output};\n${comment}  ${name}(${positional.join(', ')}): ${output};\n`;
}

const methods = clientRegistry.getAll();

let methodsBody = '';
let inputsBody = '';
let outputsBody = '';
const parameters: Record<string, string[]> = {};
const namedKeys: Record<string, string[]> = {};
const objectFirst: string[] = [];

for (const def of methods) {
  const name = def.meta.functionName;
  const typeName = capitalize(name);
  const description = def.meta.description || name;
  const aliases = flatAliases(def);
  const deprecated = new Set(def.meta.deprecatedAliases ?? []);
  const keyAliases = Object.keys(buildAliasKeys(def));

  methodsBody += signatures(name, def, [description, ...(aliases.length > 0 ? [`@aliases ${aliases.join(', ')}`] : [])]);
  inputsBody += `  ${name}: T.${typeName}Input;\n`;
  outputsBody += `  ${name}: T.${typeName}Output;\n`;
  const firstKey = def.meta.parameterOrder[0];
  const takesObjectFirst = firstKey !== undefined && mayBeObject((def.meta.inputSchema.shape as Record<string, unknown>)[firstKey]);
  parameters[name] = def.meta.parameterOrder;
  if (keyAliases.length > 0) namedKeys[name] = keyAliases;
  if (takesObjectFirst) objectFirst.push(name);

  for (const alias of aliases) {
    const doc = deprecated.has(alias)
      ? [`@deprecated Use ${name} instead.`, `Deprecated alias of ${name}.`]
      : [`Alias of ${name}.`, '', description];
    methodsBody += signatures(alias, def, doc);
    inputsBody += `  ${alias}: T.${typeName}Input;\n`;
    outputsBody += `  ${alias}: T.${typeName}Output;\n`;
    parameters[alias] = def.meta.parameterOrder;
    if (keyAliases.length > 0) namedKeys[alias] = keyAliases;
    if (takesObjectFirst) objectFirst.push(alias);
  }
}

function buildAliasKeys(def: MethodDefinition): Record<string, string> {
  const shape = def.meta.inputSchema.shape as Record<string, unknown>;
  const aliases: Record<string, string> = {};
  for (const [key, schema] of Object.entries(shape)) {
    for (const alias of parameterKeyAliases(schema)) aliases[alias] = key;
  }
  return aliases;
}

function parameterKeyAliases(schema: unknown): string[] {
  const metadata = getParameterMetadata(schema as never);
  return [...(metadata?.keyAliases ?? []), ...(metadata?.deprecatedKeyAliases ?? [])];
}

function compactRecord(record: Record<string, string[]>) {
  const lines = Object.entries(record).map(([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)},`);
  return `{\n${lines.join('\n')}\n}`;
}

const header = `/* eslint-disable */
/**
 * This file was automatically generated by packages/schema/scripts/gen-remote-client.ts
 * Do not edit this file manually.
 */
`;

const remoteClientOutput = `${header}import type * as T from './types';

/** The named parameters each Easy API method accepts. */
export interface RemoteMethodInputs {
${inputsBody}}

/** What each Easy API method resolves to. */
export interface RemoteMethodOutputs {
${outputsBody}}

export type RemoteMethodName = keyof RemoteMethodInputs;

/**
 * The Easy API methods as a remote client calls them. Every method takes either
 * one object of named parameters or the same values as positional arguments.
 */
export interface RemoteClientMethods {
${methodsBody}}
`;

const methodParametersOutput = `${header}
/** Positional parameter names for every Easy API method and flat alias. */
export const methodParameters: Readonly<Record<string, readonly string[]>> = ${compactRecord(parameters)};

/** Extra key names a method accepts for its named parameters. */
export const methodParameterAliases: Readonly<Record<string, readonly string[]>> = ${compactRecord(namedKeys)};

/** Methods whose first positional argument can itself be a plain object. */
export const methodsWithObjectFirstParameter: readonly string[] = ${JSON.stringify(objectFirst)};
`;

fs.writeFileSync(path.join(generatedDir, 'RemoteClient.ts'), remoteClientOutput);
fs.writeFileSync(path.join(generatedDir, 'methodParameters.ts'), methodParametersOutput);

console.log('Successfully generated RemoteClient.ts and methodParameters.ts');
