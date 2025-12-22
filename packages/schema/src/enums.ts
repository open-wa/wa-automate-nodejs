import { z } from 'zod';

/**
 * Action types for RBAC permissions
 * - read: Retrieve data (e.g., get contact, chat object)
 * - send: Create/send new content (e.g., send message, image, story)
 * - update: Modify existing data (e.g., update message, chat metadata, promote admin)
 * - delete: Remove data (e.g., delete chat, story, remove contact, demote admin)
 */
export const ActionEnum = z.enum([
    'read',
    'send',
    'update',
    'delete'
]);

export type ActionType = z.infer<typeof ActionEnum>;

/**
 * License tiers for feature gating
 * - none: Available to all users
 * - insiders: Requires insiders license
 * - restricted: Requires special/restricted license
 */
export const LicenseEnum = z.enum([
    'none',
    'insiders',
    'restricted'
]);

export type LicenseTier = z.infer<typeof LicenseEnum>;

/**
 * Functionality scope for WhatsApp account types
 * - both: Works on both business and personal accounts
 * - business-only: Only works on business accounts
 * - personal-only: Only works on personal accounts
 */
export const FunctionalityEnum = z.enum([
    'both',
    'business-only',
    'personal-only'
]);

export type FunctionalityScope = z.infer<typeof FunctionalityEnum>;

/**
 * HTTP methods for API mapping
 * - AUTO: Automatically inferred from action type or defaults to POST
 * - GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD: Standard HTTP methods
 */
export const HttpMethodEnum = z.enum([
    'AUTO',
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
    'OPTIONS',
    'HEAD'
]);

export type HttpMethod = z.infer<typeof HttpMethodEnum>;
