/**
 * Lightpanda estimates layout instead of computing it, so an element's width changes with the
 * markup around it. WhatsApp fits the chat list's filter pills to the width of their row, and on
 * those estimates the fit never settles: two pills are re-mounted on every animation frame.
 * Lightpanda frees DOM nodes only when the page ends, so that loop grows the browser by about
 * 200 MiB a minute and keeps a CPU core busy. A row that always has room keeps every pill mounted.
 */
export function installSettledFilterRow(): void {
    // This function is sent to the page as source text, so it uses nothing from outside its body.
    const root = globalThis as any;
    const owner = [root.HTMLElement, root.Element]
        .map(type => type && type.prototype)
        .find(prototype => prototype && Object.getOwnPropertyDescriptor(prototype, 'offsetWidth'));
    const native = owner && Object.getOwnPropertyDescriptor(owner, 'offsetWidth');
    const read = native && native.get;
    if (!read) return;
    Object.defineProperty(owner, 'offsetWidth', {
        configurable: true,
        enumerable: native.enumerable,
        get(this: any) {
            return this.getAttribute('data-testid') === 'chat_list_filters_row' ? 100_000 : read.call(this);
        },
    });
}
