import type { Transport, LivePatchPreloadResult, LicensePreloadResult } from '../transport/Transport';

/** Document-owned installation shared by startup, refresh and context recovery. */
export async function installDocumentRuntime(
  transport: Transport,
  patches: LivePatchPreloadResult,
  license: () => Promise<LicensePreloadResult>,
) {
  const livePatchApply = await transport.applyLivePatchArtifacts(patches);
  await transport.registerRuntimeEventBridgeBindings();
  const downloadedLicense = await transport.checkLicenseArtifact(await license());
  const licenseApply = downloadedLicense.status === 'missing' ? null : await transport.applyLicenseArtifact(downloadedLicense);
  // A rejected license is a feature-access result. Finish installing the public runtime.
  const licenseCheck = licenseApply ? { ...downloadedLicense, status: licenseApply.status,
    blockingFailure: false, detail: licenseApply.detail } : downloadedLicense;
  const initPatchApply = await transport.applyDeferredInitPatchArtifact();
  await transport.activateRuntimeEventBridge();
  return { livePatchApply, licenseCheck, licenseApply, initPatchApply };
}
