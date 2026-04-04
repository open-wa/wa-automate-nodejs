#!/usr/bin/env node
import { main, parseCliArgs, start } from './cli-runtime';

export { main, parseCliArgs, start };

if (require.main === module) {
    main().catch((err: any) => {
        console.error('Failed to start:', err);
        process.exit(1);
    });
}
