import PQueue from 'p-queue';

export const bgq = new PQueue({concurrency: 1});

const main_queue_concurrency = process.env.MAIN_Q_CONCURRENCY && Number(process.env.MAIN_Q_CONCURRENCY) || 1;

export const MainProcessHandlingQueue = new PQueue({
    concurrency: main_queue_concurrency,
    intervalCap: main_queue_concurrency,
    // interval: 10000,
    // timeout: 10000,
    carryoverConcurrencyCount: true
  })
  