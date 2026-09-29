import { z } from 'zod';
import { ContactIdSchema, GroupChatIdSchema, GroupIdSchema, IdSchema, ContactSchema, GroupMetadataSchema, MessageIdSchema, MessageSchema } from './common-types';

// Public data contracts retained from the v4 models and the shipped WAPI
// serializers. Optional provider fields stay optional; extensions stay unknown.
export const LabelSchema = z.object({
    id: z.string(), name: z.string(),
    items: z.array(z.object({ type: z.enum(['Chat', 'Contact', 'Message']), id: z.string() })),
}).passthrough();
export type Label = z.infer<typeof LabelSchema>;

export const NumberCheckSchema = z.object({
    id: z.union([IdSchema, ContactIdSchema]),
    status: z.unknown().describe('HTTP-like status code, or a provider error value when lookup fails.'), isBusiness: z.boolean().optional(),
    canReceiveMessage: z.boolean(), numberExists: z.boolean().optional(),
}).passthrough();
export type NumberCheck = z.infer<typeof NumberCheckSchema>;

export const CommonGroupSchema = z.object({ id: GroupIdSchema, title: z.string() }).passthrough();
export const GroupCreationResultSchema = z.object({
    gid: z.union([GroupIdSchema, IdSchema]),
    status: z.number().optional(),
    participants: z.union([z.record(z.string(), z.object({ code: z.number(), invite_code: z.string().optional(), invite_code_exp: z.string().optional() })), z.array(z.record(z.string(), z.unknown()))]).optional(),
}).passthrough();
export const CommunityMetadataSchema = GroupMetadataSchema.extend({ subGroups: z.array(GroupMetadataSchema) });
export const CommunityParticipantIdsSchema = z.object({ id: GroupChatIdSchema, participants: z.array(ContactIdSchema), subgroup: z.boolean() });
export const CommunityAdminIdsSchema = z.object({ id: GroupChatIdSchema, admins: z.array(ContactIdSchema), subgroup: z.boolean() });
export const CommunityParticipantsSchema = z.object({ id: GroupChatIdSchema, participants: z.array(ContactSchema), subgroup: z.boolean() });
export const CommunityAdminsSchema = z.object({ id: GroupChatIdSchema, admins: z.array(ContactSchema), subgroup: z.boolean() });
export const MessageInteractionSchema = z.object({ id: ContactIdSchema, t: z.number() });
export const MessageInfoSchema = z.object({
    id: MessageIdSchema, deliveryRemaining: z.number(), playedRemaining: z.number(), readRemaining: z.number(),
    delivery: z.array(MessageInteractionSchema), read: z.array(MessageInteractionSchema), played: z.array(MessageInteractionSchema),
}).passthrough();
export type MessageInfo = z.infer<typeof MessageInfoSchema>;
export const LLMMessageSchema = z.object({ role: z.enum(['user', 'assistant']), content: z.string() });
export const ContactStatusSchema = z.object({ id: z.string(), status: z.string() });
export const HostAccountSchema = z.object({ me: z.union([IdSchema, ContactIdSchema]) }).passthrough()
    .describe('Host account attributes plus the current account ID. Additional WhatsApp Web attributes vary by version.');
