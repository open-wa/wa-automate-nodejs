import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const serve = vi.fn();
const connect = vi.fn();
const findFreePort = vi.fn();

vi.mock('@lightpanda/browser', () => ({
    serve,
}));

vi.mock('puppeteer', () => ({
    default: {
        connect,
    },
    connect,
}));

vi.mock('../port-utils', () => ({
    findFreePort,
}));

type MockWebSocketHandler = (() => void) | ((event: unknown) => void) | null;

class SuccessfulWebSocket {
    onopen: (() => void) | null = null;
    onerror: ((event: unknown) => void) | null = null;

    constructor(url: string) {
        expect(url).toBe('ws://127.0.0.1:9500');
        queueMicrotask(() => this.onopen?.());
    }

    close(): void {
        return;
    }
}

function createMockPage() {
    const page = {
        goto: vi.fn(async () => undefined),
        url: vi.fn(() => 'https://example.com'),
        reload: vi.fn(async () => undefined),
        mainFrame: vi.fn(() => ({
            url: () => 'https://example.com',
            name: () => 'main',
            parentFrame: () => null,
        })),
        evaluateOnNewDocument: vi.fn(async (...args: unknown[]) => typeof args[0] === 'string' ? 'init-script-id' : undefined),
        removeScriptToEvaluateOnNewDocument: vi.fn(async () => undefined),
        evaluate: vi.fn(async (input: unknown) => typeof input === 'string' ? 'script-result' : 'evaluate-result'),
        setViewport: vi.fn(async () => undefined),
        setUserAgent: vi.fn(async () => undefined),
        setRequestInterception: vi.fn(async () => undefined),
        waitForSelector: vi.fn(async () => null),
        waitForFunction: vi.fn(async () => undefined),
        $: vi.fn(async () => null),
        $$: vi.fn(async () => []),
        click: vi.fn(async () => undefined),
        type: vi.fn(async () => undefined),
        exposeFunction: vi.fn(async () => undefined),
        close: vi.fn(async () => undefined),
        isClosed: vi.fn(() => false),
        on: vi.fn((_event: string, _handler: MockWebSocketHandler) => undefined),
        off: vi.fn((_event: string, _handler: MockWebSocketHandler) => undefined),
    };

    return page;
}

function createMockBrowser(mockPage = createMockPage()) {
    const browser = {
        version: vi.fn(async () => 'Lightpanda/1.0.0'),
        newPage: vi.fn(async () => mockPage),
        pages: vi.fn(async () => [mockPage]),
        isConnected: vi.fn(() => true),
        close: vi.fn(async () => undefined),
    };

    return { browser, page: mockPage };
}

