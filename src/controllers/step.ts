const ora = require('ora');

let spinner = null;
let ev;
let session: string;

export const eventEmitter = function(sessionId: string, emitter) {
  ev = emitter;
  session = sessionId;
};

export const start = function(text: string) {
  ev.emit(session, text);

  if (!spinner) {
    spinner = ora({
      spinner: 'dots2',
      text: text
    }).start();
  } else spinner.text = text;
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
