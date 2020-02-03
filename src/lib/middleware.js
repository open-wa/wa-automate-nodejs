/**
 * Middleware between web api driver and whatsappJS.
 * Right now this file should not import nor export anything.
 * Until I figure out how to compile this file with the imports inlined.
 * Specifically the [ExposedFn] enum.
 * Maybe by creating a webpack/rollup task
 */
//THIS SHOULD BE IDENTICAL TO /api/functions/exposed.enum.ts
var ExposedFn;
(function (ExposedFn) {
    ExposedFn["OnMessage"] = "onMessage";
    ExposedFn["OnAck"] = "onAck";
    ExposedFn["OnAnyMessage"] = "onAnyMessage";
    ExposedFn["OnParticipantsChanged"] = "onParticipantsChanged";
    ExposedFn["OnStateChanged"] = "onStateChanged";
})(ExposedFn || (ExposedFn = {}));
/**
 * Exposes [OnMessage] function
 */
WAPI.waitNewMessages(false, function (data) {
    data.forEach(function (message) {
        window[ExposedFn.OnMessage](message);
    });
});
WAPI.waitNewAcknowledgements(function (data) {
    if (!Array.isArray(data)) {
        data = [data];
    }
    data.forEach(function (message) {
        if (window[ExposedFn.OnAck])
            window[ExposedFn.OnAck](message);
    });
});
WAPI.onStateChanged(function (s) { return window[ExposedFn.OnStateChanged](s.state); });
WAPI.addAllNewMessagesListener(function (_) {
    window[ExposedFn.OnAnyMessage](_);
});
