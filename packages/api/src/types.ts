import type { Config, HttpMethodDefinition } from '@open-wa/schema';
import type { Hono } from 'hono';
import type { ElasticEmitter } from './monitoring/elastic';
import type { EventBroadcaster } from './events/EventBroadcaster';

export type ClientMethodMap = Record<string, (...args: any[]) => Promise<any> | any>;
export type ClientSource = ClientMethodMap | undefined | (() => ClientMethodMap | undefined);

export interface ApiMiddlewareOptions {
  config: Config;
  basePath?: string;
  useSessionIdInPath?: boolean;
  methodDefinitions?: HttpMethodDefinition[];
  elasticEmitter?: ElasticEmitter;
  isSessionConnected?: () => boolean;
}

export interface RuntimeExplorerOptions {
  config: Config;
  methodDefinitions: HttpMethodDefinition[];
  origin: string;
}

export interface ApiServerOptions {
  config: Config;
}

export interface ApiServerLike {
  getApp(): Hono;
  getEventBroadcaster(): EventBroadcaster;
}
