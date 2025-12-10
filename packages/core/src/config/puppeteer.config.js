"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.height = exports.width = exports.puppeteerConfig = exports.useragent = exports.createUserAgent = void 0;
const puppeteerConfig = {
    WAUrl: 'https://web.whatsapp.com',
    width: 1440,
    height: 900,
    chromiumArgs: [
        '--log-level=3',
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
        '--disable-features=site-per-process',
        '--disable-gl-drawing-for-tests',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
    ]
};
exports.puppeteerConfig = puppeteerConfig;
const createUserAgent = (waVersion) => `WhatsApp/${waVersion} Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36`;
exports.createUserAgent = createUserAgent;
exports.useragent = (0, exports.createUserAgent)('2.2147.16');
exports.width = puppeteerConfig.width;
exports.height = puppeteerConfig.height;
//# sourceMappingURL=puppeteer.config.js.map