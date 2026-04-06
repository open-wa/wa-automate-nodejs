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
    private frameHandler: ((...args: unknown[]) => void) | null = null;
    private destroyed = false;

    /**
     * Bind a CDP-capable page. Can be called multiple times
     * (e.g., when the session restarts).
     */
    async setPage(page: IScreencastPage): Promise<void> {
        // Clean up previous session
        await this.teardownCDP();

        this.page = page;
        this.cdpSession = await page.cdp();

        // Set up frame listener
        this.setupFrameListener();

        // If we already have clients, start screencasting
        if (this.clients.size > 0) {
            await this.startScreencast();
        }

        // Notify all clients that the page is bound
        this.broadcast({ type: 'ready', bound: true });
    }

    /**
     * Unbind the current page (session ended, browser closed).
     */
    async clearPage(): Promise<void> {
        await this.teardownCDP();
        this.page = null;
        this.cdpSession = null;
        this.broadcast({ type: 'ready', bound: false });
    }

    /**
     * Whether a page is currently bound.
     */
    get isBound(): boolean {
        return this.page !== null && !this.page.isClosed();
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

        // Send current state
        this.sendTo(ws, { type: 'ready', bound: this.isBound });

        // Auto-start if we have a page and this is the first client
        if (this.isBound && !this.isScreencasting) {
            this.startScreencast().catch(this.logError);
            this.sendNavState().catch(this.logError);
        }
    }

    removeClient(ws: HonoWSContext): void {
        this.clients.delete(ws);

        // Auto-stop when no clients remain
        if (this.clients.size === 0 && this.isScreencasting) {
            this.stopScreencast().catch(this.logError);
        }
    }

    // ────── Message handling ──────

    async handleMessage(ws: HonoWSContext, raw: unknown): Promise<void> {
        let msg: ClientMessage;
        try {
            msg = JSON.parse(typeof raw === 'string' ? raw : String(raw)) as ClientMessage;
        } catch {
            this.sendTo(ws, { type: 'error', message: 'Invalid JSON' });
            return;
        }

        try {
            switch (msg.type) {
                case 'start':
                    if (msg.options) {
                        this.currentOptions = { ...DEFAULT_SCREENCAST_OPTIONS, ...msg.options };
                    }
                    if (this.isBound) {
                        await this.startScreencast();
                        await this.sendNavState();
                    }
                    break;

                case 'stop':
                    await this.stopScreencast();
                    this.sendTo(ws, { type: 'stopped' });
                    break;

                case 'ack':
                    await this.ackFrame(msg.sessionId);
                    break;

                case 'mouse':
                    await this.handleMouse(msg);
                    break;

                case 'key':
                    await this.handleKey(msg);
                    break;

                case 'scroll':
                    await this.handleScroll(msg);
                    break;

                case 'navigate':
                    await this.handleNavigate(msg.url);
                    break;

                case 'go-back':
                    await this.handleGoBack();
                    break;

                case 'go-forward':
                    await this.handleGoForward();
                    break;

                case 'resize':
                    await this.handleResize(msg.width, msg.height);
                    break;
            }
        } catch (err) {
            this.sendTo(ws, {
                type: 'error',
                message: err instanceof Error ? err.message : 'Unknown error',
            });
        }
    }

    // ────── Screencast lifecycle ──────

    private async startScreencast(): Promise<void> {
        if (!this.cdpSession || this.isScreencasting || this.destroyed) return;

        try {
            await this.cdpSession.send('Page.startScreencast', {
                format: this.currentOptions.format,
                quality: this.currentOptions.quality,
                maxWidth: this.currentOptions.maxWidth,
                maxHeight: this.currentOptions.maxHeight,
                everyNthFrame: this.currentOptions.everyNthFrame,
            });
            this.isScreencasting = true;
        } catch (err) {
            this.isScreencasting = false;
            this.logError(err);
        }
    }

    private async stopScreencast(): Promise<void> {
        if (!this.cdpSession || !this.isScreencasting) return;

        try {
            await this.cdpSession.send('Page.stopScreencast');
        } catch {
            // Session may already be closed
        }
        this.isScreencasting = false;
    }

    private async ackFrame(sessionId: number): Promise<void> {
        if (!this.cdpSession) return;

        try {
            await this.cdpSession.send('Page.screencastFrameAck', { sessionId });
        } catch {
            // Session may be closed after navigation
        }
    }

    private setupFrameListener(): void {
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

        if (typeof rawSession.on !== 'function') {
            console.warn('[screencaster] CDP session does not support event subscriptions');
            return;
        }

        // Clean up any previous handler
        if (this.frameHandler && typeof rawSession.off === 'function') {
            rawSession.off('Page.screencastFrame', this.frameHandler);
        }

        this.frameHandler = ((...args: unknown[]) => {
            const params = args[0] as Record<string, unknown>;
            const { data, sessionId, metadata } = params as {
                data: string;
                sessionId: number;
                metadata: FrameMessage['metadata'];
            };

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

            this.broadcast(frame);
        }) as (...args: unknown[]) => void;

        rawSession.on('Page.screencastFrame', this.frameHandler);

        // Listen for frame navigation to restart screencast
        rawSession.on('Page.frameNavigated', (async (...navArgs: unknown[]) => {
            const frame = navArgs[0] as { frame?: { parentId?: string } };
            // Only care about main frame (no parentId)
            if (frame.frame && !frame.frame.parentId) {
                // Navigation stops screencast automatically
                this.isScreencasting = false;

                await this.sendNavState();

                // Restart if we have clients
                if (this.clients.size > 0) {
                    await this.startScreencast();
                }
            }
        }) as (...args: unknown[]) => void);

        // Enable Page events so we receive frameNavigated
        this.cdpSession.send('Page.enable').catch(this.logError);
    }

    private async sendNavState(): Promise<void> {
        if (!this.cdpSession) return;

        try {
            const history = await this.cdpSession.send<{
                currentIndex: number;
                entries: unknown[];
            }>('Page.getNavigationHistory');

            if (!history) return;

            const { currentIndex, entries } = history;
            const nav: NavStateMessage = {
                type: 'nav-state',
                url: this.page?.isClosed() ? '' : (await this.getPageUrl()),
                canGoBack: currentIndex > 0,
                canGoForward: currentIndex < entries.length - 1,
            };

            this.broadcast(nav);
        } catch {
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
            this.currentOptions.maxWidth = Math.floor(width);
            this.currentOptions.maxHeight = Math.floor(height);

            if (this.isScreencasting) {
                await this.stopScreencast();
                await this.startScreencast();
            }
        } catch (err) {
            this.logError(err);
        }
    }

    // ────── Utilities ──────

    private broadcast(msg: ServerMessage): void {
        const payload = JSON.stringify(msg);
        for (const ws of this.clients) {
            if (ws.readyState === 1 /* OPEN */) {
                ws.send(payload);
            }
        }
    }

    private sendTo(ws: HonoWSContext, msg: ServerMessage): void {
        if (ws.readyState === 1 /* OPEN */) {
            ws.send(JSON.stringify(msg));
        }
    }

    private logError = (err: unknown): void => {
        console.error('[screencaster]', err instanceof Error ? err.message : err);
    };

    private async teardownCDP(): Promise<void> {
        if (this.isScreencasting) {
            await this.stopScreencast();
        }

        // Clean up frame handler
        if (this.frameHandler && this.cdpSession) {
            const rawSession = this.cdpSession as unknown as {
                off?: (event: string, handler: (...args: unknown[]) => void) => void;
            };
            if (typeof rawSession.off === 'function') {
                rawSession.off('Page.screencastFrame', this.frameHandler);
            }
            this.frameHandler = null;
        }
    }

    async destroy(): Promise<void> {
        this.destroyed = true;
        await this.teardownCDP();

        // Close all client connections
        for (const ws of this.clients) {
            ws.close(1001, 'Server shutting down');
        }
        this.clients.clear();
        this.page = null;
        this.cdpSession = null;
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
    return upgradeWebSocket((_c) => ({
        onOpen(_evt, ws) {
            manager.addClient(ws);
        },

        onMessage(evt, ws) {
            manager.handleMessage(ws, evt.data).catch((err) => {
                console.error('[screencaster] message handler error:', err);
            });
        },

        onClose(_evt, ws) {
            manager.removeClient(ws);
        },

        onError(_evt, ws) {
            manager.removeClient(ws);
        },
    }));
}
