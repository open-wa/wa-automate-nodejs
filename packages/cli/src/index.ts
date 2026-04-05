export { runCli as main, startCli as start, parseCliArgs } from '@open-wa/wa-automate';
export { parseCliLocalFlags } from './config/cli-flags-schema';
export { createOutputBroker, OutputBroker } from './runtime/output-broker';
export { CliShutdownError, performGracefulShutdown, writeVisibleFatalError } from './runtime/cli-termination';
export { detectOutputMode } from './runtime/output-mode';
export { createShutdownController, ShutdownController } from './runtime/shutdown-controller';
export { createEventProjectionStore, EventProjectionStore } from './state/event-projection-store';
