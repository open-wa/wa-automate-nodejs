"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.height = exports.width = exports.puppeteerConfig = exports.createUserAgent = exports.useragent = void 0;
const puppeteerConfig = {
    WAUrl: 'https://web.whatsapp.com',
    width: 1440,
    height: 900,
    chromiumArgs: [
        // `--app=${WAUrl}`,
        '--log-level=3',
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
        '--disable-canvas-aa',
        '--disable-3d-apis',
        '--disable-accelerated-2d-canvas',
        '--disable-accelerated-jpeg-decoding',
        '--disable-accelerated-mjpeg-decode',
        '--disable-app-list-dismiss-on-blur',
        '--disable-accelerated-video-decode',
        '--disable-dev-shm-usage',
        '--incognito',
        //suggested in #563
        // '--single-process',
        // '--no-zygote',
        // '--renderer-process-limit=1',
        // '--no-first-run'
        '--disable-gl-drawing-for-tests'
    ]
};
exports.puppeteerConfig = puppeteerConfig;
exports.useragent = 'WhatsApp/2.2108.8 Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.90 Safari/537.36';
const createUserAgent = (waVersion) => `WhatsApp/${waVersion} Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36`;
exports.createUserAgent = createUserAgent;
exports.width = puppeteerConfig.width;
exports.height = puppeteerConfig.height;
