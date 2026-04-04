import type { Config, HttpMethodDefinition } from '@open-wa/schema';
import type { Hono } from 'hono';
import type { Server as SocketIOServer } from 'socket.io';
import type { ElasticEmitter } from './monitoring/elastic';

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
  getIO(): SocketIOServer | undefined;
}
