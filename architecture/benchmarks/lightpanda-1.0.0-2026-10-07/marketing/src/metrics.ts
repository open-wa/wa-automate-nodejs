import evidence from '../../results.json';

const chrome = evidence.summaries.find((item) => item.engine === 'chrome' && item.concurrency === 1)!;
const lightpanda = evidence.summaries.find((item) => item.engine === 'lightpanda' && item.concurrency === 1)!;

export const metrics = {
  chromeMemory: chrome.peakTreeRssMiB.median,
  lightpandaMemory: lightpanda.peakTreeRssMiB.median,
  memoryReduction: (1 - lightpanda.peakTreeRssMiB.median / chrome.peakTreeRssMiB.median) * 100,
  chromeLaunch: chrome.coldReadyMs.median,
  lightpandaLaunch: lightpanda.coldReadyMs.median,
  launchMultiplier: chrome.coldReadyMs.median / lightpanda.coldReadyMs.median,
  chromeWarm: chrome.warmWorkloadMs.median,
  lightpandaWarm: lightpanda.warmWorkloadMs.median,
  warmMultiplier: chrome.warmWorkloadMs.median / lightpanda.warmWorkloadMs.median,
};
