import { methodParameterAliases, methodParameters, methodsWithObjectFirstParameter } from '@open-wa/schema/method-parameters';

const OBJECT_FIRST = new Set(methodsWithObjectFirstParameter);

function isPlainObject(value: unknown): value is Record<string, unknown> {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

/**
 * Turns the arguments of a direct method call into what `ask` sends: an object
 * of named parameters, or an array of positional arguments.
 *
 * `client.sendText({ to, content })` is named and `client.sendText(to, content)`
 * is positional. A single object is only ambiguous for the few methods whose
 * first argument is itself an object, such as `decryptMedia(message)`; there it
 * counts as named parameters only when every key is one of the method's
 * parameter names.
 */
export function remoteArguments(method: string, args: unknown[]): unknown[] | Record<string, unknown> {
    const [first] = args;
    if (args.length !== 1 || !isPlainObject(first)) return [...args];
    if (!OBJECT_FIRST.has(method)) return { ...first };

    const names = new Set([...(methodParameters[method] ?? []), ...(methodParameterAliases[method] ?? [])]);
    const keys = Object.keys(first);
    return keys.length > 0 && keys.every((key) => names.has(key)) ? { ...first } : [first];
}
