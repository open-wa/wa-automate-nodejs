import type { Transport, LivePatchPreloadResult, LicensePreloadResult } from '../transport/Transport';

/** Document-owned installation shared by startup, refresh and context recovery. */
export async function installDocumentRuntime(
  transport: Transport,
  patches: LivePatchPreloadResult,
  license: () => Promise<LicensePreloadResult>,
  afterPublic?: () => Promise<void>,
) {
  const livePatchApply = await transport.applyLivePatchArtifacts(patches);
  if (livePatchApply.blockingFailure) throw new Error('Required public patches could not be installed.');
  await transport.registerRuntimeEventBridgeBindings();
  const capability = await transport.validateRuntimeCapabilityOnly('post_patch');
  if (!capability.usable) throw new Error('The patched WhatsApp runtime is unavailable.');
  await afterPublic?.();
  const downloadedLicense = await transport.checkLicenseArtifact(await license());
  const licenseApply = downloadedLicense.status === 'missing' ? null : await transport.applyLicenseArtifact(downloadedLicense);
  // A rejected license is a feature-access result. Finish installing the public runtime.
  const licenseCheck = licenseApply ? { ...downloadedLicense, status: licenseApply.status,
    blockingFailure: false, detail: licenseApply.detail } : downloadedLicense;
  const initPatchApply = await transport.applyDeferredInitPatchArtifact();
  if (initPatchApply.blockingFailure) throw new Error('Runtime initialization could not finish.');
  await transport.activateRuntimeEventBridge();
  return { livePatchApply, licenseCheck, licenseApply, initPatchApply };
}
