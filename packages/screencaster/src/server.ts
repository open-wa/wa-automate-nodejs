// ────────────────────────────────────────────────────────────
//  @open-wa/screencaster/server
//
//  Server-side screencast orchestrator using Hono's WebSocket
//  helpers. Runtime-agnostic — works on Node.js, Bun, Deno, etc.
//
//  Usage:
//    import { createNodeWebSocket } from '@hono/node-ws';
//    import { createScreencastRoute, ScreencastManager } from '@open-wa/screencaster/server';
//
//    const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
//    const manager = new ScreencastManager();
//    app.get('/screencast', createScreencastRoute(upgradeWebSocket, manager));
//
//    // Later, once the browser page is ready:
//    manager.setPage(page);
// ────────────────────────────────────────────────────────────

import type { Context } from 'hono';
import type {
    IScreencastPage,
    IScreencastCDPSession,
    ScreencastOptions,
    ServerMessage,
    ClientMessage,
    FrameMessage,
    NavStateMessage,
} from './types';
import { DEFAULT_SCREENCAST_OPTIONS, Modifiers, SPECIAL_KEYS } from './types';

// Re-export types for convenience
export type { IScreencastPage, IScreencastCDPSession, ScreencastOptions } from './types';

// ────── Debug logger ──────

const TAG = '[SC:server]';
let _frameCount = 0;
let _lastFrameLogTime = 0;

function ts(): string {
    return Date.now().toString();
}

function dbg(...args: unknown[]): void {
    if (process.env.DEBUG_SCREENCAST) console.log(ts(), TAG, ...args);
}

function dbgWarn(...args: unknown[]): void {
    if (process.env.DEBUG_SCREENCAST) console.warn(ts(), TAG, ...args);
}

function dbgErr(...args: unknown[]): void {
    if (process.env.DEBUG_SCREENCAST) console.error(ts(), TAG, ...args);
}

// ────── Types for Hono WebSocket ──────

/**
 * Hono's upgradeWebSocket helper signature.
 * We accept this as a parameter to avoid importing any runtime-specific adapter.
 */
type UpgradeWebSocket = (
    handler: (c: Context) => HonoWSHandlers | Promise<HonoWSHandlers>
) => (c: Context) => Response | Promise<Response>;

interface HonoWSHandlers {
    onOpen?: (evt: unknown, ws: HonoWSContext) => void;
    onMessage?: (evt: { data: unknown }, ws: HonoWSContext) => void;
    onClose?: (evt: unknown, ws: HonoWSContext) => void;
    onError?: (evt: unknown, ws: HonoWSContext) => void;
}

interface HonoWSContext {
    send(data: string | ArrayBuffer | Uint8Array): void;
    close(code?: number, reason?: string): void;
    readyState: number;
}

// ────── ScreencastManager ──────

interface ViewportSize {
    width: number;
    height: number;
}

/**
 * ScreencastManager owns the CDP session lifecycle and frame distribution.
 * It is page-agnostic at construction — call setPage() once the browser is ready.
 */
export class ScreencastManager {
    private page: IScreencastPage | null = null;
    private cdpSession: IScreencastCDPSession | null = null;
    private clients = new Set<HonoWSContext>();
    private isScreencasting = false;
    private currentOptions: Required<ScreencastOptions> = { ...DEFAULT_SCREENCAST_OPTIONS };
    private viewport: ViewportSize = { width: 1280, height: 720 };
    private cdpLock: Promise<void> = Promise.resolve();
    private frameHandler: ((...args: unknown[]) => void) | null = null;
    private navigationHandler: ((...args: unknown[]) => void) | null = null;
    private pageNavigationHandler: ((frame: unknown) => void) | null = null;
    private destroyed = false;

