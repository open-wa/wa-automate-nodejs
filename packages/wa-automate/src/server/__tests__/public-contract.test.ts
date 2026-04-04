import { describe, expect, it } from 'vitest';
import { ConfigSchema } from '@open-wa/config';
import { createClient } from '@open-wa/core';
import * as waAutomate from '../../index';

describe('wa-automate public contract', () => {
  it('re-exports config truth from @open-wa/config and runtime bootstrap from @open-wa/core', () => {
    expect(waAutomate.ConfigSchema).toBe(ConfigSchema);
    expect(waAutomate.createClient).toBe(createClient);
  });

  it('keeps the top-level package focused on CLI and API runtime ownership plus passthrough compatibility exports', () => {
    expect(typeof waAutomate.WAServer).toBe('function');
    expect(typeof waAutomate.APILifecycleManager).toBe('function');
    expect(typeof waAutomate.SessionManager).toBe('function');
    expect(typeof waAutomate.runCli).toBe('function');
    expect(typeof waAutomate.startCli).toBe('function');
    expect(typeof waAutomate.parseCliArgs).toBe('function');
  });
});
