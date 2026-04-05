#!/usr/bin/env node
import { main, parseCliArgs, start } from './cli-runtime';
import { getCliOutputSink } from './cli/output-sink';

export { main, parseCliArgs, start };

if (require.main === module) {
    main().catch((err: any) => {
        getCliOutputSink().write({ level: 'error', message: `Failed to start: ${err instanceof Error ? err.message : String(err)}` });
        process.exit(1);
    });
}
