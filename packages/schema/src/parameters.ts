import { z } from 'zod';
import { parameterRegistry } from './registry';
import {
    ChatIdSchema,
    ContactIdSchema,
    GroupIdSchema,
    MessageIdSchema,
    FileToDataUrlSchema,
} from './codecs';

export const chatIdParam = ChatIdSchema.describe('Chat ID (phone number or formatted ID)').register(
    parameterRegistry,
    {
        example: '447123456789@c.us',
        brandedType: 'ChatId',
        formatDescription: 'A contact ID, group ID, or LID JID',
        pattern: '^\\d+(-\\d+)?@(c|g)\\.us$|^\\d+@lid$',
        keyAliases: ['id', 'contactId'],
    }
);

export const contactIdParam = ContactIdSchema.describe('Contact ID').register(parameterRegistry, {
    example: '447123456789@c.us',
    brandedType: 'ContactId',
    formatDescription: 'A WhatsApp contact JID',
    pattern: '^\\d+@c\\.us$',
    keyAliases: ['id'],
});

export const groupIdParam = GroupIdSchema.describe('Group chat ID').register(parameterRegistry, {
    example: '447123456789-1445627445@g.us',
    brandedType: 'GroupChatId',
    formatDescription: 'A WhatsApp group JID',
    pattern: '^\\d+(-\\d+)?@g\\.us$',
    keyAliases: ['chatId', 'groupChatId'],
    deprecatedKeyAliases: ['groupChatId'],
});

export const communityIdParam = GroupIdSchema.describe('Community ID').register(parameterRegistry, {
    example: '447123456789-1445627445@g.us',
    brandedType: 'GroupChatId',
    formatDescription: 'A WhatsApp community JID',
    pattern: '^\\d+(-\\d+)?@g\\.us$',
});

export const messageIdParam = MessageIdSchema.describe('Message ID').register(parameterRegistry, {
    example: 'false_447123456789@c.us_9C4D0965EA5C09D591334AB6BDB07FEB',
    brandedType: 'MessageId',
    formatDescription: 'A WhatsApp message identifier',
    pattern: '^(true|false)_.+_.+$',
    keyAliases: ['id', 'msgId'],
    deprecatedKeyAliases: ['msgId'],
});

export const toParam = ChatIdSchema.describe('Recipient chat ID').register(parameterRegistry, {
    example: '447123456789@c.us',
    brandedType: 'ChatId',
    formatDescription: 'The target chat for a send operation',
    pattern: '^\\d+(-\\d+)?@(c|g)\\.us$|^\\d+@lid$',
    keyAliases: ['chatId'],
});

export const contentParam = z.string().min(1).brand('Content').describe('Message content').register(
    parameterRegistry,
    {
        example: 'Hello, world!',
        brandedType: 'Content',
        keyAliases: ['text', 'body', 'message'],
    }
);

export const captionParam = z.string().optional().describe('Media caption').register(parameterRegistry, {
    example: 'Check out this image!',
});

export const filenameParam = z.string().optional().describe('Filename with extension').register(
    parameterRegistry,
    {
        example: 'document.pdf',
    }
);

export const userAgentParam = z.string().optional().describe('User agent string').register(
    parameterRegistry,
    {
        example: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        keyAliases: ['userA'],
        deprecatedKeyAliases: ['userA'],
    }
);

export const nameParam = z.string().describe('Display name').register(parameterRegistry, {
    example: 'OpenWA Bot',
    keyAliases: ['newName'],
    deprecatedKeyAliases: ['newName'],
});

export const statusTextParam = z.string().describe('Status text').register(parameterRegistry, {
    example: 'Available',
    keyAliases: ['newStatus'],
    deprecatedKeyAliases: ['newStatus'],
});

export const imageDataParam = FileToDataUrlSchema.describe(
    'Image file (path, URL, DataURL, or Base64)'
).register(parameterRegistry, {
    example: 'data:image/png;base64,iVBORw0KGgo...',
    brandedType: 'DataURL',
});

export const fileDataParam = FileToDataUrlSchema.describe(
    'File (path, URL, DataURL, Base64, or Buffer)'
).register(parameterRegistry, {
    example: 'data:application/pdf;base64,JVBERi0xLjQK...',
    brandedType: 'DataURL',
});

export const audioDataParam = FileToDataUrlSchema.describe(
    'Audio file (path, URL, DataURL, or Base64)'
).register(parameterRegistry, {
    example: 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAA...',
    brandedType: 'DataURL',
});

export const videoDataParam = FileToDataUrlSchema.describe(
    'Video file (path, URL, DataURL, or Base64)'
).register(parameterRegistry, {
    example: 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21...',
    brandedType: 'DataURL',
});

export const documentDataParam = FileToDataUrlSchema.describe(
    'Document file (path, URL, DataURL, or Base64)'
).register(parameterRegistry, {
    example: 'data:application/pdf;base64,JVBERi0xLjQK...',
    brandedType: 'DataURL',
});

export const stickerDataParam = FileToDataUrlSchema.describe(
    'Sticker file (path, URL, DataURL, or Base64)'
).register(parameterRegistry, {
    example: 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAw...',
    brandedType: 'DataURL',
});

export const latitudeParam = z.union([z.number(), z.string()]).describe('Latitude coordinate').register(
    parameterRegistry,
    {
        example: 51.5074,
    }
);

export const longitudeParam = z.union([z.number(), z.string()]).describe('Longitude coordinate').register(
    parameterRegistry,
    {
        example: -0.1278,
    }
);

export const locationNameParam = z.string().optional().describe('Location name or description').register(
    parameterRegistry,
    {
        example: 'London, UK',
    }
);

export const waitForIdParam = z.boolean().optional().default(false).describe('Wait for message ID').register(
    parameterRegistry,
    {
        example: true,
    }
);

export const includeMeParam = z.boolean().optional().default(true).describe('Include own messages').register(
    parameterRegistry,
    {
        example: true,
    }
);

export const includeNotificationsParam = z
    .boolean()
    .optional()
    .default(false)
    .describe('Include notification messages')
    .register(parameterRegistry, {
        example: false,
    });

export const onlyLocalParam = z.boolean().optional().default(false).describe('Delete only locally').register(
    parameterRegistry,
    {
        example: false,
    }
);

export const skipMyMessagesParam = z
    .boolean()
    .optional()
    .default(false)
    .describe('Skip own messages')
    .register(parameterRegistry, {
        example: false,
    });

export const withNewMessagesOnlyParam = z
    .boolean()
    .optional()
    .default(false)
    .describe('Only chats with unread messages')
    .register(parameterRegistry, {
        example: false,
    });

export const messageIdsParam = z
    .union([z.array(messageIdParam), messageIdParam])
    .describe('Message ID(s) to process')
    .register(parameterRegistry, {
        example: ['false_447123456789@c.us_ABC123', 'false_447123456789@c.us_DEF456'],
        brandedType: 'MessageId[]',
        keyAliases: ['messages'],
    });

export const mentionedJidListParam = z
    .array(contactIdParam)
    .optional()
    .describe('List of mentioned contact IDs')
    .register(parameterRegistry, {
        example: ['447123456789@c.us', '441234567890@c.us'],
    });

export const messageOptionsParam = z.any().optional().describe('Additional message options').register(
    parameterRegistry,
    {
        example: { quotedMsg: 'messageId', mentionedJidList: ['447123456789@c.us'] },
    }
);