describe('Lightpanda runtime', () => {
    const originalWebSocket = globalThis.WebSocket;

    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();
        findFreePort.mockResolvedValue(9500);
        serve.mockReturnValue({ kill: vi.fn(() => true) });
        globalThis.WebSocket = SuccessfulWebSocket as typeof WebSocket;
    });

    afterEach(() => {
        globalThis.WebSocket = originalWebSocket;
    });

    it('launches by starting the Lightpanda process and then connecting via puppeteer', async () => {
        const { browser: puppeteerBrowser } = createMockBrowser();
        connect.mockResolvedValue(puppeteerBrowser);

        const { LightpandaDriver } = await import('../LightpandaDriver');
        const driver = new LightpandaDriver();

        const browser = await driver.launch({
            executablePath: '/tmp/lightpanda',
            timeoutMs: 4321,
        });

        expect(findFreePort).toHaveBeenCalledWith(9000, 1);
        expect(serve).toHaveBeenCalledWith(expect.objectContaining({
            host: '127.0.0.1',
            port: 9500,
            executablePath: '/tmp/lightpanda',
        }));
        expect(connect).toHaveBeenCalledWith({
            browserWSEndpoint: 'ws://127.0.0.1:9500',
            timeout: 4321,
        });
        expect(browser.unwrap()).toBe(puppeteerBrowser);
    });

    it('prefers nested Lightpanda runtime options when starting the process', async () => {
        const { browser: puppeteerBrowser } = createMockBrowser();
        connect.mockResolvedValue(puppeteerBrowser);
        findFreePort.mockResolvedValue(9500);

        const { LightpandaDriver } = await import('../LightpandaDriver');
        const driver = new LightpandaDriver();

        await driver.launch({
            executablePath: '/tmp/generic-lightpanda',
            timeoutMs: 4321,
            lightpanda: {
                executablePath: '/tmp/nested-lightpanda',
                portStart: 9400,
                host: '127.0.0.1',
                startupTimeoutMs: 9876,
                disableTelemetry: true,
            },
        });

        expect(findFreePort).toHaveBeenCalledWith(9400, 1);
        expect(serve).toHaveBeenCalledWith(expect.objectContaining({
            host: '127.0.0.1',
            port: 9500,
            executablePath: '/tmp/nested-lightpanda',
            disableTelemetry: true,
        }));
        expect(connect).toHaveBeenCalledWith({
            browserWSEndpoint: 'ws://127.0.0.1:9500',
            timeout: 4321,
        });
    });

    it('connects to an existing Lightpanda-compatible websocket endpoint', async () => {
        const { browser: puppeteerBrowser } = createMockBrowser();
        connect.mockResolvedValue(puppeteerBrowser);

        const { LightpandaDriver } = await import('../LightpandaDriver');
        const driver = new LightpandaDriver();

        const browser = await driver.connect({
            wsEndpoint: 'ws://127.0.0.1:9555',
            timeoutMs: 2500,
            headers: { Authorization: 'Bearer token' },
        });

        expect(connect).toHaveBeenCalledWith({
            browserWSEndpoint: 'ws://127.0.0.1:9555',
            headers: { Authorization: 'Bearer token' },
            timeout: 2500,
        });
        expect(browser.unwrap()).toBe(puppeteerBrowser);
    });

    it('delegates browser and page operations to the wrapped puppeteer instances', async () => {
        const { browser: puppeteerBrowser, page: puppeteerPage } = createMockBrowser();
        connect.mockResolvedValue(puppeteerBrowser);

        const { LightpandaDriver } = await import('../LightpandaDriver');
        const driver = new LightpandaDriver();
        const browser = await driver.launch();

        expect(browser.isConnected()).toBe(true);
        await expect(browser.versionString()).resolves.toBe('Lightpanda/1.0.0');

        const page = await browser.newPage();
        await page.goto('https://example.com', { waitUntil: 'load', timeoutMs: 1000 });
        expect(puppeteerPage.goto).toHaveBeenCalledWith('https://example.com', {
            waitUntil: 'load',
            timeout: 1000,
        });

        expect(page.url()).toBe('https://example.com');
        await page.reload();
        expect(puppeteerPage.reload).toHaveBeenCalled();

        await page.evaluate((value: string) => value, 'abc');
        expect(puppeteerPage.evaluate).toHaveBeenCalled();

        await expect(page.evaluateScript('window.location.href')).resolves.toBe('script-result');
        expect(puppeteerPage.evaluate).toHaveBeenCalledWith('window.location.href');

        await page.setViewport({ width: 1280, height: 720 });
        expect(puppeteerPage.setViewport).toHaveBeenCalledWith({ width: 1280, height: 720 });

        await page.setUserAgent('vault-tec');
        expect(puppeteerPage.setUserAgent).toHaveBeenCalledWith('vault-tec');

        await page.setRequestInterception(true);
        expect(puppeteerPage.setRequestInterception).toHaveBeenCalledWith(true);

        await page.waitForSelector('#app', { timeoutMs: 200 });
        expect(puppeteerPage.waitForSelector).toHaveBeenCalledWith('#app', { timeout: 200 });

        await page.waitForFunction('window.ready === true', { timeoutMs: 300, polling: 'mutation' });
        expect(puppeteerPage.waitForFunction).toHaveBeenCalledWith('window.ready === true', {
            timeout: 300,
            polling: 'mutation',
        });

        await page.click('#button');
        expect(puppeteerPage.click).toHaveBeenCalledWith('#button');

        await page.type('#input', 'hello', { delayMs: 25 });
        expect(puppeteerPage.type).toHaveBeenCalledWith('#input', 'hello', { delay: 25 });

        await page.exposeFunction('hello', () => 'world');
        expect(puppeteerPage.exposeFunction).toHaveBeenCalledWith('hello', expect.any(Function));

        const disposable = page.on('close', vi.fn());
        expect(puppeteerPage.on).toHaveBeenCalledWith('close', expect.any(Function));
        await disposable.dispose();
        expect(puppeteerPage.off).toHaveBeenCalledWith('close', expect.any(Function));

        const initScript = await page.addInitScript('window.__ready = true');
        await initScript.dispose();
        expect(puppeteerPage.removeScriptToEvaluateOnNewDocument).toHaveBeenCalledWith('init-script-id');

        await page.close();
        expect(puppeteerPage.close).toHaveBeenCalled();
        expect(page.isClosed()).toBe(false);
        expect(browser.pages()).resolves.toHaveLength(1);
    });

    it('closes the puppeteer browser and Lightpanda process exactly once', async () => {
        const process = { kill: vi.fn(() => true) };
        const { browser: puppeteerBrowser } = createMockBrowser();
        serve.mockReturnValue(process);
        connect.mockResolvedValue(puppeteerBrowser);

        const { LightpandaDriver } = await import('../LightpandaDriver');
        const driver = new LightpandaDriver();
        const browser = await driver.launch();

        await browser.close();
        await browser.close();

        expect(puppeteerBrowser.close).toHaveBeenCalledTimes(1);
        expect(process.kill).toHaveBeenCalledTimes(1);
    });

    it('stops the spawned process when puppeteer connection fails during launch', async () => {
        const process = { kill: vi.fn(() => true) };
        serve.mockReturnValue(process);
        connect.mockRejectedValue(new Error('socket hang up'));

        const { LightpandaDriver } = await import('../LightpandaDriver');
        const driver = new LightpandaDriver();

        await expect(driver.launch()).rejects.toMatchObject({
            name: 'LightpandaConnectError',
        });

        expect(process.kill).toHaveBeenCalledTimes(1);
    });

    it('rejects connect without a websocket endpoint', async () => {
        const { LightpandaDriver } = await import('../LightpandaDriver');
        const driver = new LightpandaDriver();

        await expect(driver.connect({})).rejects.toMatchObject({
            name: 'LightpandaConnectError',
        });
        expect(connect).not.toHaveBeenCalled();
    });

    it('emits startup diagnostics when logger context is provided via init', async () => {
        const { browser: puppeteerBrowser } = createMockBrowser();
        connect.mockResolvedValue(puppeteerBrowser);
        const info = vi.fn();

        const { LightpandaDriver } = await import('../LightpandaDriver');
        const driver = new LightpandaDriver();
        await driver.init({
            logger: {
                debug: vi.fn(),
                info,
                warn: vi.fn(),
                error: vi.fn(),
            },
        });

        await driver.launch();

        expect(info).toHaveBeenCalledWith('Lightpanda browser executable version', {
            host: '127.0.0.1',
            port: 9500,
            version: 'Lightpanda/1.0.0',
        });
    });
});
