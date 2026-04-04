import { describe, expect, it } from 'vitest';
import { ConfigSchema } from '../schema';

describe('config deprecation contract', () => {
  it('marks popup QR parity as downgraded instead of fully supported', () => {
    expect(ConfigSchema.shape.popup.description).toContain('Downgraded');
    expect(ConfigSchema.shape.popup.description).toContain('popup QR parity');
    expect(ConfigSchema.shape.qrPopUpOnly.description).toContain('Downgraded');
    expect(ConfigSchema.shape.qrPopUpOnly.description).toContain('not a guaranteed runtime contract');
  });

  it('marks JSON session restore as deprecated and points callers to userDataDir', () => {
    expect(ConfigSchema.shape.sessionData.description).toContain('Deprecated');
    expect(ConfigSchema.shape.sessionData.description).toContain('MD-obsolete');
    expect(ConfigSchema.shape.sessionData.description).toContain('userDataDir');

    expect(ConfigSchema.shape.sessionDataPath.description).toContain('Deprecated');
    expect(ConfigSchema.shape.sessionDataPath.description).toContain('userDataDir');

    expect(ConfigSchema.shape.skipSessionSave.description).toContain('Deprecated');
    expect(ConfigSchema.shape.skipSessionSave.description).toContain('MD-obsolete');
    expect(ConfigSchema.shape.skipSessionSave.description).toContain('userDataDir');
  });
});
