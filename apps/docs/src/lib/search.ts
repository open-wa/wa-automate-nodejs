import type { SortedResult } from 'fumadocs-core/search';

export type SearchMatch = 'exact' | 'alias' | 'partial' | 'related';
export type SearchResultKind = 'method' | 'guide' | 'reference';

export type CanonicalMethod = {
  name: string;
  url: string;
  summary: string;
  signature: string;
  aliases: string[];
  version: string;
};

/** What the search index knows about each docs page, keyed by page URL. */
export type SearchPageInfo = {
  title: string;
  /** The top-level sidebar group, such as "Getting started" or "API reference". */
  category?: string;
  /** Every sidebar folder on the way to the page, joined with " / ". */
  section?: string;
};

export type SearchPages = ReadonlyMap<string, SearchPageInfo>;

export type CanonicalSearchResult = SortedResult<string> & {
  resultKind: SearchResultKind;
  category?: string;
  match?: SearchMatch;
  method?: string;
  summary?: string;
  signature?: string;
  aliases?: string[];
  version?: string;
  matchedAlias?: string;
  pageTitle?: string;
  section?: string;
};

export type MethodRecord = {
  name: string;
  namespace: string;
  anchor: string;
  description?: string;
  aliases?: string[];
  parameterOrder?: string[];
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
  }>;
  returnType?: string;
};

const METHOD_QUERY = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/i;
// A query that looks like a method name: `sendText` or `client.sendText`, not `webhook`.
const CAMEL_CASE_QUERY = /^(?:[a-z][a-z0-9]*\.)?[a-z][a-z0-9]*[A-Z][A-Za-z0-9]*$/;
// Package README mirrors. They match many words but rarely answer the question.
const LOW_PRIORITY_PREFIXES = ['/docs/reference/workspaces'];
const GENERATED_METHOD_REFERENCE_PATHS = new Set([
  '/docs/reference/client/aliases',
  '/docs/reference/client/base-client',
  '/docs/reference/client/business',
  '/docs/reference/client/chatids',
  '/docs/reference/client/chats',
  '/docs/reference/client/client',
  '/docs/reference/client/communities',
  '/docs/reference/client/contacts',
  '/docs/reference/client/groups',
  '/docs/reference/client/index',
  '/docs/reference/client/labels',
  '/docs/reference/client/licensed-methods',
  '/docs/reference/client/media',
  '/docs/reference/client/messages',
  '/docs/reference/client/mystatus',
  '/docs/reference/client/namespaced-client',
  '/docs/reference/client/session',
  '/docs/reference/client/status',
]);
const SEARCH_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'can',
  'do',
  'for',
  'from',
  'how',
  'i',
  'in',
  'is',
  'it',
  'me',
  'my',
  'of',
  'on',
  'please',
  'that',
  'the',
  'this',
  'to',
  'use',
  'using',
  'what',
  'with',
  'you',
  'your',
]);

export function normalizeSearchTerm(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, '');
}

function lexicalToken(value: string): string {
  if (value.length > 5 && value.endsWith('ing')) return value.slice(0, -3);
  if (value.length > 5 && value.endsWith('ed')) return value.slice(0, -2);
  if (value.length > 4 && value.endsWith('s') && !value.endsWith('ss')) return value.slice(0, -1);
  return value;
}