    /**
     * Bind a CDP-capable page. Can be called multiple times
     * (e.g., when the session restarts).
     */
    async setPage(page: IScreencastPage): Promise<void> {
        dbg('setPage() called, page.isClosed():', page.isClosed());

        // Clean up previous session
        await this.executeInLock(() => this.teardownCDP());

        this.page = page;
        dbg('setPage() — calling page.cdp() to create CDP session...');
        this.cdpSession = await page.cdp();
        dbg('setPage() — CDP session obtained:', !!this.cdpSession);
        dbg('setPage() — CDP session type:', typeof this.cdpSession);
        dbg('setPage() — CDP session keys:', this.cdpSession ? Object.keys(this.cdpSession as any).slice(0, 15) : 'null');

        // Set up frame listener
        this.setupFrameListener();

        // If we already have clients, start screencasting
        dbg('setPage() — clients waiting:', this.clients.size);
        if (this.clients.size > 0) {
            dbg('setPage() — auto-starting screencast for waiting clients');
            await this.executeInLock(() => this.startScreencast());
        }

        // Notify all clients that the page is bound
        dbg('setPage() — broadcasting ready:true');
        this.broadcast({ type: 'ready', bound: true });
    }

    /**
     * Unbind the current page (session ended, browser closed).
     */
    async clearPage(): Promise<void> {
        dbg('clearPage() called');
        await this.executeInLock(() => this.teardownCDP());
        this.page = null;
        this.cdpSession = null;
        this.broadcast({ type: 'ready', bound: false });
    }

    /**
     * Whether a page is currently bound.
     */
    get isBound(): boolean {
        const bound = this.page !== null && !this.page.isClosed();
        return bound;
    }

    /**
     * Number of connected viewers.
     */
    get clientCount(): number {
        return this.clients.size;
    }

    // ────── Client management ──────

    addClient(ws: HonoWSContext): void {
        this.clients.add(ws);
        dbg('addClient() — total clients:', this.clients.size, '| isBound:', this.isBound, '| isScreencasting:', this.isScreencasting, '| ws.readyState:', ws.readyState);

        // Listen to the raw underlying ws for transport-level diagnostics
        const rawWs = (ws as any).raw;
        if (rawWs && typeof rawWs.on === 'function') {
            rawWs.on('close', (code: number, reason: Uint8Array) => {
                dbg('RAW_WS:close — code:', code, '| reason:', reason?.toString(), '| rawWs.readyState:', rawWs.readyState);
            });
            rawWs.on('error', (err: Error) => {
                dbgErr('RAW_WS:error —', err.message);
            });
            // Log socket-level events
            const socket = rawWs._socket;
            if (socket) {
                socket.once('close', (hadError: boolean) => {
                    dbg('TCP_SOCKET:close — hadError:', hadError);
                });
                socket.once('error', (err: Error) => {
                    dbgErr('TCP_SOCKET:error —', err.message);
                });
            }
        }

        // Send current state
        this.sendTo(ws, { type: 'ready', bound: this.isBound });

        // Auto-start if we have a page and this is the first client
        if (this.isBound && !this.isScreencasting) {
            dbg('addClient() — auto-starting screencast (first client with bound page)');
            this.executeInLock(() => this.startScreencast()).catch(this.logError);
            this.executeInLock(() => this.sendNavState()).catch(this.logError);
        } else {
            dbg('addClient() — NOT auto-starting. isBound:', this.isBound, 'isScreencasting:', this.isScreencasting);
        }
    }

    removeClient(ws: HonoWSContext): void {
        this.clients.delete(ws);
        dbg('removeClient() — total clients:', this.clients.size, '| isScreencasting:', this.isScreencasting);

        // Auto-stop when no clients remain
        if (this.clients.size === 0 && this.isScreencasting) {
            dbg('removeClient() — no clients left, stopping screencast');
            this.stopScreencast().catch(this.logError);
        }
    }

    // ────── Message handling ──────

