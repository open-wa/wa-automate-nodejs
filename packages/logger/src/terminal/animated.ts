import chalk from 'chalk';
import logUpdate from 'log-update';

export interface ProgressOptions {
    total: number;
    label?: string;
    format?: 'bar' | 'percentage' | 'both';
}

export class ProgressLogger {
    private current = 0;
    private total: number;
    private label: string;
    private format: 'bar' | 'percentage' | 'both';

    constructor(options: ProgressOptions) {
        this.total = options.total;
        this.label = options.label || 'Progress';
        this.format = options.format || 'both';
    }

    update(current: number): void {
        this.current = current;
        const percentage = Math.floor((this.current / this.total) * 100);
        const barLength = 20;
        const filled = Math.floor((percentage / 100) * barLength);
        const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);

        let output = `${chalk.bold(this.label)}: `;

        if (this.format === 'bar' || this.format === 'both') {
            output += `[${chalk.cyan(bar)}] `;
        }

        if (this.format === 'percentage' || this.format === 'both') {
            output += `${chalk.yellow(percentage)}%`;
        }

        logUpdate(output);
    }

    done(message = 'Done!'): void {
        logUpdate.done();
        console.log(chalk.green(`✔ ${message}`));
    }
}