function searchTokens(value: string): string[] {
  return (value.toLocaleLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter((token) => !SEARCH_STOP_WORDS.has(token))
    .map(lexicalToken);
}

function lexicalOverlap(queryTerms: string[], value: string): number {
  const valueTerms = new Set(searchTokens(value));
  return queryTerms.reduce((score, term) => score + (valueTerms.has(term) ? 1 : 0), 0);
}

function methodDescriptionScore(queryTerms: string[], method: CanonicalMethod): number {
  const summaryScore = lexicalOverlap(queryTerms, method.summary);
  const nameScore = lexicalOverlap(queryTerms, method.name);
  const aliasScore = lexicalOverlap(queryTerms, method.aliases.join(' '));
  return summaryScore * 4 + nameScore * 2 + aliasScore;
}

function pageUrlOf(result: SortedResult<string>): string {
  return result.url.split('#')[0];
}

function isLowPriority(result: SortedResult<string>): boolean {
  const url = pageUrlOf(result);
  return LOW_PRIORITY_PREFIXES.some((prefix) => url === prefix || url.startsWith(`${prefix}/`));
}

function resultLexicalScore(
  query: string,
  queryTerms: string[],
  result: SortedResult<string>,
  pages: SearchPages,
): number {
  const title = pages.get(pageUrlOf(result))?.title ?? '';
  const content = typeof result.content === 'string' ? result.content : '';
  const titleOverlap = lexicalOverlap(queryTerms, title);
  const phrase = query.trim().toLocaleLowerCase();
  // A page whose title (its H1) matches every term is almost always the answer.
  const titleScore =
    titleOverlap * 6 +
    (queryTerms.length > 0 && titleOverlap === queryTerms.length ? 8 : 0) +
    (phrase.length > 2 && title.toLocaleLowerCase().includes(phrase) ? 6 : 0);
  // Headings are the page's own H2/H3s; plain text matches count for less.
  const contentWeight = result.type === 'text' ? 2 : 4;
  const score =
    titleScore +
    lexicalOverlap(queryTerms, content) * contentWeight +
    (result.type === 'page' && titleOverlap > 0 ? 4 : 0) +
    lexicalOverlap(queryTerms, result.url);
  return isLowPriority(result) ? score - 1000 : score;
}

function rankResults(query: string, results: SortedResult<string>[], pages: SearchPages): SortedResult<string>[] {
  const queryTerms = searchTokens(query);
  return results
    .map((result, index) => ({ result, index, score: resultLexicalScore(query, queryTerms, result, pages) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ result }) => result);
}

/** Matches `slugForNamespace` in packages/schema/scripts/gen-client-reference-docs.ts. */
function namespaceSlug(namespace: string): string {
  return namespace.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
}

/**
 * A method's block on its namespace page, built the way the reference
 * generator builds it, from the namespace each method record carries.
 */
export function methodReferenceUrl(record: Pick<MethodRecord, 'namespace' | 'anchor'>): string {
  return `/docs/reference/client/${namespaceSlug(record.namespace || 'core')}#${record.anchor}`;
}

export function createCanonicalMethods(
  records: ReadonlyArray<MethodRecord>,
  version: string,
): CanonicalMethod[] {
  return records.map((record) => {
    const parameterByName = new Map((record.parameters ?? []).map((parameter) => [parameter.name, parameter]));
    const parameterNames = record.parameterOrder ?? record.parameters?.map((parameter) => parameter.name) ?? [];
    const signatureParameters = parameterNames.map((name) => {
      const parameter = parameterByName.get(name);
      if (!parameter) return name;
      return `${name}${parameter.required ? '' : '?'}: ${parameter.type}`;
    });
    const returnType = record.returnType ? `Promise<${record.returnType}>` : 'Promise<unknown>';

    return {
      name: record.name,
      url: methodReferenceUrl(record),
      summary: record.description || `Reference for the ${record.name} client method.`,
      signature: `client.${record.name}(${signatureParameters.join(', ')}): ${returnType}`,
      aliases: record.aliases ?? [],
      version,
    };
  });
}

function methodResult(method: CanonicalMethod, match: SearchMatch, matchedAlias?: string) {
  return {
    id: `method:${method.name}`,
    type: 'heading' as const,
    content: method.name,
    url: method.url,
    resultKind: 'method' as const,
    match,
    method: method.name,
    summary: method.summary,
    signature: method.signature,
    aliases: method.aliases,
    version: method.version,
    ...(matchedAlias ? { matchedAlias } : {}),
  } satisfies CanonicalSearchResult;
}

function isReferenceResult(result: SortedResult<string>): boolean {
  return result.url.startsWith('/docs/reference/');
}

function isGeneratedMethodReference(result: SortedResult<string>, methodPages: ReadonlySet<string>): boolean {
  const url = pageUrlOf(result);
  return GENERATED_METHOD_REFERENCE_PATHS.has(url) || methodPages.has(url);
}

function isAliasReference(result: SortedResult<string>): boolean {
  return result.url.split('#')[0] === '/docs/reference/client/aliases';
}

function compactResultContent(content: string, query: string): string {
  const plain = content.replace(/\s+/g, ' ').trim();
  if (plain.length <= 360) return plain;

  const terms = query
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 2);
  const lower = plain.toLocaleLowerCase();
  const index = terms.map((term) => lower.indexOf(term)).find((value) => value >= 0) ?? 0;
  const start = Math.max(0, index - 100);
  const end = Math.min(plain.length, start + 360);
  return `${start > 0 ? '…' : ''}${plain.slice(start, end)}${end < plain.length ? '…' : ''}`;
}

function titleFromSegment(segment: string | undefined): string {
  if (!segment) return 'Documentation';

  return segment
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toLocaleUpperCase());
}

function titleFromPath(url: string): string {
  return titleFromSegment(url.split('/').filter(Boolean).at(-1)?.split('#')[0]);
}

function pageContext(
  result: SortedResult<string>,
  pages: SearchPages,
): { pageTitle: string; section?: string; category?: string } {
  const info = pages.get(pageUrlOf(result));
  if (info) return { pageTitle: info.title, section: info.section, category: info.category };

  const breadcrumbs = (result.breadcrumbs ?? []).filter(
    (breadcrumb): breadcrumb is string => typeof breadcrumb === 'string' && breadcrumb.trim().length > 0,
  );
  const pageTitle = breadcrumbs.at(-1) ?? titleFromPath(result.url);
  const pathSegments = result.url
    .split('/')
    .filter(Boolean)
    .slice(1, -1)
    .map((segment) => titleFromSegment(segment.split('#')[0]));
  const section =
    breadcrumbs.length > 1
      ? breadcrumbs.slice(0, -1).join(' / ')
      : pathSegments.length > 0
        ? pathSegments.join(' / ')
        : undefined;
  return { pageTitle, section };
}

