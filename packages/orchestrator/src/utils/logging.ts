import os from "os";
import * as winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { Syslog } from "winston-syslog";
import { klona } from "klona/full";
import { redactObject } from "./data_protection";
const d = Date.now();
import c from 'ansi-colors';
import ms from 'ms';
import { Response, Request } from "express";

export function simpleCabinLog(options: { req: Request; res: Response; ctx: any; }) : string | null {
  const { req, res, ctx } = options;

  const statusColor =
    res.statusCode >= 500
      ? 'red'
      : res.statusCode >= 400
      ? 'yellow'
      : res.statusCode >= 300
      ? 'cyan'
      : res.statusCode >= 200
      ? 'green'
      : 'white';

  let responseTime = '-';

  const responseTimeHeader = res.getHeader('x-response-time');
  if (responseTimeHeader) {
    const milliseconds = Number(ms(responseTimeHeader as any));
    const responseColor =
      milliseconds >= 1000
        ? 'red'
        : milliseconds >= 500
        ? 'magenta'
        : milliseconds >= 250
        ? 'yellow'
        : milliseconds >= 100
        ? 'cyan'
        : 'green';
    responseTime = c[responseColor](`${milliseconds} ms`);
  }

  if(req.header('req-proxied') && res.statusCode===200) return null;

  return [
    "_HTTP_REQ_",
    ctx ? ctx.ip : req.ip,
    req.method,
    req.url,
    `HTTP/${req.httpVersionMajor}.${req.httpVersionMinor}`,
    c[statusColor](`${res.statusCode}`),
    res.getHeader('content-length') || '-',
    '-',
    responseTime,
    JSON.stringify(req.body || {})
  ].join(' ');
}

function redact(obj: any) : any {
  const copy = klona(obj); // Making a deep copy to prevent side effects
  redactObject(copy);

  const splat = copy[Symbol.for("splat")];
  redactObject(splat); // Specifically redact splat Symbol
  if(copy.message.includes('_HTTP_REQ_')) {
    delete copy[Symbol.for("splat")]
    delete copy[Symbol.for("message")]
    delete copy["app"]
    delete copy["duration"]
    delete copy["response"]
    delete copy["request"]
    delete copy["user"]
    delete copy["app"]
  }
  return copy;
}

const formatRedact = winston.format(redact);

const stringSaver = winston.format((info : any)=>{
  const copy = klona(info); // Making a deep copy to prevent side effects
  const splat = copy[Symbol.for("splat")];
  if(splat) {
    copy.message = `${copy.message} ${splat.filter((x:any)=>typeof x !== 'object').map((x:any)=>Array.isArray(x)?JSON.stringify(x):x).join(' ')}`
    copy[Symbol.for("splat")] = splat.filter((o:any)=>typeof o == 'object' && !Array.isArray(o))
    return copy;
  }
  return info
});

const { combine, timestamp, prettyPrint } = winston.format;

const papertrail = new Syslog({
  host: "logs2.papertrailapp.com",
  port: 34861,
  protocol: "tls4",
  localhost: os.hostname(),
  //@ts-ignore
  appName: `open-wa/wa-orch_${d}`,
  eol: "\n"
});

const fileRotateTransport = new DailyRotateFile({
  filename: "application-%DATE%.log",
  datePattern: "YYYY-MM-DD-HH",
  zippedArchive: true,
  maxSize: "2m",
  maxFiles: "14d",
  format: combine(timestamp(), prettyPrint())
});

const consoleLogger = new winston.transports.Console({
  level: "debug",
  timestamp: timestamp()
} as any);

// export const log = winston.createLogger({
//   format: combine(
//     winston.format.json(),
//     formatRedact(),
//     timestamp(),
//     prettyPrint()
//   ),
//   levels: winston.config.syslog.levels,
//   transports: [papertrail, consoleLogger, fileRotateTransport]
// });

const transports : any[] = [
  consoleLogger
];

if (process.env.PAPERTRAIL_PORT && process.env.PAPERTRAIL_SUBDOMAIN) {
  transports.push(new Syslog({
      host: `${process.env.PAPERTRAIL_SUBDOMAIN}.papertrailapp.com`,
      //@ts-ignore
      "port": process.env.PAPERTRAIL_PORT,
      eol: '\n',
      protocol: "tls4",
      localhost: os.hostname(),
      //@ts-ignore
      appName: `open-wa/wa-orch_${d}`,
  }))
}