    async handleMessage(ws: HonoWSContext, raw: unknown): Promise<void> {
        let msg: ClientMessage;
        try {
            msg = JSON.parse(typeof raw === 'string' ? raw : String(raw)) as ClientMessage;
        } catch {
            dbgWarn('handleMessage() — invalid JSON from client:', typeof raw === 'string' ? raw.slice(0, 100) : typeof raw);
            this.sendTo(ws, { type: 'error', message: 'Invalid JSON' });
            return;
        }

        // Log all messages except high-frequency ones (mouse moves, acks)
        if (msg.type !== 'mouse' && msg.type !== 'ack') {
            dbg('handleMessage():', msg.type, JSON.stringify(msg).slice(0, 200));
        }

        try {
            switch (msg.type) {
                case 'start':
                    if (msg.options) {
                        this.currentOptions = { ...DEFAULT_SCREENCAST_OPTIONS, ...msg.options };
                        dbg('handleMessage(start) — options updated:', JSON.stringify(this.currentOptions));
                    }
                    dbg('handleMessage(start) — isBound:', this.isBound, '| isScreencasting:', this.isScreencasting);
                    if (this.isBound) {
                        await this.executeInLock(async () => {
                            await this.startScreencast();
                            await this.sendNavState();
                        });
                    } else {
                        dbgWarn('handleMessage(start) — page not bound, cannot start');
                    }
                    break;

                case 'stop':
                    dbg('handleMessage(stop)');
                    await this.executeInLock(() => this.stopScreencast());
                    this.sendTo(ws, { type: 'stopped' });
                    break;

                case 'ack':
                    // No-op: ACKs are now handled server-side immediately in the frame handler.
                    // Kept for backward compatibility with older clients.
                    dbg('handleMessage(ack) — no-op (server-side ACK), sessionId:', msg.sessionId);
                    break;

                case 'mouse':
                    await this.executeInLock(() => this.handleMouse(msg));
                    break;

                case 'key':
                    dbg('handleMessage(key):', msg.action, msg.key, msg.code);
                    await this.executeInLock(() => this.handleKey(msg));
                    break;

                case 'scroll':
                    await this.executeInLock(() => this.handleScroll(msg));
                    break;

                case 'navigate':
                    dbg('handleMessage(navigate):', msg.url);
                    await this.executeInLock(() => this.handleNavigate(msg.url));
                    break;

                case 'go-back':
                    dbg('handleMessage(go-back)');
                    await this.executeInLock(() => this.handleGoBack());
                    break;

                case 'go-forward':
                    dbg('handleMessage(go-forward)');
                    await this.executeInLock(() => this.handleGoForward());
                    break;

                case 'resize':
                    dbg('handleMessage(resize):', msg.width, 'x', msg.height);
                    await this.executeInLock(() => this.handleResize(msg.width, msg.height));
                    break;

                default:
                    dbgWarn('handleMessage() — unknown message type:', (msg as any).type);
            }
        } catch (err) {
            dbgErr('handleMessage() — error processing', msg.type, ':', err instanceof Error ? err.message : err);
            this.sendTo(ws, {
                type: 'error',
                message: err instanceof Error ? err.message : 'Unknown error',
            });
        }
    }

    // ────── Screencast lifecycle ──────

    private async startScreencast(): Promise<void> {
        dbg('startScreencast() — cdpSession:', !!this.cdpSession, '| isScreencasting:', this.isScreencasting, '| destroyed:', this.destroyed);
        if (!this.cdpSession || this.isScreencasting || this.destroyed) {
            dbg('startScreencast() — SKIPPING (guard failed)');
            return;
        }

        // Set flag synchronously BEFORE the async CDP call to prevent
        // concurrent callers from passing the guard (race between
        // addClient fire-and-forget and handleMessage('start')).
        this.isScreencasting = true;

        try {
            const params = {
                format: this.currentOptions.format,
                quality: this.currentOptions.quality,
                maxWidth: this.currentOptions.maxWidth,
                maxHeight: this.currentOptions.maxHeight,
                everyNthFrame: this.currentOptions.everyNthFrame,
            };
            dbg('startScreencast() — sending Page.startScreencast with params:', JSON.stringify(params));
            await this.cdpSession.send('Page.startScreencast', params);
            _frameCount = 0;
            _lastFrameLogTime = Date.now();
            dbg('startScreencast() — ✅ SUCCESS, screencast is now running');
        } catch (err) {
            this.isScreencasting = false;
            dbgErr('startScreencast() — ❌ FAILED:', err instanceof Error ? err.message : err);
            dbgErr('startScreencast() — full error:', err);
            this.logError(err);
        }
    }

