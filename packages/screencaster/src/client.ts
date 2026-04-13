// ────────────────────────────────────────────────────────────
//  @open-wa/screencaster/client
//
//  Framework-agnostic browser-side screencast viewer.
//  Zero Node.js deps — runs in any modern browser.
//
//  Usage:
//    const client = new ScreencastClient({ url: 'ws://localhost:8080/screencast' });
//    client.on('frame', (data, meta) => drawToCanvas(data, meta));
//    client.connect();
// ────────────────────────────────────────────────────────────

import type {
    ScreencastOptions,
    ServerMessage,
    ClientMessage,
    FrameMessage,
    NavStateMessage,
} from './types';

// Re-export types the consumer will need
export type { ScreencastOptions, FrameMessage, NavStateMessage } from './types';

// ────── Debug logger ──────

const TAG = '[SC:client]';
let _frameCount = 0;
let _lastFrameLogTime = 0;
let _lastFrameSize = 0;

function ts(): string {
    return Date.now().toString();
}

/**
 * Check if debug logging is enabled.
 * Support Node.js process.env and browser localStorage.
 */
function isDebugEnabled(): boolean {
    try {
        // Node.js or bundler-replaced process.env
        if (typeof process !== 'undefined' && process.env?.DEBUG_SCREENCAST) return true;
        // Browser localStorage
        if (typeof localStorage !== 'undefined' && localStorage.getItem('DEBUG_SCREENCAST')) return true;
    } catch {
        // Ignore errors in environments where these aren't accessible
    }
    return false;
}

const DEBUG = isDebugEnabled();

function dbg(...args: unknown[]): void {
    if (DEBUG) console.log(ts(), TAG, ...args);
}

function dbgWarn(...args: unknown[]): void {
    if (DEBUG) console.warn(ts(), TAG, ...args);
}

function dbgErr(...args: unknown[]): void {
    if (DEBUG) console.error(ts(), TAG, ...args);
}

// ────── Event types ──────

export type ScreencastClientState = 'idle' | 'connecting' | 'streaming' | 'error';

export interface ScreencastClientEvents {
    frame: (data: string, metadata: FrameMessage['metadata']) => void;
    'nav-state': (state: NavStateMessage) => void;
    error: (message: string) => void;
    'state-change': (state: ScreencastClientState) => void;
    ready: (bound: boolean) => void;
}

// ────── ScreencastClient ──────

export interface ScreencastClientOptions {
    /** Full WebSocket URL, e.g. 'ws://localhost:8080/screencast' */
    url: string;
    /** Auto-send start message on connect? Default: false */
    autoStart?: boolean;
    /** Default screencast options sent with 'start' */
    defaultOptions?: ScreencastOptions;
    /** Auto-reconnect on disconnect? Default: false */
    autoReconnect?: boolean;
    /** Delay between reconnect attempts (ms). Default: 2000 */
    reconnectDelay?: number;
}

type EventName = keyof ScreencastClientEvents;
type Listener<E extends EventName> = ScreencastClientEvents[E];

export class ScreencastClient {
    private ws: WebSocket | null = null;
    private _state: ScreencastClientState = 'idle';
    private listeners = new Map<EventName, Set<Listener<EventName>>>();
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private destroyed = false;

    readonly url: string;
    readonly autoStart: boolean;
    readonly defaultOptions: ScreencastOptions | undefined;
    readonly autoReconnect: boolean;
    readonly reconnectDelay: number;

    constructor(options: ScreencastClientOptions) {
        this.url = options.url;
        this.autoStart = options.autoStart ?? false;
        this.defaultOptions = options.defaultOptions;
        this.autoReconnect = options.autoReconnect ?? false;
        this.reconnectDelay = options.reconnectDelay ?? 2000;
        dbg('constructor() — url:', this.url, '| autoStart:', this.autoStart, '| autoReconnect:', this.autoReconnect, '| reconnectDelay:', this.reconnectDelay);
        if (this.defaultOptions) {
            dbg('constructor() — defaultOptions:', JSON.stringify(this.defaultOptions));
        }
    }

    // ────── State ──────

    get state(): ScreencastClientState {
        return this._state;
    }

    private setState(s: ScreencastClientState): void {
        if (this._state === s) return;
        const prev = this._state;
        this._state = s;
        dbg(`setState() — ${prev} → ${s}`);
        this.emit('state-change', s);
    }

