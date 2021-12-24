import os from 'os';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { Syslog } from 'winston-syslog';
import { LogToEvTransport } from './custom_transport';
const { combine, timestamp } = winston.format;

let _evSet = false,
  _consoleSet = false,
  d = Date.now();

function truncate(str: string, n: number) {
  return str.length > n ? str.substr(0, n - 1) + '...' : str;
}

const formatRedact = winston.format((info) => {
  if (info?.file) info.file = truncate(info?.body?.file, 30) || '[FILE]';
  if (info?.body?.file)
    info.body.file = truncate(info?.body?.file, 30) || '[FILE]';
  if (info?.sessionData) info.sessionData = '[SESSION_DATA]';
  if (info?.body?.sessionData) info.body.sessionData = '[SESSION_DATA]';
  return info;
});

const makeLogger = () =>
  winston.createLogger({
    format: combine(
      timestamp(),
      winston.format.json(),
      formatRedact(),
      winston.format.splat(),
      winston.format.simple()
    ),
    levels: winston.config.syslog.levels,
  });

export const log = makeLogger();

export const addRotateFileLogTransport = (options: any = {}) => {
  log.add(
    new DailyRotateFile({
      filename: 'application-%DATE%.log',
      datePattern: 'YYYY-MM-DD-HH',
      zippedArchive: true,
      maxSize: '2m',
      maxFiles: '14d',
      ...options,
    })
  );
};

const addSysLogTransport = (options: any = {}) => {
  log.add(
    new Syslog({
      localhost: os.hostname(),
      ...options,
    })
  );
};

const enableConsoleLogger = (options: any = {}) => {
  if (_consoleSet) return;
  log.add(
    new winston.transports.Console({
      level: 'debug',
      timestamp: timestamp(),
      ...options,
    } as any)
  );
  _consoleSet = true;
};

function enableLogToEv(options: any = {}) {
  if (_evSet) return;
  log.add(
    new LogToEvTransport({
      format: winston.format.json(),
      ...options,
    })
  );
  _evSet = true;
}

export type ConfigLogTransport = {
  /**
   * The type of winston transport. At the moment only file, console, ev and syslog are supported.
   */
  type: 'syslog' | 'console' | 'file' | 'ev';
  /**
   * The options for the transport. Generally only required for syslog but you can use this to override default options for other types of transports.
   */
  options?: any;
  done?: boolean;
};

export const setupLogging = (logging: ConfigLogTransport[], sessionId: string = "session") => {
  const currentlySetup = [];
  const _logging = logging.map((l) => {
    if (l.done) return l;
    if (l.type === 'console') {
      enableConsoleLogger({
        ...(l.options || {}),
      });
    } else if (l.type === 'ev') {
      enableLogToEv({
        ...(l.options || {}),
      });
    } else if (l.type === 'file') {
      addRotateFileLogTransport({
        ...(l.options || {}),
      });
    } else if (l.type === 'syslog') {
      addSysLogTransport({
        ...(l.options || {}),
        appName: `owa-${sessionId}-${d}`
      });
    }
    currentlySetup.push(l);
    return {
      ...l,
      done: true,
    };
  });
  currentlySetup.map((l) => {
    log.info(`Set up logging for ${l.type}`, l.options);
    return l;
  });
  return _logging;
};
