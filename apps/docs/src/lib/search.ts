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

export type CanonicalSearchResult = SortedResult<string> & {
  resultKind: SearchResultKind;
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

function resultLexicalScore(queryTerms: string[], result: SortedResult<string>): number {
  const metadata = result as SortedResult<string> & { breadcrumbs?: string[] };
  const breadcrumbs = metadata.breadcrumbs?.join(' ') ?? '';
  return (
    lexicalOverlap(queryTerms, result.content) * 3 +
    lexicalOverlap(queryTerms, breadcrumbs) * 2 +
    lexicalOverlap(queryTerms, result.url)
  );
}

function rankResults(query: string, results: SortedResult<string>[]): SortedResult<string>[] {
  const queryTerms = searchTokens(query);
  return results
    .map((result, index) => ({ result, index, score: resultLexicalScore(queryTerms, result) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ result }) => result);
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
      url: `/docs/reference/client/client#${record.anchor}`,
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

function isGeneratedMethodReference(result: SortedResult<string>): boolean {
  return GENERATED_METHOD_REFERENCE_PATHS.has(result.url.split('#')[0]);
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

function pageContext(result: SortedResult<string>): { pageTitle: string; section?: string } {
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

function dedupePageResults(results: SortedResult<string>[], query: string): CanonicalSearchResult[] {
  const seen = new Set<string>();

  return results.flatMap((result) => {
    const kind: SearchResultKind = isReferenceResult(result) ? 'reference' : 'guide';
    const pageUrl = result.url.split('#')[0];
    const key = `${kind}:${pageUrl}`;
    if (seen.has(key)) return [];
    seen.add(key);
    const context = pageContext(result);

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

  const related = dedupePageResults(
    symbolQuery && partialMethods.length > 0
      ? results.filter((result) => !isReferenceResult(result))
      : rankResults(query, results),
    query,
  );

  if (symbolQuery || searchTokens(query).length === 0) return includeAliasPage([...partialMethods, ...related]);

  const descriptiveMethods = methods
    .map((method) => ({ method, score: methodDescriptionScore(searchTokens(query), method) }))
    .filter(({ score }) => score >= 10)
    .sort((left, right) => right.score - left.score)
    .slice(0, 8)
    .map(({ method }) => methodResult(method, 'related'));

  const methodNames = descriptiveMethods
    .map((method) => normalizeSearchTerm(method.method ?? ''))
    .filter(Boolean);
  const conceptualRelated = dedupePageResults(
    rankResults(
      query,
      results.filter((result) => {
        if (isGeneratedMethodReference(result) && !(aliasIntent && isAliasReference(result))) return false;
        const anchor = normalizeSearchTerm(result.url.split('#')[1] ?? '');
        const content = normalizeSearchTerm(result.content);
        return !methodNames.some((name) => anchor === name || content.includes(name));
      }),
    ),
    query,
  );

  return includeAliasPage([...descriptiveMethods, ...conceptualRelated]);
}

export function isMethodQuery(value: string): boolean {
  return METHOD_QUERY.test(value.trim());
}
