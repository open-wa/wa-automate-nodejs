import os from 'os';
import * as winston from 'winston';
import { Syslog } from 'winston-syslog';
import { klona } from 'klona/full';
import { redactObject } from './data_protection';

const startTime = Date.now();

/**
 * Deeply redacts sensitive fields and strips HTTP log noise from log entries.
 */
function redact(obj: any): any {
  const copy = klona(obj);
  redactObject(copy);

  const splat = copy[Symbol.for('splat')];
  redactObject(splat);

  if (copy.message?.includes('_HTTP_REQ_')) {
    delete copy[Symbol.for('splat')];
    delete copy[Symbol.for('message')];
    delete copy['app'];
    delete copy['duration'];
    delete copy['response'];
    delete copy['request'];
    delete copy['user'];
  }

  return copy;
}

const formatRedact = winston.format(redact);

/**
 * Collapses splat args (non-object primitives) into the message string.
 */
const stringSaver = winston.format((info: any) => {
  const copy = klona(info);
  const splat = copy[Symbol.for('splat')];
  if (splat) {
    copy.message = `${copy.message} ${splat
      .filter((x: any) => typeof x !== 'object')
      .map((x: any) => (Array.isArray(x) ? JSON.stringify(x) : x))
      .join(' ')}`;
    copy[Symbol.for('splat')] = splat.filter((o: any) => typeof o === 'object' && !Array.isArray(o));
    return copy;
  }
  return info;
});

const { combine, timestamp } = winston.format;

const transports: any[] = [
  new winston.transports.Console({
    level: 'debug',
    timestamp: timestamp(),
  } as any),
];

if (process.env.PAPERTRAIL_PORT && process.env.PAPERTRAIL_SUBDOMAIN) {
  transports.push(
    new Syslog({
      host: `${process.env.PAPERTRAIL_SUBDOMAIN}.papertrailapp.com`,
      // @ts-ignore - numeric string
      port: process.env.PAPERTRAIL_PORT,
      eol: '\n',
      protocol: 'tls4',
      localhost: os.hostname(),
      // @ts-ignore
      appName: `open-wa/wa-orch_${startTime}`,
    }),
  );
}

function makeLogger() {
  return winston.createLogger({
    format: combine(
      stringSaver(),
      timestamp(),
      winston.format.json(),
      formatRedact(),
      winston.format.splat(),
      winston.format.simple(),
    ),
    levels: winston.config.syslog.levels,
    transports,
  });
}

/**
 * Application-wide logger.
 *
 * Add custom Winston transports at runtime via `log.add(transport)`:
 * @see https://github.com/winstonjs/winston#transports
 */
export const log = makeLogger();

if (log.warning && !log.warn) log.warn = log.warning;
if (log.alert && !log.help) log.help = log.alert;

/**
 * Dynamically add a syslog transport (e.g. Papertrail).
 */
export function addSysLogTransport(options: Record<string, any> = {}): void {
  log.add(
    new Syslog({
      localhost: os.hostname(),
      appName: `open-wa/wa-orch_${startTime}`,
      ...options,
    }),
  );
}