    private async stopScreencast(): Promise<void> {
        dbg('stopScreencast() — cdpSession:', !!this.cdpSession, '| isScreencasting:', this.isScreencasting);
        if (!this.cdpSession || !this.isScreencasting) return;

        try {
            await this.cdpSession.send('Page.stopScreencast');
            dbg('stopScreencast() — ✅ stopped');
        } catch (err) {
            dbgWarn('stopScreencast() — error (session may be closed):', err instanceof Error ? err.message : err);
            // Session may already be closed
        }
        this.isScreencasting = false;
    }

    private async executeInLock<T>(fn: () => Promise<T>): Promise<T> {
        const next = this.cdpLock.then(fn);
        this.cdpLock = next.then(() => { }).catch(() => { });
        return next;
    }

    // ackFrame() removed — ACKs are now handled server-side immediately in the frame handler.

    private setupFrameListener(): void {
        dbg('setupFrameListener() — cdpSession:', !!this.cdpSession);
        if (!this.cdpSession) return;

        // The CDP session from driver-interface uses .send() only.
        // We need to subscribe to events. The underlying session
        // is obtained via page.cdp(), which in puppeteer returns
        // a CDPSession with an .on() method. We access it via
        // the raw unwrap() to set up the event listener.
        const rawSession = this.cdpSession as unknown as {
            on?: (event: string, handler: (...args: unknown[]) => void) => void;
            off?: (event: string, handler: (...args: unknown[]) => void) => void;
        };

        dbg('setupFrameListener() — rawSession.on:', typeof rawSession.on, '| rawSession.off:', typeof rawSession.off);

        if (typeof rawSession.on !== 'function') {
            dbgErr('setupFrameListener() — ❌ CDP session does NOT support .on() event subscriptions!');
            dbgErr('setupFrameListener() — session prototype chain:', Object.getPrototypeOf(this.cdpSession)?.constructor?.name);
            console.warn('[screencaster] CDP session does not support event subscriptions');
            return;
        }

        // Clean up any previous handler
        if (this.frameHandler && typeof rawSession.off === 'function') {
            dbg('setupFrameListener() — cleaning up previous frame handler');
            rawSession.off('Page.screencastFrame', this.frameHandler);
        }

        dbg('setupFrameListener() — registering Page.screencastFrame handler');

        // Keep a local ref to cdpSession for the closure — avoids stale this.cdpSession
        const session = this.cdpSession;

        this.frameHandler = ((...args: unknown[]) => {
            _frameCount++;
            const now = Date.now();
            const params = args[0] as Record<string, unknown>;
            const { data, sessionId, metadata } = params as {
                data: string;
                sessionId: number;
                metadata: FrameMessage['metadata'];
            };

            // Log every frame for the first 5, then every 30th frame or every 5 seconds
            if (_frameCount <= 5 || _frameCount % 30 === 0 || (now - _lastFrameLogTime) > 5000) {
                dbg(`📦 FRAME #${_frameCount} | sessionId: ${sessionId} | dataLen: ${data?.length ?? 'null'} | hasMetadata: ${!!metadata} | clients: ${this.clients.size}`);
                if (metadata) {
                    dbg(`   metadata: ${metadata.deviceWidth}x${metadata.deviceHeight} | pageScale: ${metadata.pageScaleFactor} | offsetTop: ${metadata.offsetTop}`);
                }
                _lastFrameLogTime = now;
            }

            // Update viewport from metadata
            if (metadata) {
                this.viewport = {
                    width: metadata.deviceWidth || this.viewport.width,
                    height: metadata.deviceHeight || this.viewport.height,
                };
            }

            const frame: FrameMessage = {
                type: 'frame',
                data,
                sessionId,
                metadata: metadata || {
                    width: this.viewport.width,
                    height: this.viewport.height,
                    timestamp: Date.now(),
                    offsetTop: 0,
                    pageScaleFactor: 1,
                    deviceWidth: this.viewport.width,
                    deviceHeight: this.viewport.height,
                },
            };

            // Broadcast frame to all connected clients
            this.broadcast(frame);

            // CRITICAL: ACK the frame immediately server-side to keep
            // frames flowing. The POC does this — delegating ACKs to
            // the client round-trip caused frame starvation.
            session.send('Page.screencastFrameAck', { sessionId }).catch(() => {
                // Session might be closed after navigation, ignore
            });

            if (_frameCount <= 3) {
                dbg(`   → ACK sent server-side for sessionId: ${sessionId}`);
            }
        }) as (...args: unknown[]) => void;

        rawSession.on('Page.screencastFrame', this.frameHandler);
        dbg('setupFrameListener() — ✅ Page.screencastFrame handler registered');

        // ── CDP-level navigation listener (Page.frameNavigated) ──
        dbg('setupFrameListener() — registering Page.frameNavigated handler (CDP)');

        // Clean up any previous navigation handler
        if (this.navigationHandler && typeof rawSession.off === 'function') {
            dbg('setupFrameListener() — cleaning up previous CDP navigation handler');
            rawSession.off('Page.frameNavigated', this.navigationHandler);
        }

        this.navigationHandler = (async (...navArgs: unknown[]) => {
            const frame = navArgs[0] as { frame?: { parentId?: string; url?: string } };
            const isMainFrame = frame.frame && !frame.frame.parentId;
            dbg('CDP:Page.frameNavigated fired | isMainFrame:', isMainFrame, '| url:', frame.frame?.url?.slice(0, 80));

            // Only care about main frame (no parentId)
            if (isMainFrame) {
                dbg('CDP:Page.frameNavigated — main frame navigation detected, resetting screencast');
                // Navigation stops screencast automatically
                this.isScreencasting = false;

                await this.sendNavState();

                // Restart if we have clients
                if (this.clients.size > 0) {
                    dbg('CDP:Page.frameNavigated — restarting screencast for', this.clients.size, 'clients');
                    await this.startScreencast();
                }
            }
        }) as (...args: unknown[]) => void;

        rawSession.on('Page.frameNavigated', this.navigationHandler);

        // ── Page-level navigation listener (high-level, like the POC) ──
        // This is a secondary/fallback signal that uses the IPage driver's
        // high-level event, which is more reliable across CDP session resets.
        if (this.page && typeof (this.page as any).on === 'function') {
            // Clean up any previous page-level handler
            if (this.pageNavigationHandler && typeof (this.page as any).off === 'function') {
                dbg('setupFrameListener() — cleaning up previous page-level navigation handler');
                (this.page as any).off('framenavigated', this.pageNavigationHandler);
            }

            this.pageNavigationHandler = async (_frame: unknown) => {
                dbg('PAGE:framenavigated fired (high-level) — isScreencasting:', this.isScreencasting);
                // Only act if screencast stopped (CDP event may have already handled it)
                if (!this.isScreencasting && this.clients.size > 0) {
                    dbg('PAGE:framenavigated — screencast not running, restarting for', this.clients.size, 'clients');
                    await this.sendNavState();
                    await this.startScreencast();
                } else {
                    dbg('PAGE:framenavigated — screencast already running or no clients, no action needed');
                }
            };

            (this.page as any).on('framenavigated', this.pageNavigationHandler);
            dbg('setupFrameListener() — ✅ page-level framenavigated listener registered');
        } else {
            dbgWarn('setupFrameListener() — page does not support .on() events, skipping page-level navigation listener');
        }

        // Enable Page events so we receive frameNavigated
        dbg('setupFrameListener() — sending Page.enable');
        this.cdpSession.send('Page.enable').catch((err) => {
            dbgErr('setupFrameListener() — Page.enable failed:', err instanceof Error ? err.message : err);
            this.logError(err);
        });
        dbg('setupFrameListener() — ✅ setup complete');
    }

