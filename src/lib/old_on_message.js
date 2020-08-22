
/**
 * New messages observable functions.
 */
// window._WAPI._newMessagesQueue = [];
// window._WAPI._newMessagesBuffer = (sessionStorage.getItem('saved_msgs') != null) ? JSON.parse(sessionStorage.getItem('saved_msgs')) : [];
// window._WAPI._newMessagesDebouncer = null;
// window._WAPI._newMessagesCallbacks = [];

// window.Store.Msg.off('add');
// sessionStorage.removeItem('saved_msgs');

// window._WAPI._newMessagesListener = window.Store.Msg.on('add', (newMessage) => {
//     if (newMessage && newMessage.isNewMsg && !newMessage.isSentByMe && !newMessage.isStatusV3) {
//         let message = window.WAPI.processMessageObj(newMessage, false, false);
//         if (message) {
//             window._WAPI._newMessagesQueue.push(message);
//             window._WAPI._newMessagesBuffer.push(message);
//         }

//         // Starts debouncer time to don't call a callback for each message if more than one message arrives
//         // in the same second
//         if (!window._WAPI._newMessagesDebouncer && window._WAPI._newMessagesQueue.length > 0) {
//             window._WAPI._newMessagesDebouncer = setTimeout(() => {
//                 let queuedMessages = window._WAPI._newMessagesQueue;

//                 window._WAPI._newMessagesDebouncer = null;
//                 window._WAPI._newMessagesQueue = [];

//                 let removeCallbacks = [];

//                 window._WAPI._newMessagesCallbacks.forEach(function (callbackObj) {
//                     if (callbackObj.callback !== undefined) {
//                         callbackObj.callback(JSON.parse(JSON.stringify(queuedMessages)));
//                     }
//                     if (callbackObj.rmAfterUse === true) {
//                         removeCallbacks.push(callbackObj);
//                     }
//                 });

//                 // Remove removable callbacks.
//                 removeCallbacks.forEach(function (rmCallbackObj) {
//                     let callbackIndex = window._WAPI._newMessagesCallbacks.indexOf(rmCallbackObj);
//                     window._WAPI._newMessagesCallbacks.splice(callbackIndex, 1);
//                 });
//             }, 1000);
//         }
//     }
// });



// window.WAPI._unloadInform = (event) => {
//     // Save in the buffer the ungot unreaded messages
//     window._WAPI._newMessagesBuffer.forEach((message) => {
//         Object.keys(message).forEach(key => message[key] === undefined ? delete message[key] : '');
//     });
//     sessionStorage.setItem("saved_msgs", JSON.stringify(window._WAPI._newMessagesBuffer));

//     // Inform callbacks that the page will be reloaded.
//     window._WAPI._newMessagesCallbacks.forEach(function (callbackObj) {
//         if (callbackObj.callback !== undefined) {
//             callbackObj.callback({ status: -1, message: 'page will be reloaded, wait and register callback again.' });
//         }
//     });
// };

// window.addEventListener("unload", window.WAPI._unloadInform, false);
// window.addEventListener("beforeunload", window.WAPI._unloadInform, false);
// window.addEventListener("pageunload", window.WAPI._unloadInform, false);

// /**
//  * Registers a callback to be called when a new message arrives the WAPI.
//  * @param rmCallbackAfterUse - Boolean - Specify if the callback need to be executed only once
//  * @param callback - function - Callback function to be called when a new message arrives.
//  * @returns {boolean}
//  */
// window.WAPI.waitNewMessages = function (rmCallbackAfterUse = true, callback) {
//     window._WAPI._newMessagesCallbacks.push({ callback, rmAfterUse: rmCallbackAfterUse });
//     return true;
// };
