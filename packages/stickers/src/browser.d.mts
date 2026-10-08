import type { BrowserBackend } from './index.mjs';
export interface BrowserEvaluator { evaluate<Argument, Result>(fn: (argument: Argument) => Result | Promise<Result>, argument: Argument): Promise<Result>; }
export function createBrowserBackend(driver?: BrowserEvaluator): BrowserBackend;
