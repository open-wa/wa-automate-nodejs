import type { IDriver, IBrowser, IPage } from '@open-wa/driver-interface';
import type { HyperEmitter } from '@open-wa/hyperemitter';
import type { Logger } from '@open-wa/logger';
import type { OpenWAEventMap } from '../events/eventMap.js';

export interface TransportOptions {
  driver: IDriver;
  events: HyperEmitter<OpenWAEventMap>;
  logger: Logger;
  waWebUrl?: string;
  headless?: boolean;
  qrTimeoutMs?: number;
  qrPollingMs?: number;
  executablePath?: string;
  browserArgs?: string[];
}

/** JavaScript snippet to extract QR data from the WA Web page */
const QR_CHECK_SCRIPT = `document.querySelector("canvas[aria-label]")?.parentElement?.getAttribute("data-ref") || null`;

export class Transport {
  private driver: IDriver;
  private browser: IBrowser | null = null;
  private page: IPage | null = null;
  private events: HyperEmitter<OpenWAEventMap>;
  private logger: Logger;
  private waWebUrl: string;
  private headless: boolean;
  private qrTimeoutMs: number;
  private qrPollingMs: number;
  private executablePath?: string;
  private browserArgs?: string[];
  private qrWatcherAbort: AbortController | null = null;
  private qrAttempt = 0;
  private lastQrData: string | null = null;
  
  constructor(options: TransportOptions) {
    this.driver = options.driver;
    this.events = options.events;
    this.logger = options.logger;
    this.waWebUrl = options.waWebUrl ?? 'https://web.whatsapp.com';
    this.headless = options.headless ?? true;
    this.qrTimeoutMs = options.qrTimeoutMs ?? 60000;
    this.qrPollingMs = options.qrPollingMs ?? 500;
    this.executablePath = options.executablePath;
    this.browserArgs = options.browserArgs;
  }
  
  async initialize(): Promise<void> {
    this.events.emit('launch.browser.init.before', {
      correlationId: 'transport-init',
      ts: Date.now(),
      step: 'browser_init',
      details: { headless: this.headless }
    });
    
    await this.driver.init();
    this.browser = await this.driver.launch({ 
      headless: this.headless,
      executablePath: this.executablePath,
      args: this.browserArgs,
    });
    this.page = await this.browser.newPage();
    
    await this.page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );
    
    this.events.emit('launch.browser.init.after', {
      correlationId: 'transport-init',
      ts: Date.now(),
      step: 'browser_init',
      details: {}
    });
    
    this.logger.info('transport_initialized', { driverName: this.driver.name });
  }
  
  async navigate(): Promise<void> {
    if (!this.page) {
      throw new Error('Transport not initialized');
    }
    
    this.events.emit('launch.navigation.gotoWaWeb.before', {
      correlationId: 'transport-nav',
      ts: Date.now(),
      step: 'navigation',
      details: { url: this.waWebUrl }
    });
    
    await this.page.goto(this.waWebUrl, { waitUntil: 'domcontentloaded' });
    
    this.events.emit('launch.navigation.gotoWaWeb.after', {
      correlationId: 'transport-nav',
      ts: Date.now(),
      step: 'navigation',
      details: { finalUrl: this.page.url() }
    });
    
    this.logger.info('transport_navigated', { url: this.waWebUrl });
  }
  
  async injectWapi(): Promise<boolean> {
    if (!this.page) {
      throw new Error('Transport not initialized');
    }
    
    this.events.emit('launch.wapi.inject.before', {
      correlationId: 'transport-inject',
      ts: Date.now(),
      step: 'wapi_inject',
      details: { injectPreApiScripts: true }
    });
    
    const success = true;
    
    this.events.emit('launch.wapi.inject.after', {
      correlationId: 'transport-inject',
      ts: Date.now(),
      step: 'wapi_inject',
      details: { success }
    });
    
    return success;
  }
  
  async waitForQr(): Promise<string | null> {
    if (!this.page) {
      throw new Error('Transport not initialized');
    }
    
    this.events.emit('launch.auth.qr.requested', {
      correlationId: 'qr-wait',
      ts: Date.now(),
      step: 'qr_wait',
      details: { smartQr: false }
    });
    
    this.qrWatcherAbort = new AbortController();
    const startTime = Date.now();
    
    return new Promise<string | null>((resolve) => {
      const poll = async () => {
        if (this.qrWatcherAbort?.signal.aborted) {
          return resolve(null);
        }
        
        if (Date.now() - startTime > this.qrTimeoutMs) {
          this.events.emit('launch.auth.timeout', {
            correlationId: 'qr-wait',
            ts: Date.now(),
            step: 'qr_timeout',
            details: { timeoutMs: this.qrTimeoutMs }
          });
          return resolve(null);
        }
        
        try {
          const qrData = await this.page!.evaluateScript<string | null>(QR_CHECK_SCRIPT);
          
          if (qrData && typeof qrData === 'string' && qrData !== this.lastQrData) {
            this.lastQrData = qrData;
            this.qrAttempt++;
            
            this.events.emit('launch.auth.qr.generated', {
              correlationId: 'qr-wait',
              ts: Date.now(),
              step: 'qr_generated',
              details: {
                qr: qrData,
                attemptInThisCycle: this.qrAttempt
              }
            });
            
            this.logger.info('qr_code_generated', { attempt: this.qrAttempt });
            return resolve(qrData);
          }
        } catch (err) {
          this.logger.debug('qr_check_error', { error: err });
        }
        
        setTimeout(poll, this.qrPollingMs);
      };
      
      poll();
    });
  }
  
  stopQrWatcher(): void {
    this.qrWatcherAbort?.abort();
    this.qrWatcherAbort = null;
  }
  
  async evaluate<Arg, Ret>(fn: (arg: Arg) => Ret | Promise<Ret>, arg: Arg): Promise<Ret> {
    if (!this.page) {
      throw new Error('Transport not initialized');
    }
    return this.page.evaluate(fn, arg);
  }
  
  getPage(): IPage | null {
    return this.page;
  }
  
  getBrowser(): IBrowser | null {
    return this.browser;
  }
  
  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.logger.info('transport_closed');
  }
}
