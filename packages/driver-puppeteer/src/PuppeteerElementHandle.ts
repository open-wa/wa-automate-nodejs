import { IElementHandle } from '@open-wa/driver-interface';
import type { ElementHandle } from 'puppeteer';

export class PuppeteerElementHandle implements IElementHandle {
    constructor(private element: ElementHandle) {}
    
    async click(): Promise<void> {
        await this.element.click();
    }
    
    async type(text: string): Promise<void> {
        await this.element.type(text);
    }
    
    async getAttribute(name: string): Promise<string | null> {
        const value = await this.element.evaluate((el, attr) => el.getAttribute(attr), name);
        return value;
    }
    
    async textContent(): Promise<string | null> {
        const text = await this.element.evaluate(el => el.textContent);
        return text;
    }
    
    async dispose(): Promise<void> {
        await this.element.dispose();
    }
    
    unwrap(): ElementHandle {
        return this.element;
    }
}
