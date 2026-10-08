import type { Transport, LivePatchPreloadResult, LicensePreloadResult } from '../transport/Transport';

/** Document-owned installation shared by startup, refresh and context recovery. */
export async function installDocumentRuntime(
  transport: Transport,
  patches: LivePatchPreloadResult,
  license: () => Promise<LicensePreloadResult>,
  strictLicense = false,
  afterPublic?: () => Promise<void>,
) {
  const livePatchApply = await transport.applyLivePatchArtifacts(patches);
  if (livePatchApply.blockingFailure) throw new Error('Required public patches could not be installed.');
  await transport.registerRuntimeEventBridgeBindings();
  const capability = await transport.validateRuntimeCapabilityOnly('post_patch');
  if (!capability.usable) throw new Error('The patched WhatsApp runtime is unavailable.');
  await afterPublic?.();
  const licenseCheck = await transport.checkLicenseArtifact(await license());
  if (licenseCheck.blockingFailure || licenseCheck.status === 'invalid' || licenseCheck.status === 'expired'
    || (strictLicense && licenseCheck.status !== 'missing' && licenseCheck.status !== 'valid')) {
    throw new Error('The license could not be confirmed for this session.');
  }
  const licenseApply = licenseCheck.status === 'missing' ? null : await transport.applyLicenseArtifact(licenseCheck);
  if (licenseApply && (!licenseApply.applied || licenseApply.blockingFailure)) throw new Error('Licensed functionality could not be installed.');
  const initPatchApply = await transport.applyDeferredInitPatchArtifact();
  if (initPatchApply.blockingFailure) throw new Error('Runtime initialization could not finish.');
  await transport.activateRuntimeEventBridge();
  if (strictLicense) await transport.assertInstalledLicenseCapabilities();
  return { livePatchApply, licenseCheck, licenseApply, initPatchApply };
}