/**
 * To prevent "Attempt to write logs with no transports" error
 */
//  const placeholderTransport = new NoOpTransport()

 const makeLogger = () =>
   winston.createLogger({
     format: combine(
      stringSaver(),
      timestamp(),
      winston.format.json(),
      formatRedact(),
      winston.format.splat(),
      winston.format.simple()
     ),
     levels: winston.config.syslog.levels,
     transports
 });
 
   /**
    * You can access the log in your code and add your own custom transports
    * https://github.com/winstonjs/winston#transports
    * see [Logger](https://github.com/winstonjs/winston#transports) for more details. 
    * 
    * Here is an example of adding the GCP stackdriver transport:
    * 
    * ```
    * import { log } from '@open-wa/wa-automate'
    * import { LoggingWinston } from '@google-cloud/logging-winston';
    * 
    * const gcpTransport = new LoggingWinston({
    *     projectId: 'your-project-id',
    *     keyFilename: '/path/to/keyfile.json'
    *   });
    * 
    * ...
    * log.add(
    *  gcpTransport
    * )
    * 
    * //Congrats! Now all of your session logs will also go to GCP Stackdriver
    * ```
    */
 export const log = makeLogger();
 
 if(log.warning && !log.warn) log.warn = log.warning 
 if(log.alert && !log.help) log.help = log.alert 
 
//  export const addRotateFileLogTransport = (options: any = {}) => {
//    log.add(
//      new DailyRotateFile({
//        filename: 'application-%DATE%.log',
//        datePattern: 'YYYY-MM-DD-HH',
//        zippedArchive: true,
//        maxSize: '2m',
//        maxFiles: '14d',
//        ...options,
//      })
//    );
//  };
 
//  /**
//   * @private
//   */

 export const addSysLogTransport : (options: any) => void = (options: any = {}) => {
   log.add(
     new Syslog({
       localhost: os.hostname(),
       appName: `open-wa/wa-orch_${d}`,
       ...options,
     })
   );
   return;
 };
 
//  const enableConsoleLogger = (options: any = {}) => {
//    if (_consoleSet) return;
//    log.add(
//      new winston.transports.Console({
//        level: 'debug',
//        timestamp: timestamp(),
//        ...options,
//      } as any)
//    );
//    _consoleSet = true;
//  };
 
//  function enableLogToEv(options: any = {}) {
//    if (_evSet) return;
//    log.add(
//      new LogToEvTransport({
//        format: winston.format.json(),
//        ...options,
//      })
//    );
//    _evSet = true;
//  }
 
//  export type ConfigLogTransport = {
//    /**
//     * The type of winston transport. At the moment only `file`, `console`, `ev` and `syslog` are supported.
//     */
//    type: 'syslog' | 'console' | 'file' | 'ev';
//    /**
//     * The options for the transport. Generally only required for syslog but you can use this to override default options for other types of transports.
//     */
//    options?: any;
//    /**
//     * If the transport has already been added to the logger. The logging set up command handles this for you.
//     * @readonly
//     */
//    done?: boolean;
//  };

// /**
//  * @private
//  */
//  export const setupLogging = (logging: ConfigLogTransport[], sessionId = "session") => {
//   const currentlySetup = [];
//   const _logging = logging.map((l) => {
//     if (l.done) return l;
//     if (l.type === 'console') {
//       enableConsoleLogger({
//         ...(l.options || {}),
//       });
//     } else if (l.type === 'ev') {
//       enableLogToEv({
//         ...(l.options || {}),
//       });
//     } else if (l.type === 'file') {
//       addRotateFileLogTransport({
//         ...(l.options || {}),
//       });
//     } else if (l.type === 'syslog') {
//       addSysLogTransport({
//         ...(l.options || {}),
//         appName: `owa-${sessionId}-${d}`
//       });
//     }
//     currentlySetup.push(l);
//     return {
//       ...l,
//       done: true,
//     };
//   });
//   currentlySetup.map((l) => {
//     log.info(`Set up logging for ${l.type}`, l.options);
//     return l;
//   });
//   return _logging;
// };