export const HealthCheckSchema = z.object({
    queuedMessages: z.number().optional(), state: z.string().optional(), isPhoneDisconnected: z.boolean().optional(),
    isHere: z.boolean().optional(), wapiInjected: z.boolean().optional(), online: z.boolean().optional(),
    tryingToReachPhone: z.boolean().optional(), retryingIn: z.number().optional(), batteryLow: z.boolean().optional(),
}).passthrough().describe('Browser health diagnostics. This is not the Easy API /health HTTP envelope.');
export const LicenseTypeSchema = z.enum(['CUSTOM', 'B2B_RESTRICTED_VOLUME_LICENSE', 'Insiders Program', 'Text Story License Key', 'Image Story License Key', 'Video Story License Key', 'Premium License Key', 'NONE']);
export const ProductSchema = z.object({
    id: z.string(), currency: z.string(), name: z.string().optional(), description: z.string().optional(),
    isHidden: z.boolean().optional(), catalogWid: z.string().optional(), url: z.string().optional(),
    availability: z.union([z.number(), z.literal('unknown')]).optional(),
    reviewStatus: z.enum(['NO_REVIEW', 'PENDING', 'REJECTED', 'APPROVED', 'OUTDATED']).optional(),
    imageCdnUrl: z.string().optional(), imageCount: z.number().optional(), additionalImageCdnUrl: z.array(z.string()).optional(),
    priceAmount1000: z.number().optional(), retailerId: z.string().optional(), t: z.number().optional(),
}).passthrough();
export const CartItemSchema = z.object({ id: z.string(), name: z.string(), qty: z.number(), thumbnailId: z.string(), thumbnailUrl: z.string() });
export const OrderSchema = z.object({
    id: z.string(), createdAt: z.number(), currency: z.string(), products: z.array(CartItemSchema),
    sellerJid: z.string(), subtotal: z.string(), total: z.string(), message: MessageSchema.optional(),
}).passthrough();
export const BusinessProfileSchema = z.object({
    id: ContactIdSchema, tag: z.string().optional(), description: z.string().optional(),
    categories: z.array(z.object({ id: z.string(), localized_display_name: z.string() })).optional(),
    profileOptions: z.object({ commerceExperience: z.enum(['catalog', 'none', 'shop']), cartEnabled: z.boolean() }).optional(),
    email: z.string().optional(), website: z.array(z.string()).optional(),
    businessHours: z.object({ config: z.record(z.string(), z.object({ mode: z.enum(['specific_hours', 'open_24h', 'appointment_only']), hours: z.array(z.array(z.number())) })), timezone: z.string() }).optional(),
    catalogStatus: z.string().optional(), address: z.string().optional(), fbPage: z.unknown().optional(), igProfessional: z.unknown().optional(),
    isProfileLinked: z.boolean().optional(), coverPhoto: z.object({ id: z.string(), url: z.string() }).optional(),
    latitude: z.number().optional(), longitude: z.number().optional(),
}).passthrough();
export type BusinessProfile = z.infer<typeof BusinessProfileSchema>;
export type Product = z.infer<typeof ProductSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type HealthCheck = z.infer<typeof HealthCheckSchema>;
export type HostAccount = z.infer<typeof HostAccountSchema>;

// No fixed public payload is available for these patch-supplied methods. Do not
// fabricate fields or let `any` disable narrowing for callers.
export const FeatureFlagsSchema = z.record(z.string(), z.unknown())
    .describe('WhatsApp feature flags keyed by name. Values are provider-defined and must be narrowed before use.');
export const ProcessStatsSchema = z.record(z.string(), z.unknown())
    .describe('Process diagnostics keyed by process ID. The provider controls each entry; no stable entry shape is guaranteed.');
// Provisional profile contract: reuse the public contact serializer's fields,
// but do not require them until the licensed provider payload is established.
// Keep extensions unknown rather than inventing additional profile properties.
export const NumberProfileSchema = ContactSchema.partial()
    .describe('Provisional number profile based on the public Contact fields. Fields are optional and additional provider fields are unknown. The licensed getNumberProfile payload has not been verified against this model.');

// The v4 getMyStoryArray and onStory contracts use Message. Reuse that model
// for story entries, allowing provider payloads to omit hydrated chat/sender data.
export const StorySchema = MessageSchema.omit({ chat: true, sender: true }).extend({
    chat: MessageSchema.shape.chat.nullable().optional(),
    sender: ContactSchema.nullable().optional(),
})
    .describe('Message-shaped status entry, based on the legacy story API. Chat and sender may be absent or null. The licensed getStories payload has not been verified against this model.');

export type CommonGroup = z.infer<typeof CommonGroupSchema>;

export type GroupCreationResult = z.infer<typeof GroupCreationResultSchema>;

export type CommunityMetadata = z.infer<typeof CommunityMetadataSchema>;

export type CommunityParticipantIds = z.infer<typeof CommunityParticipantIdsSchema>;

export type CommunityAdminIds = z.infer<typeof CommunityAdminIdsSchema>;

export type CommunityParticipants = z.infer<typeof CommunityParticipantsSchema>;

export type CommunityAdmins = z.infer<typeof CommunityAdminsSchema>;

export type MessageInteraction = z.infer<typeof MessageInteractionSchema>;

export type LLMMessage = z.infer<typeof LLMMessageSchema>;

export type ContactStatus = z.infer<typeof ContactStatusSchema>;

export type LicenseType = z.infer<typeof LicenseTypeSchema>;

export type CartItem = z.infer<typeof CartItemSchema>;

export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;

export type ProcessStats = z.infer<typeof ProcessStatsSchema>;

export type NumberProfile = z.infer<typeof NumberProfileSchema>;

export type Story = z.infer<typeof StorySchema>;
