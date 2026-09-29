import { z } from 'zod';

/** HTTP omits undefined results; void/undefined are not JSON data values. */
export function outputJsonSchema(schema: z.ZodType) {
    return z.toJSONSchema(schema, {
        target: 'openapi-3.0',
        unrepresentable: 'any',
        override: ({ zodSchema, jsonSchema }) => {
            const kind = zodSchema._zod.def.type;
            if (kind === 'void' || kind === 'undefined') {
                jsonSchema.not = {};
                jsonSchema.description = 'No JSON value; the response data property is omitted.';
            }
        },
    });
}

export function successResponseSchema(schema: z.ZodType) {
    return {
        type: 'object',
        required: schema.isOptional() ? ['success'] : ['success', 'data'],
        properties: {
            success: { type: 'boolean', enum: [true] },
            data: outputJsonSchema(schema),
        },
    };
}
