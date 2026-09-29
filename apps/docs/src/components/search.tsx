'use client';
import {
  SearchDialog,
  SearchDialogClose,
  SearchDialogContent,
  SearchDialogHeader,
  SearchDialogIcon,
  SearchDialogInput,
  SearchDialogList,
  SearchDialogListItem,
  SearchDialogOverlay,
  type SearchItemType,
  type SharedProps,
} from 'fumadocs-ui/components/dialog/search';
import { useDocsSearch } from 'fumadocs-core/search/client';
import { fetchClient } from 'fumadocs-core/search/client/fetch';
import { useI18n } from 'fumadocs-ui/contexts/i18n';
import { useEffect, useMemo, useState } from 'react';
import { Markdown } from './markdown';
import { isMethodQuery, type CanonicalSearchResult } from '@/lib/search';

function ResultItem({ item, onClick }: { item: SearchItemType; onClick: () => void }) {
  if (item.type === 'action') return item.node;

  const result = item as SearchItemType & Partial<CanonicalSearchResult>;
  const content = typeof result.content === 'string' ? result.content : '';
  const method = result.resultKind === 'method';
  const matchLabel =
    result.match === 'alias'
      ? `Alias for ${result.method}`
      : method && (result.match === 'partial' || result.match === 'related')
        ? 'Related method'
        : result.resultKind === 'guide'
          ? 'Guide'
          : result.resultKind === 'reference'
            ? 'Reference'
            : 'Method';

  return (
    <SearchDialogListItem item={item} onClick={onClick}>
      <div className="mb-1 flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-wide text-fd-muted-foreground">
        <span>{matchLabel}</span>
        {result.version && <span>{result.version}</span>}
      </div>
      {method ? (
        <div className="font-mono font-medium">{result.method}</div>
      ) : (
        <>
          <div className="font-medium">{result.pageTitle ?? 'Documentation'}</div>
          {result.section && (
            <div className="mt-0.5 text-xs text-fd-muted-foreground">{result.section}</div>
          )}
          <div className="mt-1 text-sm text-fd-muted-foreground">
            <Markdown text={content} />
          </div>
        </>
      )}
      {method && result.summary && (
        <p className="mt-1 text-xs text-fd-muted-foreground">{result.summary}</p>
      )}
      {method && result.signature && (
        <code className="mt-1 block truncate text-xs text-fd-muted-foreground">
          {result.signature}
        </code>
      )}
      {method && result.matchedAlias && (
        <p className="mt-1 text-xs text-fd-muted-foreground">
          Verified alias: <code>{result.matchedAlias}</code>
        </p>
      )}
      {method && result.aliases && result.aliases.length > 0 && (
        <p className="mt-1 truncate text-xs text-fd-muted-foreground">
          Aliases: {result.aliases.join(', ')}
        </p>
      )}
    </SearchDialogListItem>
  );
}

const SEARCH_TIMEOUT_MS = 8_000;

export default function DefaultSearchDialog(props: SharedProps) {
  const { locale } = useI18n();
  const [retry, setRetry] = useState(0);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const client = useMemo(() => fetchClient({ api: '/api/search', locale }), [locale]);
  const { search, setSearch, query } = useDocsSearch({ client }, [retry]);
  const [settledSearch, setSettledSearch] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => setSettledSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  useEffect(() => {
    setLoadingTimedOut(false);
    if (!query.isLoading || search.trim().length === 0) return;

    const timer = window.setTimeout(() => setLoadingTimedOut(true), SEARCH_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [query.isLoading, retry, search]);

  const rawItems: CanonicalSearchResult[] = Array.isArray(query.data)
    ? (query.data as CanonicalSearchResult[])
    : [];
  const items = query.isLoading || query.error || loadingTimedOut ? [] : rawItems;
  const hasExactMethod = rawItems.some(
    (item) => item.match === 'exact' || item.match === 'alias',
  );
  const hasRelatedMethod = rawItems.some(
    (item) => item.resultKind === 'method' && (item.match === 'partial' || item.match === 'related'),
  );
  const aliasIntent = /\balias(?:es)?\b/i.test(search);
  const noExactMethod =
    !query.isLoading &&
    !query.error &&
    !loadingTimedOut &&
    settledSearch === search &&
    !aliasIntent &&
    isMethodQuery(search) &&
    !hasExactMethod;

  const empty = () => {
    if (loadingTimedOut) {
      return (
        <div role="alert" className="space-y-3 px-4 py-10 text-center text-sm">
          <p className="text-fd-muted-foreground">
            Search is taking longer than expected. Browse the navigation or try again.
          </p>
          <button
            type="button"
            className="rounded-md border px-3 py-1.5 text-xs font-medium"
            onClick={() => setRetry((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      );
    }

    if (query.isLoading || settledSearch !== search) {
      return (
        <div role="status" className="py-10 text-center text-sm text-fd-muted-foreground">
          Loading search results…
        </div>
      );
    }

    if (query.error) {
      return (
        <div role="alert" className="space-y-3 px-4 py-10 text-center text-sm">
          <p className="text-fd-muted-foreground">
            Search is temporarily unavailable. Browse the navigation or try again.
          </p>
          <button
            type="button"
            className="rounded-md border px-3 py-1.5 text-xs font-medium"
            onClick={() => setRetry((value) => value + 1)}
          >
            Try again
          </button>
        </div>
      );
    }

    if (search.trim().length > 0) {
      return (
        <div role="status" className="py-10 text-center text-sm text-fd-muted-foreground">
          No results found. Try a method name, alias, or a plain-language question.
        </div>
      );
    }

    return (
      <div role="status" className="py-10 text-center text-sm text-fd-muted-foreground">
        Search the open-wa guides and API reference.
      </div>
    );
  };

  return (
    <SearchDialog
      search={search}
      onSearchChange={setSearch}
      isLoading={query.isLoading && !loadingTimedOut}
      {...props}
    >
      <SearchDialogOverlay />
      <SearchDialogContent className="font-sans">
        <SearchDialogHeader>
          <SearchDialogIcon />
          <SearchDialogInput />
          <SearchDialogClose />
        </SearchDialogHeader>
        {noExactMethod && (
          <div role="status" className="border-b px-3 py-2 text-xs text-fd-muted-foreground">
            No exact method named <code>{search.trim()}</code> is registered in this release.
            {hasRelatedMethod
              ? ' Related methods are labelled below.'
              : ' Try a related term or browse the guides.'}
          </div>
        )}
        <SearchDialogList items={items} Empty={empty} Item={ResultItem} />
      </SearchDialogContent>
    </SearchDialog>
  );
}
