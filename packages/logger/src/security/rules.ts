export interface SanitizationRule {
    /** Field name or pattern to match */
    pattern: string | RegExp;

    /** Replacement strategy */
    strategy: 'redact' | 'hash' | 'truncate' | 'remove';

    /** Options for the strategy */
    options?: {
        /** For 'truncate': how many chars to keep */
        keepChars?: number;

        /** For 'redact': replacement text */
        replacement?: string;
    };
}

export const DEFAULT_RULES: SanitizationRule[] = [
    // Tokens & secrets
    { pattern: /token/i, strategy: 'redact', options: { replacement: '[REDACTED]' } },
    { pattern: /secret/i, strategy: 'redact', options: { replacement: '[REDACTED]' } },
    { pattern: /apikey/i, strategy: 'redact', options: { replacement: '[REDACTED]' } },
    { pattern: /password/i, strategy: 'redact', options: { replacement: '[REDACTED]' } },
    { pattern: /authorization/i, strategy: 'redact', options: { replacement: '[REDACTED]' } },

    // Session/auth
    { pattern: /cookie/i, strategy: 'hash' },
    { pattern: /sessiondata/i, strategy: 'remove' },

    // PII (configurable)
    { pattern: /email/i, strategy: 'truncate', options: { keepChars: 3 } },
    { pattern: /phone/i, strategy: 'truncate', options: { keepChars: 4 } },

    // WhatsApp-specific
    { pattern: /wid/i, strategy: 'hash' }, // WhatsApp IDs
    { pattern: /body/i, strategy: 'remove' }, // Message bodies (unless explicitly allowed)
];
