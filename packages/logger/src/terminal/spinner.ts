import ora, { type Ora } from 'ora';

let activeSpinner: Ora | null = null;

export function start(text: string): Ora {
    if (activeSpinner) {
        activeSpinner.stop();
    }

    activeSpinner = ora({
        text,
        color: 'cyan',
    }).start();

    return activeSpinner;
}

export function succeed(text?: string): void {
    if (activeSpinner) {
        activeSpinner.succeed(text);
        activeSpinner = null;
    }
}

export function fail(text?: string): void {
    if (activeSpinner) {
        activeSpinner.fail(text);
        activeSpinner = null;
    }
}

export function warn(text?: string): void {
    if (activeSpinner) {
        activeSpinner.warn(text);
        activeSpinner = null;
    }
}

export function info(text?: string): void {
    if (activeSpinner) {
        activeSpinner.info(text);
        activeSpinner = null;
    }
}

export function stop(): void {
    if (activeSpinner) {
        activeSpinner.stop();
        activeSpinner = null;
    }
}

export function update(text: string): void {
    if (activeSpinner) {
        activeSpinner.text = text;
    }
}
