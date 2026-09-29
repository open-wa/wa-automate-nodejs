import type { HostAccount } from '@open-wa/schema';
import type { Client } from '../Client';
import { createUnsupportedMethodStub } from '../runtimeSurface';

declare const WAPI: {
  getHostNumber: () => string;
  getWAVersion: () => string;
  getConnectionState: () => string;
  getBatteryLevel: () => number;
  getIsPlugged: () => boolean;
  getAmountOfLoadedMessages: () => number;
  getMe: () => HostAccount;
  getFeatures: () => Record<string, unknown>;
  getProcessStats: () => Record<string, unknown>;
  setMyName: (name: string) => boolean;
  setMyStatus: (status: string) => boolean;
};

export interface UtilitiesMethods {
  getHostNumber(): Promise<string>;
  getWAVersion(): Promise<string>;
  getConnectionState(): Promise<string>;
  getBatteryLevel(): Promise<number>;
  getIsPlugged(): Promise<boolean>;
  getAmountOfLoadedMessages(): Promise<number>;
  getMe(): Promise<HostAccount>;
  getFeatures(): Promise<Record<string, unknown>>;
  getProcessStats(): Promise<Record<string, unknown>>;
  setMyName(name: string): Promise<boolean>;
  setMyStatus(status: string): Promise<boolean>;
}

export function utilitiesMethods(client: Client): UtilitiesMethods {
  const evaluate = client.evaluate.bind(client);
  
  return {
    async getHostNumber(): Promise<string> {
      return evaluate(() => WAPI.getHostNumber(), undefined);
    },
    
    async getWAVersion(): Promise<string> {
      return evaluate(() => WAPI.getWAVersion(), undefined);
    },
    
    async getConnectionState(): Promise<string> {
      return evaluate(() => WAPI.getConnectionState(), undefined);
    },
    
    async getBatteryLevel(): Promise<number> {
      return evaluate(() => WAPI.getBatteryLevel(), undefined);
    },
    
    async getIsPlugged(): Promise<boolean> {
      return evaluate(() => WAPI.getIsPlugged(), undefined);
    },
    
    async getAmountOfLoadedMessages(): Promise<number> {
      return evaluate(() => WAPI.getAmountOfLoadedMessages(), undefined);
    },
    
    async getMe(): Promise<HostAccount> {
      return evaluate(() => WAPI.getMe(), undefined);
    },
    
    async getFeatures(): Promise<Record<string, unknown>> {
      return evaluate(() => WAPI.getFeatures(), undefined);
    },
    
    async getProcessStats(): Promise<Record<string, unknown>> {
      return evaluate(() => WAPI.getProcessStats(), undefined);
    },
    
    async setMyName(name: string): Promise<boolean> {
      return evaluate(
        ({ name }) => WAPI.setMyName(name),
        { name }
      );
    },
    
    async setMyStatus(status: string): Promise<boolean> {
      return evaluate(
        ({ status }) => WAPI.setMyStatus(status),
        { status }
      );
    }
  };
}
