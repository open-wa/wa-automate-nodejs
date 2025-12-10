"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.z = exports.Registry = void 0;
exports.defineMethod = defineMethod;
exports.defineEvent = defineEvent;
const zod_1 = require("zod");
Object.defineProperty(exports, "z", { enumerable: true, get: function () { return zod_1.z; } });
const zod_to_openapi_1 = require("@asteasolutions/zod-to-openapi");
(0, zod_to_openapi_1.extendZodWithOpenApi)(zod_1.z);
class Registry {
    static registerMethod(def) {
        if (this.methods.has(def.name)) {
            throw new Error(`Method ${def.name} already registered`);
        }
        this.methods.set(def.name, def);
        return def;
    }
    static registerEvent(def) {
        if (this.events.has(def.name)) {
            throw new Error(`Event ${def.name} already registered`);
        }
        this.events.set(def.name, def);
        return def;
    }
    static getMethod(name) {
        return this.methods.get(name);
    }
    static getEvent(name) {
        return this.events.get(name);
    }
    static getAllMethods() {
        return Array.from(this.methods.values());
    }
    static getAllEvents() {
        return Array.from(this.events.values());
    }
}
exports.Registry = Registry;
Registry.methods = new Map();
Registry.events = new Map();
function defineMethod(name, params) {
    return Registry.registerMethod({
        name,
        type: 'method',
        metadata: params.meta,
        inputSchema: params.input,
        outputSchema: params.output,
    });
}
function defineEvent(name, params) {
    return Registry.registerEvent({
        name,
        type: 'event',
        metadata: params.meta,
        inputSchema: params.input,
        outputSchema: params.output,
    });
}
//# sourceMappingURL=registry.js.map