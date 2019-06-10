/**
 * Middleware between web api driver and whatsappJS.
 * Right now this file should not import nor export anything.
 * Until I figure out how to compile this file with the imports inlined.
 * Specifically the [ExposedFn] enum.
 * Maybe by creating a webpack/rollup task
 */

declare module WAPI {
  const waitNewMessages: (rmCallback: boolean, callback: Function) => void;
}

enum ExposedFn {
  OnMessage = 'onMessage'
}

/**
 * Exposes [OnMessage] function
 */
WAPI.waitNewMessages(false, data => {
  data.forEach(message => {
    window[ExposedFn.OnMessage](message);
  });
});
