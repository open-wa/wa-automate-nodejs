'use client';
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type SyntheticEvent,
  use,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Loader2, MessageCircleIcon, RefreshCw, SearchIcon, Send, X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { buttonVariants } from '../ui/button';
import { useChat, type UseChatHelpers } from '@ai-sdk/react';
import { DefaultChatTransport, type Tool, type UIToolInvocation } from 'ai';
import { Markdown } from '../markdown';
import { Presence } from '@radix-ui/react-presence';
import { useSearchContext } from 'fumadocs-ui/contexts/search';
import type { ChatUIMessage, SearchTool } from '../../routes/api.chat';

const Context = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  available: boolean | null;
  retryAvailability: () => void;
  chat: UseChatHelpers<ChatUIMessage>;
} | null>(null);

export function AISearchPanelHeader({ className, ...props }: ComponentProps<'div'>) {
  const { setOpen } = useAISearchContext();

  return (
    <div
      className={cn(
        'sticky top-0 flex items-start gap-2 rounded-2xl border-backstitch bg-secondary text-secondary-foreground shadow-sm',
        className,
      )}
      {...props}
    >
      <div className="flex-1 px-3 py-3">
        <p className="mb-1 text-sm font-bold text-foreground">Ask open-wa docs</p>
        <p className="text-xs text-secondary-foreground/80">
          AI can be inaccurate, please verify the answers.
        </p>
      </div>

      <button
        aria-label="Close"
        className={cn(
          buttonVariants({
            size: 'icon-sm',
            color: 'ghost',
            className: 'min-h-10 min-w-10 rounded-full text-secondary-foreground',
          }),
        )}
        onClick={() => setOpen(false)}
      >
        <X />
      </button>
    </div>
  );
}

export function AISearchInputActions() {
  const { messages, status, setMessages, regenerate, error } = useChatContext();
  const isLoading = status === 'streaming';

  if (messages.length === 0) return null;

  return (
    <>
      {!isLoading && messages.at(-1)?.role === 'assistant' && (
        <button
          type="button"
          className={cn(
            buttonVariants({
              color: 'secondary',
              size: 'sm',
              className: 'min-h-9 rounded-full gap-1.5',
            }),
          )}
          onClick={() => regenerate()}
        >
          <RefreshCw className="size-4" />
          Retry
        </button>
      )}
      {error && !isLoading && (
        <button
          type="button"
          className={cn(buttonVariants({ color: 'secondary', size: 'sm', className: 'min-h-9 rounded-full gap-1.5' }))}
          onClick={() => regenerate()}
        >
          <RefreshCw className="size-4" />
          Try again
        </button>
      )}
      <button
        type="button"
        className={cn(
          buttonVariants({
            color: 'secondary',
            size: 'sm',
            className: 'min-h-9 rounded-full',
          }),
        )}
        onClick={() => setMessages([])}
      >
        Clear Chat
      </button>
    </>
  );
}

const StorageKeyInput = '__ai_search_input';
export function AISearchInput(props: ComponentProps<'form'>) {
  const { status, sendMessage, stop } = useChatContext();
  const [input, setInput] = useState(() => localStorage.getItem(StorageKeyInput) ?? '');
  const isLoading = status === 'streaming' || status === 'submitted';
  const onStart = (e?: SyntheticEvent) => {
    e?.preventDefault();
    const message = input.trim();
    if (message.length === 0) return;

    void sendMessage({
      role: 'user',
      parts: [
        {
          type: 'data-client',
          data: {
            location: location.href,
          },
        },
        {
          type: 'text',
          text: message,
        },
      ],
    });
    setInput('');
    localStorage.removeItem(StorageKeyInput);
  };

  useEffect(() => {
    if (isLoading) document.getElementById('nd-ai-input')?.focus();
  }, [isLoading]);

  return (
    <form
      {...props}
      className={cn('flex items-start gap-2 pe-2 max-sm:flex-col max-sm:p-1', props.className)}
      onSubmit={onStart}
    >
      <Input
        value={input}
        placeholder={isLoading ? 'AI is answering...' : 'Ask a question'}
        autoFocus
        className="min-h-14 p-3"
        disabled={status === 'streaming' || status === 'submitted'}
        onChange={(e) => {
          setInput(e.target.value);
          localStorage.setItem(StorageKeyInput, e.target.value);
        }}
        onKeyDown={(event) => {
          if (!event.shiftKey && event.key === 'Enter') {
            onStart(event);
          }
        }}
      />
      {isLoading ? (
        <button
          key="bn"
          type="button"
          className={cn(
            buttonVariants({
              color: 'secondary',
              className: 'min-h-11 transition-all rounded-full mt-2 gap-2 max-sm:w-full',
            }),
          )}
          onClick={stop}
        >
          <Loader2 className="size-4 animate-spin text-secondary-foreground" />
          Abort Answer
        </button>
      ) : (
        <button
          key="bn"
          type="submit"
          className={cn(
            buttonVariants({
              color: 'primary',
              className: 'min-h-11 transition-all rounded-full mt-2 max-sm:w-full',
            }),
          )}
          disabled={input.length === 0}
        >
          <Send className="size-4" />
        </button>
      )}
    </form>
  );
}

