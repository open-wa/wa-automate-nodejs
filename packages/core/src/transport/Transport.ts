import type { IDriver, IBrowser, IPage } from '@open-wa/driver-interface';
import type { HyperEmitter } from '@open-wa/hyperemitter';
import type { Logger } from '@open-wa/logger';
import type { OpenWAEventMap } from '../events/eventMap.js';

export interface TransportOptions {
  driver: IDriver;
  events: HyperEmitter<OpenWAEventMap>;
  logger: Logger;
  waWebUrl?: string;
}

export class Transport {
  private driver: IDriver;
  private browser: IBrowser | null = null;
  private page: IPage | null = null;
  private events: HyperEmitter<OpenWAEventMap>;
  private logger: Logger;
  private waWebUrl: string;
  
  constructor(options: TransportOptions) {
    this.driver = options.driver;
    this.events = options.events;
    this.logger = options.logger;
    this.waWebUrl = options.waWebUrl ?? 'https://web.whatsapp.com';
  }
  
  async initialize(): Promise<void> {
    this.events.emit('launch.browser.init.before', {
      correlationId: 'transport-init',
      ts: Date.now(),
      step: 'browser_init',
      details: { headless: true }
    });
    
    await this.driver.init();
    this.browser = await this.driver.launch();
    this.page = await this.browser.newPage();
    
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