    // ────── Connection ──────

    connect(): void {
        dbg('connect() — ws:', !!this.ws, '| destroyed:', this.destroyed);
        if (this.ws || this.destroyed) {
            dbg('connect() — SKIPPING (already connected or destroyed)');
            return;
        }

        this.setState('connecting');
        dbg('connect() — creating WebSocket to:', this.url);

        try {
            this.ws = new WebSocket(this.url);
        } catch (err) {
            dbgErr('connect() — WebSocket constructor threw:', err);
            this.setState('error');
            this.emit('error', `WebSocket constructor failed: ${err}`);
            return;
        }

        dbg('connect() — WebSocket created, readyState:', this.ws.readyState);

        this.ws.onopen = () => {
            dbg('WS:onopen — connection established! readyState:', this.ws?.readyState);
            this.setState('streaming');
            if (this.autoStart) {
                dbg('WS:onopen — autoStart is true, sending start message');
                this.start(this.defaultOptions);
            } else {
                dbg('WS:onopen — autoStart is false, waiting for manual start()');
            }
        };

        this.ws.onmessage = (event) => {
            this.handleMessage(event.data);
        };

        this.ws.onerror = (evt) => {
            dbgErr('WS:onerror — connection error. Event type:', (evt as any)?.type, '| readyState:', this.ws?.readyState);
            this.setState('error');
            this.emit('error', 'WebSocket connection failed');
        };

        this.ws.onclose = (evt) => {
            dbg('WS:onclose — code:', evt.code, '| reason:', evt.reason, '| wasClean:', evt.wasClean, '| currentState:', this._state);
            this.ws = null;

            if (this._state !== 'error') {
                this.setState('idle');
            }

            if (this.autoReconnect && !this.destroyed) {
                dbg('WS:onclose — scheduling reconnect in', this.reconnectDelay, 'ms');
                this.scheduleReconnect();
            } else {
                dbg('WS:onclose — NOT reconnecting. autoReconnect:', this.autoReconnect, '| destroyed:', this.destroyed);
            }
        };
    }

    disconnect(): void {
        dbg('disconnect() called');
        this.clearReconnectTimer();
        if (this.ws) {
            dbg('disconnect() — closing WebSocket');
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }
        this.setState('idle');
    }

    // ────── Screencast control ──────

    start(options?: ScreencastOptions): void {
        dbg('start() — sending start message. options:', options ? JSON.stringify(options) : 'none', '| ws.readyState:', this.ws?.readyState);
        this.send({ type: 'start', options });
    }

    stop(): void {
        dbg('stop() — sending stop message');
        this.send({ type: 'stop' });
    }

    // ────── Input forwarding ──────

    /**
     * Send a mouse event. Coordinates are **normalized** (0-1).
     */
    sendMouse(action: 'move' | 'down' | 'up', x: number, y: number, button?: 'left' | 'right' | 'middle'): void {
        this.send({ type: 'mouse', action, x, y, button });
    }

    /**
     * Send a keyboard event.
     * @param modifiers Bitmask: Alt=1, Ctrl=2, Meta=4, Shift=8
     */
    sendKey(action: 'down' | 'up', key: string, code: string, modifiers?: number): void {
        dbg('sendKey():', action, key, code, 'modifiers:', modifiers);
        this.send({ type: 'key', action, key, code, modifiers });
    }

    /**
     * Send a scroll event. Coordinates are **normalized** (0-1).
     */
    sendScroll(deltaX: number, deltaY: number, x: number, y: number): void {
        this.send({ type: 'scroll', deltaX, deltaY, x, y });
    }

    navigate(url: string): void {
        dbg('navigate():', url);
        this.send({ type: 'navigate', url });
    }

    goBack(): void {
        dbg('goBack()');
        this.send({ type: 'go-back' });
    }

    goForward(): void {
        dbg('goForward()');
        this.send({ type: 'go-forward' });
    }

    resize(width: number, height: number): void {
        dbg('resize():', width, 'x', height);
        this.send({ type: 'resize', width, height });
    }

    // ────── Events ──────

    on<E extends EventName>(event: E, cb: ScreencastClientEvents[E]): this {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(cb as Listener<EventName>);
        dbg(`on('${event}') — listener registered, total for event:`, this.listeners.get(event)!.size);
        return this;
    }

