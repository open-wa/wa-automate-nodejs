/**
 * Censor functions for use in application code before logging
 */

export function censorEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!local || !domain) return email;
    const visibleChars = Math.min(3, Math.floor(local.length / 2));
    return `${local.slice(0, visibleChars)}***@${domain}`;
}

export function censorPhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    const visible = 4;
    return `***${digits.slice(-visible)}`;
}

export function censorWid(wid: string): string {
    // WhatsApp ID format: 1234567890@c.us
    const [number] = wid.split('@');
    return `***${number.slice(-4)}@c.us`;
}

export function censorToken(token: string, visibleChars = 8): string {
    if (token.length <= visibleChars) return '[REDACTED]';
    return `${token.slice(0, visibleChars)}...[${token.length} chars]`;
}

export function censorMessageBody(body: string, maxLength = 50): string {
    if (body.length <= maxLength) return '[message content hidden]';
    return `[message content hidden, ${body.length} chars]`;
}

/**
 * Censor an entire object, useful for logging request/response payloads
 */
export function censorObject<T extends Record<string, any>>(
    obj: T,
    fields: string[]
): T {
    const result = { ...obj };

    for (const field of fields) {
        if (field in result) {
            result[field as keyof T] = '[CENSORED]' as any;
        }
    }

    return result;
}
