import { afterEach, describe, expect, it, vi } from 'vitest';
import { installSettledFilterRow } from '../settledFilterRow';

class FakeElement {
    constructor(private readonly testId: string | null, private readonly estimatedWidth: number) { }

    getAttribute(name: string): string | null {
        return name === 'data-testid' ? this.testId : null;
    }

    get offsetWidth(): number {
        return this.estimatedWidth;
    }
}

describe('installSettledFilterRow', () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('gives the chat filter row room for every pill and leaves other widths alone', () => {
        class FakeHTMLElement extends FakeElement { }
        vi.stubGlobal('Element', FakeElement);
        vi.stubGlobal('HTMLElement', FakeHTMLElement);

        installSettledFilterRow();

        expect(new FakeHTMLElement('chat_list_filters_row', 240).offsetWidth).toBe(100_000);
        expect(new FakeHTMLElement('filter-button', 52.89).offsetWidth).toBe(52.89);
        expect(new FakeHTMLElement(null, 15).offsetWidth).toBe(15);
    });

    it('does nothing when the browser has no offsetWidth to wrap', () => {
        class Bare { }
        vi.stubGlobal('Element', Bare);
        vi.stubGlobal('HTMLElement', Bare);

        expect(() => installSettledFilterRow()).not.toThrow();
    });
});
