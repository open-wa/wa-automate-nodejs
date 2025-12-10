import winston from 'winston';
import type Transport from 'winston-transport';
import type { TransportConfig } from '../config/schema';

export interface ElasticsearchTransportConfig {
    url: string;
    username?: string;
    password?: string;
    indexPrefix?: string;
    bufferSize?: number;
    flushInterval?: number;
}

export function createElasticsearchTransport(
    config: Extract<TransportConfig, { type: 'elasticsearch' }>
): Transport {
    // Use winston-elasticsearch if available, or fallback/mock for now since it's a dev environment setup
    // In a real scenario, we'd ensure the peer dep is there.
    let ElasticsearchTransport;
    try {
        ElasticsearchTransport = require('winston-elasticsearch');
    } catch (e) {
        // Fallback if unavailable
        const TransportStream = require('winston-transport');
        return new TransportStream({
            log(info: any, callback: () => void) {
                console.warn('[Elasticsearch] Transport not installed, skipping log shipment');
                callback();
            }
        })
    }

    return new ElasticsearchTransport({
        level: 'info',
        clientOpts: {
            node: config.url,
            auth: config.username && config.password
                ? { username: config.username, password: config.password }
                : undefined,
        },
        index: config.indexPrefix || 'open-wa',
        indexPrefix: config.indexPrefix || 'open-wa',
        indexSuffixPattern: 'YYYY-MM', // Monthly rotation
        bufferLimit: config.bufferSize || 100,
        flushInterval: config.flushInterval || 2000,
        transformer: (logData: any) => {
            const context = logData.context ?? {};
            // Transform to match ECS (Elastic Common Schema) if needed
            return {
                '@timestamp': logData.timestamp,
                message: logData.message,
                level: logData.level,
                component: logData.component,
                sessionId: context.sessionId,
                schemaId: context.schemaId,
                driver: context.driver,
                ...context,
                ...logData,
            };
        },
    });
}
