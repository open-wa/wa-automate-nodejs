#!/usr/bin/env node
import { main } from '@open-wa/cli';

main(process.argv.slice(2)).catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
