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
    }

    // ────── State ──────

    get state(): ScreencastClientState {
        return this._state;
    }

    private setState(s: ScreencastClientState): void {
        if (this._state === s) return;
        this._state = s;
        this.emit('state-change', s);
    }

    // ────── Connection ──────

    connect(): void {
        if (this.ws || this.destroyed) return;

        this.setState('connecting');
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            this.setState('streaming');
            if (this.autoStart) {
                this.start(this.defaultOptions);
            }
        };

        this.ws.onmessage = (event) => {
            this.handleMessage(event.data);
        };

        this.ws.onerror = () => {
            this.setState('error');
            this.emit('error', 'WebSocket connection failed');
        };

        this.ws.onclose = () => {
            this.ws = null;

            if (this._state !== 'error') {
                this.setState('idle');
            }

            if (this.autoReconnect && !this.destroyed) {
                this.scheduleReconnect();
            }
        };
    }

    disconnect(): void {
        this.clearReconnectTimer();
        if (this.ws) {
            this.ws.close(1000, 'Client disconnect');
            this.ws = null;
        }
        this.setState('idle');
    }

    // ────── Screencast control ──────

    start(options?: ScreencastOptions): void {
        this.send({ type: 'start', options });
    }

    stop(): void {
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
        this.send({ type: 'key', action, key, code, modifiers });
    }

    /**
     * Send a scroll event. Coordinates are **normalized** (0-1).
     */
    sendScroll(deltaX: number, deltaY: number, x: number, y: number): void {
        this.send({ type: 'scroll', deltaX, deltaY, x, y });
    }

    navigate(url: string): void {
        this.send({ type: 'navigate', url });
    }

    goBack(): void {
        this.send({ type: 'go-back' });
    }

    goForward(): void {
        this.send({ type: 'go-forward' });
    }

    resize(width: number, height: number): void {
        this.send({ type: 'resize', width, height });
    }

    // ────── Events ──────

    on<E extends EventName>(event: E, cb: ScreencastClientEvents[E]): this {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(cb as Listener<EventName>);
        return this;
    }

    off<E extends EventName>(event: E, cb: ScreencastClientEvents[E]): this {
        this.listeners.get(event)?.delete(cb as Listener<EventName>);
        return this;
    }

    // ────── Cleanup ──────

    destroy(): void {
        this.destroyed = true;
        this.disconnect();
        this.listeners.clear();
    }

    // ────── Internals ──────

    private handleMessage(raw: unknown): void {
        let msg: ServerMessage;
        try {
            msg = JSON.parse(typeof raw === 'string' ? raw : String(raw)) as ServerMessage;
        } catch {
            return; // Non-JSON data, ignore
        }

        switch (msg.type) {
            case 'frame':
                this.emit('frame', msg.data, msg.metadata);
                // Auto-acknowledge the frame
                this.send({ type: 'ack', sessionId: msg.sessionId });
                break;

            case 'nav-state':
                this.emit('nav-state', msg);
                break;

            case 'error':
                this.emit('error', msg.message);
                break;

            case 'ready':
                this.emit('ready', msg.bound);
                break;

            case 'stopped':
                // screencast was stopped server-side
                break;
        }
    }

    private send(msg: ClientMessage): void {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(msg));
        }
    }

    private emit<E extends EventName>(event: E, ...args: Parameters<ScreencastClientEvents[E]>): void {
        const set = this.listeners.get(event);
        if (!set) return;
        for (const cb of set) {
            try {
                (cb as (...a: unknown[]) => void)(...args);
            } catch (err) {
                console.error(`[screencaster-client] Error in '${event}' listener:`, err);
            }
        }
    }

    private scheduleReconnect(): void {
        this.clearReconnectTimer();
        this.reconnectTimer = setTimeout(() => {
            if (!this.destroyed) {
                this.connect();
            }
        }, this.reconnectDelay);
    }

    private clearReconnectTimer(): void {
        if (this.reconnectTimer !== null) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
}
