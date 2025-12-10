import chalk from 'chalk';
import figlet from 'figlet';

export interface BannerOptions {
    version?: string;
    subtitle?: string;
    color?: 'green' | 'blue' | 'cyan' | 'magenta' | 'yellow';
}

export function show(title: string, options: BannerOptions = {}): void {
    const ascii = figlet.textSync(title, {
        font: 'ANSI Shadow' as any, // Cast to any to avoid type issues with figlet fonts strict typing often missing
        horizontalLayout: 'default',
    });

    const colorFn = options.color ? chalk[options.color] : chalk.cyan;

    console.log('\n');
    console.log(colorFn(ascii));

    if (options.version) {
        console.log(chalk.gray(`  v${options.version}`));
    }

    if (options.subtitle) {
        console.log(chalk.gray(`  ${options.subtitle}`));
    }

    console.log('\n');
}

export function showProjectBanner(): void {
    // Safe require for package.json in a monorepo structure, might need adjustment depending on where this runs
    let version = 'unknown';
    try {
        version = require('../../package.json').version;
    } catch (e) {
        // ignore
    }

    show('open-wa', {
        version,
        subtitle: 'WhatsApp automation at scale',
        color: 'green',
    });
}