    private async sendNavState(): Promise<void> {
        dbg('sendNavState() — cdpSession:', !!this.cdpSession);
        if (!this.cdpSession) return;

        try {
            const history = await this.cdpSession.send<{
                currentIndex: number;
                entries: unknown[];
            }>('Page.getNavigationHistory');

            if (!history) {
                dbgWarn('sendNavState() — getNavigationHistory returned null/undefined');
                return;
            }

            const { currentIndex, entries } = history;
            const url = this.page?.isClosed() ? '' : (await this.getPageUrl());
            const nav: NavStateMessage = {
                type: 'nav-state',
                url,
                canGoBack: currentIndex > 0,
                canGoForward: currentIndex < entries.length - 1,
            };

            dbg('sendNavState() — broadcasting:', JSON.stringify({ url: url.slice(0, 60), canGoBack: nav.canGoBack, canGoForward: nav.canGoForward, entries: entries.length }));
            this.broadcast(nav);
        } catch (err) {
            dbgWarn('sendNavState() — error:', err instanceof Error ? err.message : err);
            // Page might not be ready yet
        }
    }

    private async getPageUrl(): Promise<string> {
        if (!this.cdpSession) return '';
        try {
            const result = await this.cdpSession.send<{ result: { value: string } }>(
                'Runtime.evaluate',
                { expression: 'window.location.href' }
            );
            return result?.result?.value || '';
        } catch {
            return '';
        }
    }

