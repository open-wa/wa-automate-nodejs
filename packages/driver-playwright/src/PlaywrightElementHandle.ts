import { IElementHandle } from '@open-wa/driver-interface';
import type { ElementHandle } from 'playwright';

export class PlaywrightElementHandle implements IElementHandle {
    constructor(private element: ElementHandle) {}
    
    async click(): Promise<void> {
        await this.element.click();
    }
    
    async type(text: string): Promise<void> {
        await this.element.type(text);
    }
    
    async getAttribute(name: string): Promise<string | null> {
        const value = await this.element.getAttribute(name);
        return value;
    }
    
    async textContent(): Promise<string | null> {
        const text = await this.element.textContent();
        return text;
    }
    
    async dispose(): Promise<void> {
        await this.element.dispose();
    }
    
    unwrap(): ElementHandle {
        return this.element;
    }
}
