import { createLogger, terminal } from './src';

const logger = createLogger({
    component: 'verification-script',
    sessionId: 'test-session-1'
});

console.log('--- Testing Logger Levels ---');
logger.info('Info level message', { runId: 1 });
logger.warn('Warning level message');
logger.error('Error level message', { error: new Error('Test error') });

console.log('--- Testing Terminal UI ---');
terminal.banner.show('Logger Test');
const spinner = terminal.spinner.start('Testing spinner...');
setTimeout(() => {
    terminal.spinner.succeed('Spinner success!');
}, 1000);

console.log('Verification script finished.');