function List(props: Omit<ComponentProps<'div'>, 'dir'>) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    function callback() {
      const container = containerRef.current;
      if (!container) return;

      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'instant',
      });
    }

    const observer = new ResizeObserver(callback);
    callback();

    const element = containerRef.current?.firstElementChild;

    if (element) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      {...props}
      className={cn('fd-scroll-container overflow-y-auto min-w-0 flex flex-col', props.className)}
    >
      {props.children}
    </div>
  );
}

function Input(props: ComponentProps<'textarea'>) {
  const ref = useRef<HTMLDivElement>(null);
  const shared = cn('col-start-1 row-start-1', props.className);

  return (
    <div className="grid min-w-0 flex-1 max-sm:w-full">
      <textarea
        id="nd-ai-input"
        {...props}
        className={cn(
          'resize-none bg-transparent placeholder:text-muted-foreground focus-visible:outline-none',
          shared,
        )}
      />
      <div ref={ref} className={cn(shared, 'break-all invisible')}>
        {`${props.value?.toString() ?? ''}\n`}
      </div>
    </div>
  );
}

const roleName: Record<string, string> = {
  user: 'you',
  assistant: 'open-wa ai',
};

function Message({ message, ...props }: { message: ChatUIMessage } & ComponentProps<'div'>) {
  let markdown = '';
  const searchCalls: UIToolInvocation<SearchTool>[] = [];

  for (const part of message.parts ?? []) {
    if (part.type === 'text') {
      markdown += part.text;
      continue;
    }

    if (part.type.startsWith('tool-')) {
      const toolName = part.type.slice('tool-'.length);
      const p = part as UIToolInvocation<Tool>;

      if (toolName !== 'search' || !p.toolCallId) continue;
      searchCalls.push(p);
    }
  }

  return (
    <div onClick={(e) => e.stopPropagation()} {...props}>
      <p
        className={cn(
          'mb-1 text-sm font-bold text-muted-foreground',
          message.role === 'assistant' && 'text-primary',
        )}
      >
        {roleName[message.role] ?? 'unknown'}
      </p>
      <div className="prose text-sm">
        <Markdown text={markdown} />
      </div>

      {searchCalls.map((call) => {
        return (
          <div
            key={call.toolCallId}
            className="mt-3 flex flex-row items-center gap-2 rounded-xl border border-border bg-muted p-2 text-xs text-muted-foreground"
          >
            <SearchIcon className="size-4" />
            {call.state === 'output-error' || call.state === 'output-denied' ? (
              <p className="text-destructive">{call.errorText ?? 'Failed to search'}</p>
            ) : (
              <p>{!call.output ? 'Searching...' : `${call.output.length} search results`}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function AISearch({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [availabilityRetry, setAvailabilityRetry] = useState(0);
  const chat = useChat<ChatUIMessage>({
    id: 'search',
    transport: new DefaultChatTransport({
      api: '/api/chat',
    }),
  });

  useEffect(() => {
    let active = true;
    setAvailable(null);
    void fetch('/api/chat', { method: 'GET', cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Availability check failed');
        const body: unknown = await response.json();
        if (!body || typeof body !== 'object' || !('available' in body) || typeof body.available !== 'boolean') {
          throw new Error('Availability response was invalid');
        }
        if (active) setAvailable(body.available);
      })
      .catch(() => {
        if (active) setAvailable(false);
      });
    return () => {
      active = false;
    };
  }, [availabilityRetry]);

  const retryAvailability = useCallback(() => setAvailabilityRetry((value) => value + 1), []);

  return (
    <Context value={useMemo(() => ({ chat, open, setOpen, available, retryAvailability }), [chat, open, available, retryAvailability])}>{children}</Context>
  );
}

export function AISearchTrigger({
  position = 'default',
  className,
  ...props
}: ComponentProps<'button'> & { position?: 'default' | 'float' }) {
  const { open, setOpen } = useAISearchContext();

  return (
    <button
      data-state={open ? 'open' : 'closed'}
      className={cn(
        position === 'float' && [
          'fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] gap-3 w-28 inset-e-[calc(--spacing(4)+var(--removed-body-scroll-bar-size,0px))] shadow-stipple z-20 transition-[translate,opacity]',
          'max-sm:w-auto max-sm:min-w-28 max-sm:justify-center max-sm:px-4',
          open && 'translate-y-10 opacity-0',
        ],
        className,
      )}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {props.children}
    </button>
  );
}

export function AISearchPanel() {
  const { open, setOpen, available } = useAISearchContext();
  useHotKey();

  return (
    <>
      <style>
        {`
        @keyframes ask-ai-open {
          from {
            translate: 100% 0;
          }
          to {
            translate: 0 0;
          }
        }
        @keyframes ask-ai-close {
          from {
            width: var(--ai-chat-width);
          }
          to {
            width: 0px;
          }
        }`}
      </style>
      <Presence present={open}>
        <div
          data-state={open ? 'open' : 'closed'}
          className="fixed inset-0 z-30 bg-foreground/35 data-[state=open]:animate-fd-fade-in data-[state=closed]:animate-fd-fade-out lg:hidden"
          onClick={() => setOpen(false)}
        />
      </Presence>
      <Presence present={open}>
        <div
          className={cn(
            'overflow-hidden z-30 bg-card text-card-foreground [--ai-chat-width:400px] 2xl:[--ai-chat-width:460px]',
            'max-lg:fixed max-lg:inset-x-3 max-lg:bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] max-lg:top-[calc(env(safe-area-inset-top)+0.75rem)] max-lg:border-backstitch max-lg:rounded-3xl max-lg:shadow-stipple',
            'lg:sticky lg:top-0 lg:h-dvh lg:border-s lg:ms-auto lg:in-[#nd-docs-layout]:[grid-area:toc] lg:in-[#nd-notebook-layout]:row-span-full lg:in-[#nd-notebook-layout]:col-start-5',
            open
              ? 'animate-fd-dialog-in lg:animate-[ask-ai-open_200ms]'
              : 'animate-fd-dialog-out lg:animate-[ask-ai-close_200ms]',
          )}
        >
          <div className="flex size-full flex-col p-2 safe-bottom-pad lg:p-3 lg:w-(--ai-chat-width)">
            <AISearchPanelHeader />
            <AISearchPanelList className="flex-1" />
            {available && (
              <div className="rounded-2xl border-backstitch bg-card text-card-foreground shadow-sm">
                <AISearchInput />
                <div className="flex flex-wrap items-center gap-1.5 p-2 empty:hidden">
                  <AISearchInputActions />
                </div>
              </div>
            )}
          </div>
        </div>
      </Presence>
    </>
  );
}

export function AISearchPanelList({ className, style, ...props }: ComponentProps<'div'>) {
  const chat = useChatContext();
  const messages = chat.messages.filter((msg) => msg.role !== 'system');
  const { setOpen, available, retryAvailability } = useAISearchContext();
  const { setOpenSearch } = useSearchContext();

  return (
    <List
      className={cn('py-4 overscroll-contain', className)}
      style={{
        maskImage:
          'linear-gradient(to bottom, transparent, white 1rem, white calc(100% - 1rem), transparent 100%)',
        ...style,
      }}
      {...props}
    >
      {available === null ? (
        <div role="status" className="mx-3 rounded-xl border border-border bg-muted p-3 text-sm text-muted-foreground">
          Checking Ask AI availability…
        </div>
      ) : available === false || chat.error ? (
        <div className="mx-3 rounded-xl border border-border bg-muted p-3 text-foreground">
          <p className="mb-1 text-xs font-semibold text-muted-foreground">Ask AI unavailable</p>
          <p className="text-sm">
            Ask AI is unavailable right now. Use docs search or the quick start guide instead.
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
            {available === false && (
              <button
                type="button"
                className="rounded-md border border-border px-2 py-1 hover:bg-secondary"
                onClick={retryAvailability}
              >
                Try again
              </button>
            )}
            {available && chat.error && (
              <button
                type="button"
                className="rounded-md border border-border px-2 py-1 hover:bg-secondary"
                onClick={() => chat.regenerate()}
              >
                Retry answer
              </button>
            )}
            <button
              type="button"
              className="rounded-md border border-border px-2 py-1 hover:bg-secondary"
              onClick={() => {
                setOpen(false);
                setOpenSearch(true);
              }}
            >
              Open search
            </button>
            <a
              className="rounded-md border border-border px-2 py-1 hover:bg-secondary"
              href="/docs/getting-started/quickstart"
              onClick={() => setOpen(false)}
            >
              Open quick start
            </a>
            <a
              className="rounded-md border border-border px-2 py-1 hover:bg-secondary"
              href="/docs"
              onClick={() => setOpen(false)}
            >
              Browse docs
            </a>
          </div>
        </div>
      ) : messages.length === 0 ? (
        <div className="flex size-full flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-muted p-6 text-center text-sm text-muted-foreground">
          <MessageCircleIcon fill="currentColor" stroke="none" />
          <p onClick={(e) => e.stopPropagation()}>Ask about the current docs page or a runtime workflow.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 px-3">
          {messages.map((item) => (
            <Message key={item.id} message={item} />
          ))}
        </div>
      )}
    </List>
  );
}

export function useHotKey() {
  const { open, setOpen } = useAISearchContext();

  const onKeyPress = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      setOpen(false);
      e.preventDefault();
    }

    if (e.key === '/' && (e.metaKey || e.ctrlKey) && !open) {
      setOpen(true);
      e.preventDefault();
    }
  });

  useEffect(() => {
    window.addEventListener('keydown', onKeyPress);
    return () => window.removeEventListener('keydown', onKeyPress);
  }, []);
}

export function useAISearchContext() {
  return use(Context)!;
}

function useChatContext() {
  return use(Context)!.chat;
}
