/**
 * Middleware between web api driver and whatsappJS.
 * Right now this file should not import nor export anything.
 * Until I figure out how to compile this file with the imports inlined.
 * Specifically the [ExposedFn] enum.
 * Maybe by creating a webpack/rollup task
 */

declare module WAPI {
  const waitNewMessages: (rmCallback: boolean, callback: Function) => void;
  const waitNewAcknowledgements: (callback: Function) => void;
  const onStateChanged: (callback: Function) => void;
  const addAllNewMessagesListener: (callback: Function) => void;
}


//THIS SHOULD BE IDENTICAL TO /api/functions/exposed.enum.ts
enum ExposedFn {
  OnMessage = 'onMessage',
  OnAck = 'onAck',
  OnParticipantsChanged = 'onParticipantsChanged',
}

/**
 * Exposes [OnMessage] function
 */
WAPI.waitNewMessages(false, data => {
  data.forEach(message => {
    window[ExposedFn.OnMessage](message);
  });
});

WAPI.waitNewAcknowledgements(function (data) {
  if (!Array.isArray(data)) {
      data = [data];
  }
  data.forEach(function (message) {
      if(window[ExposedFn.OnAck])window[ExposedFn.OnAck](message);
  });
})

// WAPI.onStateChanged(s => window[ExposedFn.OnStateChanged](s.state));