    // ────── Input forwarding ──────

    private async handleMouse(msg: { action: string; x: number; y: number; button?: string }): Promise<void> {
        if (!this.cdpSession) return;

        const x = msg.x * this.viewport.width;
        const y = msg.y * this.viewport.height;

        const cdpButton = msg.button === 'right' ? 'right'
            : msg.button === 'middle' ? 'middle'
                : 'left';

        const cdpType = msg.action === 'move' ? 'mouseMoved'
            : msg.action === 'down' ? 'mousePressed'
                : 'mouseReleased';

        await this.cdpSession.send('Input.dispatchMouseEvent', {
            type: cdpType,
            x,
            y,
            button: cdpButton,
            clickCount: msg.action === 'down' ? 1 : 0,
        });
    }

    private async handleKey(msg: { action: string; key: string; code: string; modifiers?: number }): Promise<void> {
        if (!this.cdpSession) return;

        const modifiers = msg.modifiers || 0;
        const type = msg.action === 'down' ? 'keyDown' : 'keyUp';

        // For printable single chars on keyDown, also send a char event
        if (msg.action === 'down' && msg.key.length === 1 && !SPECIAL_KEYS.has(msg.key)) {
            await this.cdpSession.send('Input.dispatchKeyEvent', {
                type: 'keyDown',
                key: msg.key,
                code: msg.code,
                modifiers,
                windowsVirtualKeyCode: msg.key.charCodeAt(0),
                nativeVirtualKeyCode: msg.key.charCodeAt(0),
            });
            // Follow with a char event for text input
            await this.cdpSession.send('Input.dispatchKeyEvent', {
                type: 'char',
                text: msg.key,
                key: msg.key,
                code: msg.code,
                modifiers,
            });
        } else {
            await this.cdpSession.send('Input.dispatchKeyEvent', {
                type,
                key: msg.key,
                code: msg.code,
                modifiers,
            });
        }
    }

    private async handleScroll(msg: { deltaX: number; deltaY: number; x: number; y: number }): Promise<void> {
        if (!this.cdpSession) return;

        const x = msg.x * this.viewport.width;
        const y = msg.y * this.viewport.height;

        await this.cdpSession.send('Input.dispatchMouseEvent', {
            type: 'mouseWheel',
            x,
            y,
            deltaX: msg.deltaX,
            deltaY: msg.deltaY,
        });
    }

