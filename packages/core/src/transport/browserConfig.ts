export const chromiumConfig = {
    WAUrl: 'https://web.whatsapp.com',
    width: 1440,
    height: 900,
    chromiumArgs: [
        // `--app=${WAUrl}`,
        '--log-level=3', // fatal only
        //'--start-maximized',
        '--no-default-browser-check',
        '--disable-site-isolation-trials',
        '--no-experiments',
        '--ignore-gpu-blacklist',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-default-apps',
        '--enable-features=NetworkService',
        '--disable-setuid-sandbox',
        '--no-sandbox',
        // Extras
        '--disable-webgl',
        '--disable-infobars',
        '--window-position=0,0',
        '--ignore-certifcate-errors',
        '--ignore-certifcate-errors-spki-list',
        '--disable-threaded-animation',
        '--disable-threaded-scrolling',
        '--disable-in-process-stack-traces',
        '--disable-histogram-customizer',
        '--disable-gl-extensions',
        '--disable-composited-antialiasing',
        '--disable-session-crashed-bubble',
        '--disable-canvas-aa',
        '--disable-3d-apis',
        '--disable-accelerated-2d-canvas',
        '--disable-accelerated-jpeg-decoding',
        '--disable-accelerated-mjpeg-decode',
        '--disable-app-list-dismiss-on-blur',
        '--disable-accelerated-video-decode',
        '--disable-dev-shm-usage',
        '--js-flags=--expose-gc',
        // '--incognito',
        //suggested in #563
        // '--single-process',
        // '--no-zygote',
        // '--renderer-process-limit=1',
        // '--no-first-run'
        '--disable-features=site-per-process',
        '--disable-gl-drawing-for-tests',
        //keep awake in all situations
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
    ]
};

/**
 * Chromium args known to crash WhatsApp Web on modern Chrome. Users copy these
 * from old low-RAM Puppeteer guides; they break the multi-process/frame model
 * and surface as "Navigating frame was detached" / "Attempted to use detached
 * Frame" crash loops (see issue #3350, #3303). Matched by prefix so
 * `--single-process` and any `--single-process=…` form are covered.
 */
export const DANGEROUS_BROWSER_ARGS = ['--single-process', '--no-zygote'] as const;

const argMatchesDangerous = (arg: string): boolean =>
    DANGEROUS_BROWSER_ARGS.some((bad) => arg === bad || arg.startsWith(`${bad}=`));

/**
 * Split user-supplied browser args into the ones that are safe to pass and the
 * dangerous ones. Pure so it can be unit-tested and reused by any launch path.
 */
export const partitionDangerousBrowserArgs = (
    args: readonly string[]
): { safe: string[]; dangerous: string[] } => {
    const safe: string[] = [];
    const dangerous: string[] = [];
    for (const arg of args) {
        (argMatchesDangerous(arg) ? dangerous : safe).push(arg);
    }
    return { safe, dangerous };
};

/**
 * Sanitize user browser args. By default, dangerous args are stripped and
 * reported. When `allowDangerous` is true they are kept (unsupported escape
 * hatch). `onRemoved` is invoked once with the stripped args when any are
 * removed, so callers can warn with their own logger.
 */
export const sanitizeBrowserArgs = (
    args: readonly string[] | undefined,
    options: { allowDangerous?: boolean; onRemoved?: (removed: string[]) => void } = {}
): string[] => {
    const list = args ?? [];
    if (options.allowDangerous) return [...list];

    const { safe, dangerous } = partitionDangerousBrowserArgs(list);
    if (dangerous.length > 0) options.onRemoved?.(dangerous);
    return safe;
};

export const createUserAgent = (waVersion: string): string => `WhatsApp/${waVersion} Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36`;
export const useragent = createUserAgent('2.2147.16')

export const width = chromiumConfig.width;
export const height = chromiumConfig.height;