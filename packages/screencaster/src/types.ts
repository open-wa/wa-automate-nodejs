// ────────────────────────────────────────────────────────────
//  @open-wa/screencaster — Shared Protocol Types
//
//  Consumed by both the server (Node.js) and client (browser).
//  This file has ZERO runtime deps — pure type definitions + enums.
// ────────────────────────────────────────────────────────────

/**
 * Options for CDP Page.startScreencast.
 */
export interface ScreencastOptions {
    format?: 'jpeg' | 'png';
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    everyNthFrame?: number;
}

/**
 * Default screencast options.
 */
export const DEFAULT_SCREENCAST_OPTIONS: Required<ScreencastOptions> = {
    format: 'jpeg',
    quality: 80,
    maxWidth: 1280,
    maxHeight: 720,
    everyNthFrame: 1,
};

// ────── Server → Client Messages ──────

export interface FrameMessage {
    type: 'frame';
    /** base64-encoded image data */
    data: string;
    /** CDP session ID — must be ACK'd back to keep frames flowing */
    sessionId: number;
    metadata: {
        width: number;
        height: number;
        timestamp: number;
        offsetTop: number;
        pageScaleFactor: number;
        deviceWidth: number;
        deviceHeight: number;
    };
}

export interface NavStateMessage {
    type: 'nav-state';
    url: string;
    canGoBack: boolean;
    canGoForward: boolean;
}

export interface ErrorMessage {
    type: 'error';
    message: string;
}

export interface StoppedMessage {
    type: 'stopped';
}

export interface ReadyMessage {
    type: 'ready';
    /** Whether a page driver is currently bound */
    bound: boolean;
}

export type ServerMessage =
    | FrameMessage
    | NavStateMessage
    | ErrorMessage
    | StoppedMessage
    | ReadyMessage;

// ────── Client → Server Messages ──────

export interface StartMessage {
    type: 'start';
    options?: ScreencastOptions;
}

export interface StopMessage {
    type: 'stop';
}

export interface AckMessage {
    type: 'ack';
    sessionId: number;
}

export interface MouseMessage {
    type: 'mouse';
    action: 'move' | 'down' | 'up';
    /** Normalized X coordinate (0-1) */
    x: number;
    /** Normalized Y coordinate (0-1) */
    y: number;
    button?: 'left' | 'right' | 'middle';
}

export interface KeyMessage {
    type: 'key';
    action: 'down' | 'up';
    key: string;
    code: string;
    modifiers?: number;
}

export interface ScrollMessage {
    type: 'scroll';
    deltaX: number;
    deltaY: number;
    /** Normalized X coordinate (0-1) */
    x: number;
    /** Normalized Y coordinate (0-1) */
    y: number;
}

export interface NavigateMessage {
    type: 'navigate';
    url: string;
}

export interface GoBackMessage {
    type: 'go-back';
}

export interface GoForwardMessage {
    type: 'go-forward';
}

export type ClientMessage =
    | StartMessage
    | StopMessage
    | AckMessage
    | MouseMessage
    | KeyMessage
    | ScrollMessage
    | NavigateMessage
    | GoBackMessage
    | GoForwardMessage;

// ────── Minimal Page Interface ──────

/**
 * A minimal CDP-capable page interface.
 * This is a subset of IPage from @open-wa/driver-interface
 * that captures exactly what the screencaster needs.
 *
 * Consumers pass in an IPage from driver-interface; the factory
 * narrows it to this interface, keeping the screencaster decoupled
 * from any specific driver package.
 */
export interface IScreencastPage {
    /** Get a CDP session for sending raw CDP commands */
    cdp(): IScreencastCDPSession | Promise<IScreencastCDPSession>;

    /** Navigate to a URL */
    goto(url: string, options?: { waitUntil?: string }): Promise<void>;

    /** Reload the current page */
    reload(): Promise<void>;

    /** Check if the page has been closed */
    isClosed(): boolean;

    /** Get underlying driver for mouse/keyboard (opaque) */
    unwrap(): unknown;
}

export interface IScreencastCDPSession {
    send<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T>;
    detach(): Promise<void>;
}

/**
 * The CDP modifier key bitmask values.
 * Used to convert from the modifier bitmask to individual key states.
 */
export const Modifiers = {
    Alt: 1,
    Ctrl: 2,
    Meta: 4,
    Shift: 8,
} as const;

/**
 * Special keys that should be dispatched as raw key events
 * rather than typed as text.
 */
export const SPECIAL_KEYS = new Set([
    'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
    'Backspace', 'Enter', 'Escape', 'Delete', 'Home', 'End',
    'PageUp', 'PageDown', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6',
    'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
]);