    private async handleNavigate(url: string): Promise<void> {
        if (!this.cdpSession) return;

        await this.cdpSession.send('Page.navigate', { url });
    }

    private async handleGoBack(): Promise<void> {
        if (!this.cdpSession) return;

        const history = await this.cdpSession.send<{
            currentIndex: number;
            entries: { id: number }[];
        }>('Page.getNavigationHistory');

        if (history && history.currentIndex > 0) {
            const entry = history.entries[history.currentIndex - 1];
            await this.cdpSession.send('Page.navigateToHistoryEntry', { entryId: entry.id });
        }
    }

    private async handleGoForward(): Promise<void> {
        if (!this.cdpSession) return;

        const history = await this.cdpSession.send<{
            currentIndex: number;
            entries: { id: number }[];
        }>('Page.getNavigationHistory');

        if (history && history.currentIndex < history.entries.length - 1) {
            const entry = history.entries[history.currentIndex + 1];
            await this.cdpSession.send('Page.navigateToHistoryEntry', { entryId: entry.id });
        }
    }

    private async handleResize(width: number, height: number): Promise<void> {
        if (!this.cdpSession) return;

        try {
            const w = Math.floor(width);
            const h = Math.floor(height);

            dbg('handleResize() — updating viewport and stopping screencast | new size:', w, 'x', h);

            // 1. Update options and viewport immediately so mouse clicks are accurate
            this.currentOptions.maxWidth = w;
            this.currentOptions.maxHeight = h;
            this.viewport = { width: w, height: h };

            // 2. Tell the browser to actually resize the viewport
            // This ensures responsive layouts (media queries) are triggered.
            await this.cdpSession.send('Emulation.setDeviceMetricsOverride', {
                width: w,
                height: h,
                deviceScaleFactor: 1,
                mobile: false,
                screenOrientation: { angle: 0, type: 'portraitPrimary' }
            });

            // 3. Restart screencast to apply new max dimensions to the stream
            if (this.isScreencasting) {
                dbg('handleResize() — restarting screencast');
                await this.stopScreencast();
                await this.startScreencast();
            }
        } catch (err) {
            dbgErr('handleResize() — error:', err instanceof Error ? err.message : err);
            this.logError(err);
        }
    }

    // ────── Utilities ──────

    private broadcast(msg: ServerMessage): void {
        const payload = JSON.stringify(msg);
        let sent = 0;
        let skipped = 0;
        for (const ws of this.clients) {
            if (ws.readyState === 1 /* OPEN */) {
                try {
                    ws.send(payload);
                    sent++;
                } catch (err) {
                    dbgErr('broadcast() — send failed for a client:', err instanceof Error ? err.message : err);
                    skipped++;
                }
            } else {
                skipped++;
            }
        }
        // Only log broadcast stats for non-frame messages (frames are too frequent)
        if (msg.type !== 'frame') {
            dbg(`broadcast(${msg.type}) — sent: ${sent}, skipped: ${skipped}, total: ${this.clients.size}`);
        }
    }

    private sendTo(ws: HonoWSContext, msg: ServerMessage): void {
        dbg(`sendTo(${msg.type}) — ws.readyState: ${ws.readyState}`);
        if (ws.readyState === 1 /* OPEN */) {
            ws.send(JSON.stringify(msg));
        } else {
            dbgWarn(`sendTo(${msg.type}) — ws not OPEN (readyState: ${ws.readyState}), dropping`);
        }
    }

    private logError = (err: unknown): void => {
        dbgErr('logError:', err instanceof Error ? err.stack || err.message : err);
    };

