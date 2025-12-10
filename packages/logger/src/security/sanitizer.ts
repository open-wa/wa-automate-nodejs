import crypto from 'crypto';
import type { LogContext } from '../core/context';
import { DEFAULT_RULES, type SanitizationRule } from './rules';

export class Sanitizer {
    private rules: SanitizationRule[];

    constructor(customRules: SanitizationRule[] = []) {
        this.rules = [...DEFAULT_RULES, ...customRules];
    }

    sanitize(context: LogContext): LogContext {
        const result: LogContext = {};

        for (const [key, value] of Object.entries(context)) {
            const rule = this.findRule(key);

            if (!rule) {
                result[key] = value;
                continue;
            }

            result[key] = this.applyRule(key, value, rule);
        }

        return result;
    }

    private findRule(key: string): SanitizationRule | null {
        return this.rules.find(rule => {
            if (typeof rule.pattern === 'string') {
                return key.toLowerCase() === rule.pattern.toLowerCase();
            }
            return rule.pattern.test(key);
        }) || null;
    }

    private applyRule(key: string, value: unknown, rule: SanitizationRule): unknown {
        if (typeof value !== 'string') {
            // For non-strings, only 'remove' makes sense
            return rule.strategy === 'remove' ? undefined : value;
        }

        switch (rule.strategy) {
            case 'redact':
                return rule.options?.replacement || '[REDACTED]';

            case 'hash':
                return this.hash(value);

            case 'truncate': {
                const keep = rule.options?.keepChars || 3;
                return value.length > keep
                    ? `${value.slice(0, keep)}...`
                    : value;
            }

            case 'remove':
                return undefined;

            default:
                return value;
        }
    }

    private hash(value: string): string {
        return crypto
            .createHash('sha256')
            .update(value)
            .digest('hex')
            .slice(0, 16);
    }
}

// Singleton instance
const defaultSanitizer = new Sanitizer();

export function sanitizeLogContext(context: LogContext): LogContext {
    return defaultSanitizer.sanitize(context);
}

export function createSanitizer(rules: SanitizationRule[]): Sanitizer {
    return new Sanitizer(rules);
}
