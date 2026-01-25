#!/usr/bin/env node
import meow from 'meow';
import chalk from 'chalk';
import { meowFlags, helpText, parseFlags } from './options.js';
import { start } from './commands/start.js';

const logo = `
${chalk.green('╔═══════════════════════════════════════════════════════════╗')}
${chalk.green('║')}  ${chalk.bold.white('open-wa')} ${chalk.gray('- WhatsApp Web Automation')}                        ${chalk.green('║')}
${chalk.green('║')}  ${chalk.cyan('https://github.com/open-wa/wa-automate-nodejs')}            ${chalk.green('║')}
${chalk.green('╚═══════════════════════════════════════════════════════════╝')}
`;

async function main(): Promise<void> {
  console.log(logo);
  
  const cli = meow(helpText, {
    flags: meowFlags as any,
  } as any);
  
  if (cli.flags.help) {
    cli.showHelp();
    return;
  }
  
  const options = parseFlags(cli.flags);
  
  if (options.debug) {
    console.log(chalk.yellow('Debug mode enabled'));
    console.log(chalk.gray('Options:'), options);
  }
  
  console.log(chalk.blue(`Starting session: ${chalk.bold(options.sessionId)}`));
  console.log(chalk.gray(`API will be available at: http://${options.host}:${options.port}`));
  
  try {
    await start(options);
    console.log(chalk.green('✓ Client started successfully'));
  } catch (err) {
    console.error(chalk.red('✗ Failed to start client:'), err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(chalk.red('Fatal error:'), err);
  process.exit(1);
});
