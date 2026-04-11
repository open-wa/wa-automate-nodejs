import { buildKeyAliasMap, clientRegistry, MethodDefinition } from './registry';

export interface HttpRouteAlias {
    name: string;
    path: string;
    deprecated: boolean;
}

export interface HttpMethodDefinition {
    functionName: string;
    namespacedName: string;
    path: string;
    namespace: string;
    description: string;
    httpMethod: string;
    inputSchema: MethodDefinition['meta']['inputSchema'];
    outputSchema: MethodDefinition['meta']['outputSchema'];
    parameterOrder: string[];
    aliases: string[];
    deprecatedAliases: string[];
    aliasRoutes: HttpRouteAlias[];
    routeSignatures: string[];
    invocationNames: string[];
    keyAliasMap: Record<string, string>;
    wapiOverride?: string;
}

function joinPath(...parts: string[]): string {
    const normalized = parts
        .filter(Boolean)
        .map((part, index) =>
            index === 0 ? part.replace(/\/+$/, '') : part.replace(/^\/+/, '').replace(/\/+$/, '')
        )
        .filter(Boolean)
        .join('/');

    return normalized.startsWith('/') ? normalized : `/${normalized}`;
}

function routePathForMethodName(basePath: string, fallbackNamespace: string, methodName: string): string {
    if (methodName.includes('.')) {
        const [namespace, ...rest] = methodName.split('.');
        return joinPath(basePath, namespace, rest.join('/'));
    }

    return joinPath(basePath, methodName || fallbackNamespace);
}

function uniqueStrings(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
}

export function getHttpMethodDefinitions(basePath = '/api'): HttpMethodDefinition[] {
    return clientRegistry.getAll().map((def) => {
        const namespace = def.meta.namespace || 'core';
        const namespacedName = def.meta.namespacedName || def.meta.functionName;
        const path = joinPath(basePath, namespace, namespacedName);
        const aliases = uniqueStrings(def.meta.allAliases ?? []);
        const deprecatedAliases = uniqueStrings(def.meta.deprecatedAliases ?? []);
        const aliasNames = uniqueStrings([def.meta.functionName, ...aliases]).filter(
            (alias) => alias !== `${namespace}.${namespacedName}`
        );
        const aliasRoutes = aliasNames.map((name) => ({
            name,
            path: routePathForMethodName(basePath, namespace, name),
            deprecated: deprecatedAliases.includes(name),
        }));
        const httpMethod = def.meta.httpMethod || 'POST';
        const routeSignatures = [
            `${httpMethod} ${path}`,
            ...aliasRoutes.map((alias) => `${httpMethod} ${alias.path}`),
        ];

        return {
            functionName: def.meta.functionName,
            namespacedName,
            path,
            namespace,
            description: def.meta.description || def.meta.functionName,
            httpMethod,
            inputSchema: def.meta.inputSchema,
            outputSchema: def.meta.outputSchema,
            parameterOrder: def.meta.parameterOrder,
            aliases,
            deprecatedAliases,
            aliasRoutes,
            routeSignatures,
            invocationNames: uniqueStrings([
                def.meta.functionName,
                def.meta.wapiOverride || '',
                ...aliases,
            ]),
            keyAliasMap: buildKeyAliasMap(def.meta.inputSchema.shape),
            wapiOverride: def.meta.wapiOverride,
        };
    });
}
