const ora = require('ora');

let spinner;
let ev;
let session: string;

export const eventEmitter = function(sessionId: string, emitter) {
  ev = emitter;
  session = sessionId;
};

export const start = function(text: string) {
  ev.emit(session, text);

  spinner = ora({
    spinner: 'dots2',
    text: text
  }).start();
};

export const update = function(text: string) {
  ev.emit(session, text);
  spinner.text = text;
};

export const info = function(text: string) {
  ev.emit(session, text);
  spinner.info(text);
};

export const succeed = function(text?: string) {
  ev.emit(session, text);
  spinner.succeed(text);
};

export const fail = function(text: string) {
  ev.emit(session, text);
  spinner.fail(text);
};
