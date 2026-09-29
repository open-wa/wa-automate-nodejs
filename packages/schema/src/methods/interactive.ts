import { z } from 'zod';
import { defineMethodV2 } from '../registry';
import { toParam } from '../parameters';
import { InteractiveContentSchema, JsonObjectSchema } from '../interactive';

export const SendInteractiveInputSchema = z.object({ to: toParam, content: InteractiveContentSchema }).strict();
export const SendRawMessageInputSchema = z.object({ to: toParam, payload: JsonObjectSchema }).strict();
export const sendInteractive = defineMethodV2('sendInteractive', {
  meta: {
    description: 'Send a portable interactive message document (Insiders and above)',
    namespace: 'messages', action: 'send', license: 'insiders', functionality: 'both', httpMethod: 'POST',
  },
  input: SendInteractiveInputSchema, parameterOrder: ['to', 'content'], output: z.string(),
});
export const sendRawMessage = defineMethodV2('sendRawMessage', {
  meta: {
    description: 'Send a constructed WhatsApp protobuf Message payload (Insiders and above); media must already be uploaded',
    namespace: 'messages', action: 'send', license: 'insiders', functionality: 'both', httpMethod: 'POST',
  },
  input: SendRawMessageInputSchema, parameterOrder: ['to', 'payload'], output: z.string(),
});