function dedupePageResults(
  results: SortedResult<string>[],
  query: string,
  pages: SearchPages,
): CanonicalSearchResult[] {
  const seen = new Set<string>();

  return results.flatMap((result) => {
    const kind: SearchResultKind = isReferenceResult(result) ? 'reference' : 'guide';
    const pageUrl = pageUrlOf(result);
    const key = `${kind}:${pageUrl}`;
    if (seen.has(key)) return [];
    seen.add(key);
    const context = pageContext(result, pages);

    return [
      {
        ...result,
        id: `page:${key}`,
        content: compactResultContent(result.content, query),
        resultKind: kind,
        match: 'related' as const,
        ...context,
      },
    ];
  });
}

export function searchCanonical(
  query: string,
  methods: CanonicalMethod[],
  results: SortedResult<string>[],
  pages: SearchPages = new Map(),
): CanonicalSearchResult[] {
  const normalizedQuery = normalizeSearchTerm(query);
  if (!normalizedQuery) return [];

  const aliasIntent = /\balias(?:es)?\b/i.test(query);
  const methodQuery = normalizeSearchTerm(query.replace(/\balias(?:es)?\b/gi, ' ')) || normalizedQuery;
  const aliasPage: CanonicalSearchResult = {
    id: 'page:reference:/docs/reference/client/aliases',
    type: 'heading',
    content: 'See the canonical client method names and their verified aliases.',
    url: '/docs/reference/client/aliases',
    resultKind: 'reference',
    match: 'related',
    pageTitle: 'Aliases',
    section: 'Client API reference',
  };
  const includeAliasPage = (items: CanonicalSearchResult[]) =>
    aliasIntent ? [...items, aliasPage] : items;

  const exactMethod = methods.find((method) => normalizeSearchTerm(method.name) === methodQuery);
  if (exactMethod) return includeAliasPage([methodResult(exactMethod, 'exact')]);

  const aliasMatch = methods
    .map((method) => ({ method, alias: method.aliases.find((alias) => normalizeSearchTerm(alias) === methodQuery) }))
    .find((item) => item.alias);
  if (aliasMatch?.alias) return includeAliasPage([methodResult(aliasMatch.method, 'alias', aliasMatch.alias)]);

  const symbolQuery = METHOD_QUERY.test(query.trim()) || (aliasIntent && METHOD_QUERY.test(query.replace(/\balias(?:es)?\b/gi, ' ').trim()));
  const partialMethods = symbolQuery
    ? methods
        .filter((method) => {
          const names = [method.name, ...method.aliases].map(normalizeSearchTerm);
          return names.some((name) => name.includes(methodQuery));
        })
        .slice(0, 8)
        .map((method) => methodResult(method, 'partial'))
    : [];

  const methodShaped = isCamelCaseQuery(query.replace(/\balias(?:es)?\b/gi, ' '));
  const related = dedupePageResults(
    rankResults(
      query,
      methodShaped && partialMethods.length > 0 ? results.filter((result) => !isReferenceResult(result)) : results,
      pages,
    ),
    query,
    pages,
  );

  // `sendTex` wants methods first; a plain word such as `webhook` wants guides first.
  if (methodShaped) return includeAliasPage([...partialMethods, ...related]);
  if (symbolQuery || searchTokens(query).length === 0) {
    return includeAliasPage([...related.slice(0, 5), ...partialMethods, ...related.slice(5)]);
  }

  const descriptiveMethods = methods
    .map((method) => ({ method, score: methodDescriptionScore(searchTokens(query), method) }))
    .filter(({ score }) => score >= 10)
    .sort((left, right) => right.score - left.score)
    .slice(0, 8)
    .map(({ method }) => methodResult(method, 'related'));

  const methodPages = new Set(methods.map((method) => method.url.split('#')[0]));
  const methodNames = descriptiveMethods
    .map((method) => normalizeSearchTerm(method.method ?? ''))
    .filter(Boolean);
  const conceptualRelated = dedupePageResults(
    rankResults(
      query,
      results.filter((result) => {
        if (isGeneratedMethodReference(result, methodPages) && !(aliasIntent && isAliasReference(result))) return false;
        const anchor = normalizeSearchTerm(result.url.split('#')[1] ?? '');
        const content = normalizeSearchTerm(result.content);
        return !methodNames.some((name) => anchor === name || content.includes(name));
      }),
      pages,
    ),
    query,
    pages,
  );

  return includeAliasPage([...descriptiveMethods, ...conceptualRelated]);
}

export function isMethodQuery(value: string): boolean {
  return METHOD_QUERY.test(value.trim());
}

/** True for queries shaped like a method name, which is when "no exact method" is worth saying. */
export function isCamelCaseQuery(value: string): boolean {
  return CAMEL_CASE_QUERY.test(value.trim());
}
