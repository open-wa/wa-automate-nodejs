import TransportStream from 'winston-transport';
import { ev } from '../controllers/events';

export class LogToEvTransport extends TransportStream {
  constructor(opts?: any) {
    super(opts);
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });
    ev.emit(
      `DEBUG.${info.level}`,
      Object.keys(info).reduce((p, c) => (p = { ...p, [c]: info[c] }), {})
    );
    if (callback) return callback(null, true);
  }
}

export class NoOpTransport extends TransportStream {
  constructor(opts?: any) {
    super(opts);
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });
    if (callback) return callback(null, true);
  }
}
