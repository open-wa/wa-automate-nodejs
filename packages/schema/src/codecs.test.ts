import { chatIdCodec, contactIdCodec, groupIdCodec } from './codecs';

describe('Zod Codecs', () => {
    describe('chatIdCodec', () => {
        it('should convert regular phone number to @c.us', () => {
            expect(chatIdCodec.decode('447123456789')).toBe('447123456789@c.us');
        });

        it('should convert 18-digit number to @g.us', () => {
            expect(chatIdCodec.decode('123456789012345678')).toBe('123456789012345678@g.us');
        });

        it('should convert 14-digit non-Indonesian to @lid', () => {
            expect(chatIdCodec.decode('12345678901234')).toBe('12345678901234@lid');
        });

        it('should convert 14-digit Indonesian to @c.us', () => {
            expect(chatIdCodec.decode('62812345678901')).toBe('62812345678901@c.us');
        });

        it('should pass through already formatted IDs', () => {
            expect(chatIdCodec.decode('447123456789@c.us')).toBe('447123456789@c.us');
            expect(chatIdCodec.decode('123456789012345678@g.us')).toBe('123456789012345678@g.us');
            expect(chatIdCodec.decode('12345678901234@lid')).toBe('12345678901234@lid');
        });
    });

    describe('contactIdCodec', () => {
        it('should always convert to @c.us', () => {
            expect(contactIdCodec.decode('447123456789')).toBe('447123456789@c.us');
            expect(contactIdCodec.decode('447123456789@c.us')).toBe('447123456789@c.us');
        });
    });

    describe('groupIdCodec', () => {
        it('should always convert to @g.us', () => {
            expect(groupIdCodec.decode('123456789012345678')).toBe('123456789012345678@g.us');
            expect(groupIdCodec.decode('123456789012345678@g.us')).toBe('123456789012345678@g.us');
        });
    });
});