    private async teardownCDP(): Promise<void> {
        dbg('teardownCDP() — isScreencasting:', this.isScreencasting, '| hasFrameHandler:', !!this.frameHandler, '| hasNavHandler:', !!this.navigationHandler, '| hasPageNavHandler:', !!this.pageNavigationHandler, '| hasCdpSession:', !!this.cdpSession);

        if (this.isScreencasting) {
            await this.stopScreencast();
        }

        // Clean up CDP-level handlers
        if (this.cdpSession) {
            const rawSession = this.cdpSession as unknown as {
                off?: (event: string, handler: (...args: unknown[]) => void) => void;
            };
            if (typeof rawSession.off === 'function') {
                if (this.frameHandler) {
                    dbg('teardownCDP() — removing Page.screencastFrame handler');
                    rawSession.off('Page.screencastFrame', this.frameHandler);
                }
                if (this.navigationHandler) {
                    dbg('teardownCDP() — removing Page.frameNavigated handler');
                    rawSession.off('Page.frameNavigated', this.navigationHandler);
                }
            }
        }
        this.frameHandler = null;
        this.navigationHandler = null;

        // Clean up page-level navigation handler
        if (this.pageNavigationHandler && this.page && typeof (this.page as any).off === 'function') {
            dbg('teardownCDP() — removing page-level framenavigated handler');
            (this.page as any).off('framenavigated', this.pageNavigationHandler);
        }
        this.pageNavigationHandler = null;

        dbg('teardownCDP() — ✅ complete');
    }

    async destroy(): Promise<void> {
        dbg('destroy() called, clients:', this.clients.size);
        this.destroyed = true;
        await this.executeInLock(() => this.teardownCDP());

        // Close all client connections
        for (const ws of this.clients) {
            ws.close(1001, 'Server shutting down');
        }
        this.clients.clear();
        this.page = null;
        this.cdpSession = null;
        dbg('destroy() — ✅ complete');
    }
}

// ────── Route Factory ──────

/**
 * Creates a Hono route handler for the screencast WebSocket endpoint.
 *
 * @param upgradeWebSocket - The `upgradeWebSocket` helper from a Hono WebSocket adapter
 *   (e.g., `@hono/node-ws`, `hono/bun`, `hono/deno`).
 * @param manager - A `ScreencastManager` instance that handles CDP orchestration.
 * @returns A Hono handler function — register it with `app.get('/screencast', handler)`.
 *
 * @example
 * ```ts
 * // Node.js
 * import { createNodeWebSocket } from '@hono/node-ws';
 * const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });
 * const manager = new ScreencastManager();
 * app.get('/screencast', createScreencastRoute(upgradeWebSocket, manager));
 * // After server.listen():
 * injectWebSocket(server);
 *
 * // Bun
 * import { createBunWebSocket } from 'hono/bun';
 * const { upgradeWebSocket, websocket } = createBunWebSocket();
 * const manager = new ScreencastManager();
 * app.get('/screencast', createScreencastRoute(upgradeWebSocket, manager));
 * export default { fetch: app.fetch, websocket };
 * ```
 */
export function createScreencastRoute(
    upgradeWebSocket: UpgradeWebSocket,
    manager: ScreencastManager,
) {
    dbg('createScreencastRoute() — route factory invoked');

    return upgradeWebSocket((_c) => ({
        onOpen(_evt, ws) {
            dbg('WS:onOpen — new connection, ws.readyState:', ws.readyState);
            manager.addClient(ws);
        },

        onMessage(evt, ws) {
            manager.handleMessage(ws, evt.data).catch((err) => {
                dbgErr('WS:onMessage — unhandled error:', err);
            });
        },

        onClose(evt, ws) {
            const closeEvt = evt as { code?: number; reason?: string; wasClean?: boolean };
            dbg('WS:onClose — connection closed | code:', closeEvt.code, '| reason:', closeEvt.reason, '| wasClean:', closeEvt.wasClean, '| ws.readyState:', ws.readyState);
            manager.removeClient(ws);
        },

        onError(evt, ws) {
            const errEvt = evt as { error?: Error; message?: string };
            dbgErr('WS:onError — connection error | message:', errEvt.message, '| error:', errEvt.error);
            manager.removeClient(ws);
        },
    }));
}