    off<E extends EventName>(event: E, cb: ScreencastClientEvents[E]): this {
        this.listeners.get(event)?.delete(cb as Listener<EventName>);
        dbg(`off('${event}') — listener removed`);
        return this;
    }

    // ────── Cleanup ──────

    destroy(): void {
        dbg('destroy() called');
        this.destroyed = true;
        this.disconnect();
        this.listeners.clear();
        dbg('destroy() — ✅ complete');
    }

    // ────── Internals ──────

    private handleMessage(raw: unknown): void {
        let msg: ServerMessage;
        try {
            msg = JSON.parse(typeof raw === 'string' ? raw : String(raw)) as ServerMessage;
        } catch (err) {
            dbgWarn('handleMessage() — failed to parse JSON:', typeof raw === 'string' ? raw.slice(0, 100) : typeof raw);
            return; // Non-JSON data, ignore
        }

        switch (msg.type) {
            case 'frame': {
                _frameCount++;
                const now = Date.now();

                // Log every frame for the first 5, then every 30th or every 5 seconds
                if (_frameCount <= 5 || _frameCount % 30 === 0 || (now - _lastFrameLogTime) > 5000) {
                    _lastFrameSize = msg.data?.length ?? 0;
                    dbg(`📦 FRAME #${_frameCount} | sessionId: ${msg.sessionId} | dataLen: ${_lastFrameSize} | meta: ${msg.metadata?.deviceWidth}x${msg.metadata?.deviceHeight}`);
                    _lastFrameLogTime = now;
                }

                const listenerCount = this.listeners.get('frame')?.size ?? 0;
                if (_frameCount <= 3) {
                    dbg(`   → emitting 'frame' to ${listenerCount} listener(s)`);
                }
                if (listenerCount === 0 && _frameCount <= 3) {
                    dbgWarn('   ⚠️  NO frame listeners registered! Frames will be silently dropped.');
                }

                this.emit('frame', msg.data, msg.metadata);
                // ACKs are handled server-side now — no client ack needed
                break;
            }

            case 'nav-state':
                dbg('handleMessage(nav-state):', JSON.stringify({ url: msg.url?.slice(0, 60), canGoBack: msg.canGoBack, canGoForward: msg.canGoForward }));
                this.emit('nav-state', msg);
                break;

            case 'error':
                dbgErr('handleMessage(error) — server error:', msg.message);
                this.emit('error', msg.message);
                break;

            case 'ready':
                dbg('handleMessage(ready) — bound:', msg.bound);
                this.emit('ready', msg.bound);
                break;

            case 'stopped':
                dbg('handleMessage(stopped) — screencast stopped by server');
                // screencast was stopped server-side
                break;

            default:
                dbgWarn('handleMessage() — unknown message type:', (msg as any).type);
        }
    }

    private send(msg: ClientMessage): void {
        const isOpen = this.ws && this.ws.readyState === WebSocket.OPEN;

        // Log all sends except high-frequency ones (mouse, ack)
        if (msg.type !== 'mouse' && msg.type !== 'ack') {
            dbg(`send(${msg.type}) — ws open: ${isOpen}`);
        }

        if (isOpen) {
            try {
                this.ws!.send(JSON.stringify(msg));
            } catch (err) {
                dbgErr(`send(${msg.type}) — failed:`, err);
            }
        } else {
            if (msg.type !== 'mouse' && msg.type !== 'ack') {
                dbgWarn(`send(${msg.type}) — DROPPED, ws not open. readyState: ${this.ws?.readyState ?? 'null'}`);
            }
        }
    }

    private emit<E extends EventName>(event: E, ...args: Parameters<ScreencastClientEvents[E]>): void {
        const set = this.listeners.get(event);
        if (!set) return;
        for (const cb of set) {
            try {
                (cb as (...a: unknown[]) => void)(...args);
            } catch (err) {
                dbgErr(`emit('${event}') — listener threw:`, err);
            }
        }
    }

    private scheduleReconnect(): void {
        this.clearReconnectTimer();
        dbg('scheduleReconnect() — will reconnect in', this.reconnectDelay, 'ms');
        this.reconnectTimer = setTimeout(() => {
            if (!this.destroyed) {
                dbg('scheduleReconnect() — timer fired, calling connect()');
                this.connect();
            }
        }, this.reconnectDelay);
    }

    private clearReconnectTimer(): void {
        if (this.reconnectTimer !== null) {
            dbg('clearReconnectTimer() — clearing pending reconnect');
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
}
