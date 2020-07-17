"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = exports.getBase64 = exports.SimpleListener = exports.namespace = void 0;
var axios_1 = __importDefault(require("axios"));
var puppeteer_config_1 = require("../config/puppeteer.config");
var sharp_1 = __importDefault(require("sharp"));
var model_1 = require("./model");
var parseFunction = require('parse-function');
var PQueue = require("p-queue").default;
var tree_kill_1 = __importDefault(require("tree-kill"));
var browser_1 = require("../controllers/browser");
var initializer_1 = require("../controllers/initializer");
var auth_1 = require("../controllers/auth");
var namespace;
(function (namespace) {
    namespace["Chat"] = "Chat";
    namespace["Msg"] = "Msg";
    namespace["Contact"] = "Contact";
    namespace["GroupMetadata"] = "GroupMetadata";
})(namespace = exports.namespace || (exports.namespace = {}));
var SimpleListener;
(function (SimpleListener) {
    SimpleListener["Message"] = "onMessage";
    SimpleListener["AnyMessage"] = "onAnyMessage";
    SimpleListener["Ack"] = "onAck";
    SimpleListener["AddedToGroup"] = "onAddedToGroup";
    SimpleListener["Battery"] = "onBattery";
    SimpleListener["ChatOpened"] = "onChatOpened";
    SimpleListener["IncomingCall"] = "onIncomingCall";
    SimpleListener["GlobalParicipantsChanged"] = "onGlobalParicipantsChanged";
    SimpleListener["ChatState"] = "onChatState";
    SimpleListener["Plugged"] = "onPlugged";
    SimpleListener["StateChanged"] = "onStateChanged";
    SimpleListener["Story"] = "onStory";
    SimpleListener["RemovedFromGroup"] = "onRemovedFromGroup";
    SimpleListener["ContactAdded"] = "onContactAdded";
})(SimpleListener = exports.SimpleListener || (exports.SimpleListener = {}));
exports.getBase64 = function (url, optionsOverride) {
    if (optionsOverride === void 0) { optionsOverride = {}; }
    return __awaiter(void 0, void 0, void 0, function () {
        var res, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4, axios_1.default(__assign(__assign({ method: "get", url: url, headers: {
                                'DNT': 1,
                                'Upgrade-Insecure-Requests': 1
                            } }, optionsOverride), { responseType: 'arraybuffer' }))];
                case 1:
                    res = _a.sent();
                    return [2, "data:" + res.headers['content-type'] + ";base64," + Buffer.from(res.data, 'binary').toString('base64')];
                case 2:
                    error_1 = _a.sent();
                    console.log("TCL: getBase64 -> error", error_1);
                    return [3, 3];
                case 3: return [2];
            }
        });
    });
};
function base64MimeType(encoded) {
    var result = null;
    if (typeof encoded !== 'string') {
        return result;
    }
    var mime = encoded.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
    if (mime && mime.length) {
        result = mime[1];
    }
    return result;
}
var Client = (function () {
    function Client(page, createConfig, sessionInfo) {
        var _this = this;
        this.middleware = function (useSessionIdInPath) {
            if (useSessionIdInPath === void 0) { useSessionIdInPath = false; }
            return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
                var _a, method, args_1, m, response, error_2;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (useSessionIdInPath && !req.path.includes(this._createConfig.sessionId) && this._createConfig.sessionId !== 'session')
                                return [2, next()];
                            if (!(req.method === 'POST')) return [3, 5];
                            _a = req.body, method = _a.method, args_1 = _a.args;
                            m = method || this._createConfig.sessionId && this._createConfig.sessionId !== 'session' && req.path.includes(this._createConfig.sessionId) ? req.path.replace("/" + this._createConfig.sessionId + "/", '') : req.path.replace('/', '');
                            if (args_1 && !Array.isArray(args_1))
                                args_1 = parseFunction().parse(this[m]).args.map(function (argName) { return args_1[argName]; });
                            else if (!args_1)
                                args_1 = [];
                            if (!this[m]) return [3, 4];
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 3, , 4]);
                            return [4, this[m].apply(this, args_1)];
                        case 2:
                            response = _b.sent();
                            return [2, res.send({
                                    success: true,
                                    response: response
                                })];
                        case 3:
                            error_2 = _b.sent();
                            console.log("middleware -> error", error_2);
                            return [2, res.send({
                                    success: false,
                                    error: error_2
                                })];
                        case 4: return [2, res.status(404).send('Cannot find method')];
                        case 5: return [2, next()];
                    }
                });
            }); };
        };
        this._page = page;
        this._createConfig = createConfig || {};
        this._loadedModules = [];
        this._sessionInfo = sessionInfo;
        this._listeners = {};
        this._setOnClose();
    }
    Client.prototype.getPage = function () {
        return this._page;
    };
    Client.prototype._setOnClose = function () {
        var _this = this;
        this._page.on('close', function () {
            var _a;
            _this.kill();
            if ((_a = _this._createConfig) === null || _a === void 0 ? void 0 : _a.killProcessOnBrowserClose)
                process.exit();
        });
    };
    Client.prototype._reInjectWapi = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this;
                        return [4, browser_1.injectApi(this._page)];
                    case 1:
                        _a._page = _b.sent();
                        return [2];
                }
            });
        });
    };
    Client.prototype._reRegisterListeners = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2, Object.keys(this._listeners).forEach(function (listenerName) { return _this[listenerName](_this._listeners[listenerName]); })];
            });
        });
    };
    Client.prototype.refresh = function () {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var me, data;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log('Refreshing');
                        return [4, this._page.goto(puppeteer_config_1.puppeteerConfig.WAUrl)];
                    case 1:
                        _b.sent();
                        return [4, auth_1.isAuthenticated(this._page)];
                    case 2:
                        _b.sent();
                        return [4, this._reInjectWapi()];
                    case 3:
                        _b.sent();
                        if (!((_a = this._createConfig) === null || _a === void 0 ? void 0 : _a.licenseKey)) return [3, 8];
                        return [4, this.getMe()];
                    case 4:
                        me = (_b.sent()).me;
                        return [4, axios_1.default.post(initializer_1.licenseCheckUrl, __assign({ key: this._createConfig.licenseKey, number: me._serialized }, this._sessionInfo))];
                    case 5:
                        data = (_b.sent()).data;
                        if (!data) return [3, 7];
                        return [4, this._page.evaluate(function (data) { return eval(data); }, data)];
                    case 6:
                        _b.sent();
                        console.log('License Valid');
                        return [3, 8];
                    case 7:
                        console.log('Invalid license key');
                        _b.label = 8;
                    case 8: return [4, this._page.evaluate('Object.freeze(window.WAPI)')];
                    case 9:
                        _b.sent();
                        return [4, this._reRegisterListeners()];
                    case 10:
                        _b.sent();
                        return [2, true];
                }
            });
        });
    };
    Client.prototype.getSessionInfo = function () {
        return this._sessionInfo;
    };
    Client.prototype.getConfig = function () {
        var _a = this._createConfig, devtools = _a.devtools, browserWSEndpoint = _a.browserWSEndpoint, sessionData = _a.sessionData, proxyServerCredentials = _a.proxyServerCredentials, restartOnCrash = _a.restartOnCrash, rest = __rest(_a, ["devtools", "browserWSEndpoint", "sessionData", "proxyServerCredentials", "restartOnCrash"]);
        return rest;
    };
    Client.prototype.pup = function (pageFunction) {
        var _a;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var state;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!((_a = this._createConfig) === null || _a === void 0 ? void 0 : _a.safeMode)) return [3, 2];
                        if (!this._page || this._page.isClosed())
                            throw 'page closed';
                        return [4, this.getConnectionState()];
                    case 1:
                        state = _c.sent();
                        if (state !== model_1.STATE.CONNECTED)
                            throw "state: " + state;
                        _c.label = 2;
                    case 2: return [2, (_b = this._page).evaluate.apply(_b, __spreadArrays([pageFunction], args))];
                }
            });
        });
    };
    Client.prototype.registerListener = function (funcName, fn) {
        return __awaiter(this, void 0, void 0, function () {
            var set, exists;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        set = function () { return _this.pup(function (_a) {
                            var funcName = _a.funcName;
                            return window[funcName] ? WAPI[funcName](function (obj) { return window[funcName](obj); }) : false;
                        }, { funcName: funcName }); };
                        this._listeners[funcName] = fn;
                        return [4, this.pup(function (_a) {
                                var funcName = _a.funcName;
                                return window[funcName] ? true : false;
                            }, { funcName: funcName })];
                    case 1:
                        exists = _a.sent();
                        if (!exists) return [3, 3];
                        return [4, set()];
                    case 2: return [2, _a.sent()];
                    case 3: return [2, this._page.exposeFunction(funcName, function (obj) { return fn(obj); }).then(set).catch(function (e) { return set; })];
                }
            });
        });
    };
    Client.prototype.onMessage = function (fn) {
        return __awaiter(this, void 0, void 0, function () {
            var funcName, set, exists;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        funcName = SimpleListener.Message;
                        this._listeners[funcName] = fn;
                        set = function () { return _this.pup(function (_a) {
                            var funcName = _a.funcName;
                            WAPI.waitNewMessages(false, function (data) {
                                data.forEach(function (message) {
                                    window[funcName](message);
                                });
                            });
                        }, { funcName: funcName }); };
                        return [4, this.pup(function (_a) {
                                var funcName = _a.funcName;
                                return window[funcName] ? true : false;
                            }, { funcName: funcName })];
                    case 1:
                        exists = _a.sent();
                        if (!exists) return [3, 3];
                        return [4, set()];
                    case 2: return [2, _a.sent()];
                    case 3:
                        this._page.exposeFunction(funcName, function (message) { return fn(message); }).then(set).catch(function (e) { return set; });
                        return [2];
                }
            });
        });
    };
    Client.prototype.onAnyMessage = function (fn) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.registerListener(SimpleListener.AnyMessage, fn)];
            });
        });
    };
    Client.prototype.onBattery = function (fn) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.registerListener(SimpleListener.Battery, fn)];
            });
        });
    };
    Client.prototype.onPlugged = function (fn) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.registerListener(SimpleListener.Plugged, fn)];
            });
        });
    };
    Client.prototype.onStory = function (fn) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.registerListener(SimpleListener.Story, fn)];
            });
        });
    };
    Client.prototype.onStateChanged = function (fn) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.registerListener(SimpleListener.StateChanged, fn)];
            });
        });
    };
    Client.prototype.onIncomingCall = function (fn) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.registerListener(SimpleListener.IncomingCall, fn)];
            });
        });
    };
    Client.prototype.onChatState = function (fn) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.registerListener(SimpleListener.ChatState, fn)];
            });
        });
    };
    Client.prototype.onAck = function (fn) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.registerListener(SimpleListener.Ack, fn)];
            });
        });
    };
    Client.prototype.onGlobalParicipantsChanged = function (fn) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.registerListener(SimpleListener.GlobalParicipantsChanged, fn)];
            });
        });
    };
    Client.prototype.onAddedToGroup = function (fn) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.registerListener(SimpleListener.AddedToGroup, fn)];
            });
        });
    };
    Client.prototype.onRemovedFromGroup = function (fn) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.registerListener(SimpleListener.RemovedFromGroup, fn)];
            });
        });
    };
    Client.prototype.onChatOpened = function (fn) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.registerListener(SimpleListener.ChatOpened, fn)];
            });
        });
    };
    Client.prototype.onContactAdded = function (fn) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.registerListener(SimpleListener.ChatOpened, fn)];
            });
        });
    };
    Client.prototype.onParticipantsChanged = function (groupId, fn, useLegancyMethod) {
        if (useLegancyMethod === void 0) { useLegancyMethod = false; }
        return __awaiter(this, void 0, void 0, function () {
            var funcName;
            var _this = this;
            return __generator(this, function (_a) {
                funcName = "onParticipantsChanged_" + groupId.replace('_', "").replace('_', "");
                return [2, this._page.exposeFunction(funcName, function (participantChangedEvent) {
                        return fn(participantChangedEvent);
                    })
                        .then(function (_) { return _this.pup(function (_a) {
                        var groupId = _a.groupId, funcName = _a.funcName, useLegancyMethod = _a.useLegancyMethod;
                        if (useLegancyMethod)
                            return WAPI._onParticipantsChanged(groupId, window[funcName]);
                        else
                            return WAPI.onParticipantsChanged(groupId, window[funcName]);
                    }, { groupId: groupId, funcName: funcName, useLegancyMethod: useLegancyMethod }); })];
            });
        });
    };
    Client.prototype.onLiveLocation = function (chatId, fn) {
        return __awaiter(this, void 0, void 0, function () {
            var funcName;
            var _this = this;
            return __generator(this, function (_a) {
                funcName = "onLiveLocation_" + chatId.replace('_', "").replace('_', "");
                return [2, this._page.exposeFunction(funcName, function (liveLocationChangedEvent) {
                        return fn(liveLocationChangedEvent);
                    })
                        .then(function (_) { return _this.pup(function (_a) {
                        var chatId = _a.chatId, funcName = _a.funcName;
                        return WAPI.onLiveLocation(chatId, window[funcName]);
                    }, { chatId: chatId, funcName: funcName }); })];
            });
        });
    };
    Client.prototype.setPresence = function (available) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (available) { WAPI.setPresence(available); }, available)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.setMyStatus = function (newStatus) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var newStatus = _a.newStatus;
                            WAPI.setMyStatus(newStatus);
                        }, { newStatus: newStatus })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.addLabel = function (label, id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var label = _a.label, id = _a.id;
                            WAPI.addOrRemoveLabels(label, id, 'add');
                        }, { label: label, id: id })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.removeLabel = function (label, id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var label = _a.label, id = _a.id;
                            WAPI.addOrRemoveLabels(label, id, 'remove');
                        }, { label: label, id: id })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.sendVCard = function (chatId, vcard, contactName, contactNumber) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var chatId = _a.chatId, vcard = _a.vcard, contactName = _a.contactName, contactNumber = _a.contactNumber;
                            WAPI.sendVCard(chatId, vcard, contactName, contactNumber);
                        }, { chatId: chatId, vcard: vcard, contactName: contactName, contactNumber: contactNumber })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.setMyName = function (newName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var newName = _a.newName;
                            WAPI.setMyName(newName);
                        }, { newName: newName })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.setChatState = function (chatState, chatId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var chatState = _a.chatState, chatId = _a.chatId;
                            WAPI.setChatState(chatState, chatId);
                        }, { chatState: chatState, chatId: chatId })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getConnectionState = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this._page.evaluate(function () { return WAPI.getState(); })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getChatWithNonContacts = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this._page.evaluate(function () { return WAPI.getChatWithNonContacts(); })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.kill = function () {
        return __awaiter(this, void 0, void 0, function () {
            var browser, pid, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('Shutting Down');
                        return [4, this._page.browser()];
                    case 1:
                        browser = _a.sent();
                        pid = browser.process() ? browser.process().pid : null;
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 7, , 8]);
                        if (!(this._page && !this._page.isClosed())) return [3, 4];
                        return [4, this._page.close()];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        if (!(this._page && this._page.browser)) return [3, 6];
                        return [4, this._page.browser().close()];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        if (pid)
                            tree_kill_1.default(pid, 'SIGKILL');
                        return [3, 8];
                    case 7:
                        error_3 = _a.sent();
                        return [3, 8];
                    case 8: return [2, true];
                }
            });
        });
    };
    Client.prototype.forceRefocus = function () {
        return __awaiter(this, void 0, void 0, function () {
            var useHere;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this._page.evaluate(function () { return WAPI.getUseHereString(); })];
                    case 1:
                        useHere = _a.sent();
                        return [4, this._page.waitForFunction("[...document.querySelectorAll(\"div[role=button\")].find(e=>{return e.innerHTML.toLowerCase()===\"" + useHere.toLowerCase() + "\"})", { timeout: 0 })];
                    case 2:
                        _a.sent();
                        return [4, this._page.evaluate("[...document.querySelectorAll(\"div[role=button\")].find(e=>{return e.innerHTML.toLowerCase()==\"" + useHere.toLowerCase() + "\"}).click()")];
                    case 3: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.forceUpdateLiveLocation = function (chatId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var chatId = _a.chatId;
                            return WAPI.forceUpdateLiveLocation(chatId);
                        }, { chatId: chatId })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.sendText = function (to, content) {
        return __awaiter(this, void 0, void 0, function () {
            var err, res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        err = [
                            'Not able to send message to broadcast',
                            'Not a contact',
                            'Error: Number not linked to WhatsApp Account',
                            'ERROR: Please make sure you have at least one chat'
                        ];
                        return [4, this.pup(function (_a) {
                                var to = _a.to, content = _a.content;
                                WAPI.sendSeen(to);
                                return WAPI.sendMessage(to, content);
                            }, { to: to, content: content })];
                    case 1:
                        res = _a.sent();
                        if (err.includes(res))
                            console.error(res);
                        return [2, err.includes(res) ? false : res];
                }
            });
        });
    };
    Client.prototype.sendTextWithMentions = function (to, content) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var to = _a.to, content = _a.content;
                            WAPI.sendSeen(to);
                            return WAPI.sendMessageWithMentions(to, content);
                        }, { to: to, content: content })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.sendReplyWithMentions = function (to, content, replyMessageId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var to = _a.to, content = _a.content, replyMessageId = _a.replyMessageId;
                            WAPI.sendSeen(to);
                            return WAPI.sendReplyWithMentions(to, content, replyMessageId);
                        }, { to: to, content: content, replyMessageId: replyMessageId })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.sendMessageWithThumb = function (thumb, url, title, description, text, chatId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var thumb = _a.thumb, url = _a.url, title = _a.title, description = _a.description, text = _a.text, chatId = _a.chatId;
                            WAPI.sendMessageWithThumb(thumb, url, title, description, text, chatId);
                        }, {
                            thumb: thumb,
                            url: url,
                            title: title,
                            description: description,
                            text: text,
                            chatId: chatId
                        })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.sendLocation = function (to, lat, lng, loc) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var to = _a.to, lat = _a.lat, lng = _a.lng, loc = _a.loc;
                            return WAPI.sendLocation(to, lat, lng, loc);
                        }, { to: to, lat: lat, lng: lng, loc: loc })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getGeneratedUserAgent = function (userA) {
        return __awaiter(this, void 0, void 0, function () {
            var ua;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ua = userA || puppeteer_config_1.useragent;
                        return [4, this.pup(function (_a) {
                                var ua = _a.ua;
                                return WAPI.getGeneratedUserAgent(ua);
                            }, { ua: ua })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.sendImage = function (to, base64, filename, caption, quotedMsgId, waitForId, ptt) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var to = _a.to, base64 = _a.base64, filename = _a.filename, caption = _a.caption, quotedMsgId = _a.quotedMsgId, waitForId = _a.waitForId, ptt = _a.ptt;
                            return WAPI.sendImage(base64, to, filename, caption, quotedMsgId, waitForId, ptt);
                        }, { to: to, base64: base64, filename: filename, caption: caption, quotedMsgId: quotedMsgId, waitForId: waitForId, ptt: ptt })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.sendYoutubeLink = function (to, url, text) {
        if (text === void 0) { text = ''; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.sendLinkWithAutoPreview(to, url, text)];
            });
        });
    };
    Client.prototype.sendLinkWithAutoPreview = function (to, url, text) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var to = _a.to, url = _a.url, text = _a.text;
                            WAPI.sendLinkWithAutoPreview(to, url, text);
                        }, { to: to, url: url, text: text })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.reply = function (to, content, quotedMsgId, sendSeen) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!sendSeen) return [3, 2];
                        return [4, this.sendSeen(to)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4, this.pup(function (_a) {
                            var to = _a.to, content = _a.content, quotedMsgId = _a.quotedMsgId;
                            return WAPI.reply(to, content, quotedMsgId);
                        }, { to: to, content: content, quotedMsgId: quotedMsgId })];
                    case 3: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.sendFile = function (to, base64, filename, caption, quotedMsgId, waitForId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.sendImage(to, base64, filename, caption, quotedMsgId, waitForId)];
            });
        });
    };
    Client.prototype.sendPtt = function (to, base64, quotedMsgId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, this.sendImage(to, base64, 'ptt.ogg', '', quotedMsgId, true)];
            });
        });
    };
    Client.prototype.sendVideoAsGif = function (to, base64, filename, caption, quotedMsgId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var to = _a.to, base64 = _a.base64, filename = _a.filename, caption = _a.caption, quotedMsgId = _a.quotedMsgId;
                            WAPI.sendVideoAsGif(base64, to, filename, caption, quotedMsgId);
                        }, { to: to, base64: base64, filename: filename, caption: caption, quotedMsgId: quotedMsgId })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.sendGiphy = function (to, giphyMediaUrl, caption) {
        return __awaiter(this, void 0, void 0, function () {
            var ue, n, r, filename, base64;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ue = /^https?:\/\/media\.giphy\.com\/media\/([a-zA-Z0-9]+)/;
                        n = ue.exec(giphyMediaUrl);
                        if (!n) return [3, 3];
                        r = "https://i.giphy.com/" + n[1] + ".mp4";
                        filename = n[1] + ".mp4";
                        return [4, exports.getBase64(r)];
                    case 1:
                        base64 = _a.sent();
                        return [4, this.pup(function (_a) {
                                var to = _a.to, base64 = _a.base64, filename = _a.filename, caption = _a.caption;
                                WAPI.sendVideoAsGif(base64, to, filename, caption);
                            }, { to: to, base64: base64, filename: filename, caption: caption })];
                    case 2: return [2, _a.sent()];
                    case 3:
                        console.log('something is wrong with this giphy link');
                        return [2];
                }
            });
        });
    };
    Client.prototype.sendFileFromUrl = function (to, url, filename, caption, quotedMsgId, requestConfig, waitForId) {
        if (requestConfig === void 0) { requestConfig = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var base64, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4, exports.getBase64(url, requestConfig)];
                    case 1:
                        base64 = _a.sent();
                        return [4, this.sendFile(to, base64, filename, caption, quotedMsgId, waitForId)];
                    case 2: return [2, _a.sent()];
                    case 3:
                        error_4 = _a.sent();
                        console.log('Something went wrong', error_4);
                        throw error_4;
                    case 4: return [2];
                }
            });
        });
    };
    Client.prototype.getMe = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function () { return WAPI.getMe(); })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.iAmAdmin = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function () { return WAPI.iAmAdmin(); })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.syncContacts = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function () { return WAPI.syncContacts(); })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getAmountOfLoadedMessages = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function () { return WAPI.getAmountOfLoadedMessages(); })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getBusinessProfilesProducts = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var id = _a.id;
                            return WAPI.getBusinessProfilesProducts(id);
                        }, { id: id })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.sendImageWithProduct = function (to, base64, caption, bizNumber, productId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var to = _a.to, base64 = _a.base64, bizNumber = _a.bizNumber, caption = _a.caption, productId = _a.productId;
                            WAPI.sendImageWithProduct(base64, to, caption, bizNumber, productId);
                        }, { to: to, base64: base64, bizNumber: bizNumber, caption: caption, productId: productId })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.sendContact = function (to, contactId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var to = _a.to, contactId = _a.contactId;
                            return WAPI.sendContact(to, contactId);
                        }, { to: to, contactId: contactId })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.simulateTyping = function (to, on) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var to = _a.to, on = _a.on;
                            return WAPI.simulateTyping(to, on);
                        }, { to: to, on: on })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.archiveChat = function (id, archive) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var id = _a.id, archive = _a.archive;
                            return WAPI.archiveChat(id, archive);
                        }, { id: id, archive: archive })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.forwardMessages = function (to, messages, skipMyMessages) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var to = _a.to, messages = _a.messages, skipMyMessages = _a.skipMyMessages;
                            return WAPI.forwardMessages(to, messages, skipMyMessages);
                        }, { to: to, messages: messages, skipMyMessages: skipMyMessages })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.ghostForward = function (to, messageId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var to = _a.to, messageId = _a.messageId;
                            return WAPI.ghostForward(to, messageId);
                        }, { to: to, messageId: messageId })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getAllContacts = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function () { return WAPI.getAllContacts(); })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getWAVersion = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function () { return WAPI.getWAVersion(); })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.isConnected = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function () { return WAPI.isConnected(); })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getBatteryLevel = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function () { return WAPI.getBatteryLevel(); })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getIsPlugged = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function () { return WAPI.getIsPlugged(); })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getHostNumber = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function () { return WAPI.getHostNumber(); })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getAllChats = function (withNewMessageOnly) {
        if (withNewMessageOnly === void 0) { withNewMessageOnly = false; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!withNewMessageOnly) return [3, 2];
                        return [4, this.pup(function () {
                                return WAPI.getAllChatsWithNewMsg();
                            })];
                    case 1: return [2, _a.sent()];
                    case 2: return [4, this.pup(function () { return WAPI.getAllChats(); })];
                    case 3: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getAllChatsWithMessages = function (withNewMessageOnly) {
        if (withNewMessageOnly === void 0) { withNewMessageOnly = false; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _b = (_a = JSON).parse;
                        return [4, this.pup(function (withNewMessageOnly) { return WAPI.getAllChatsWithMessages(withNewMessageOnly); }, withNewMessageOnly)];
                    case 1: return [2, _b.apply(_a, [_c.sent()])];
                }
            });
        });
    };
    Client.prototype.getAllGroups = function (withNewMessagesOnly) {
        if (withNewMessagesOnly === void 0) { withNewMessagesOnly = false; }
        return __awaiter(this, void 0, void 0, function () {
            var chats, chats;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!withNewMessagesOnly) return [3, 2];
                        return [4, this.pup(function () { return WAPI.getAllChatsWithNewMsg(); })];
                    case 1:
                        chats = _a.sent();
                        return [2, chats.filter(function (chat) { return chat.isGroup; })];
                    case 2: return [4, this.pup(function () { return WAPI.getAllChats(); })];
                    case 3:
                        chats = _a.sent();
                        return [2, chats.filter(function (chat) { return chat.isGroup; })];
                }
            });
        });
    };
    Client.prototype.getGroupMembersId = function (groupId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (groupId) { return WAPI.getGroupParticipantIDs(groupId); }, groupId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.joinGroupViaLink = function (link) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (link) { return WAPI.joinGroupViaLink(link); }, link)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.contactBlock = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (id) { return WAPI.contactBlock(id); }, id)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.contactUnblock = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (id) { return WAPI.contactUnblock(id); }, id)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.leaveGroup = function (groupId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (groupId) { return WAPI.leaveGroup(groupId); }, groupId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getVCards = function (msgId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (msgId) { return WAPI.getVCards(msgId); }, msgId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getGroupMembers = function (groupId) {
        return __awaiter(this, void 0, void 0, function () {
            var membersIds, actions;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getGroupMembersId(groupId)];
                    case 1:
                        membersIds = _a.sent();
                        actions = membersIds.map(function (memberId) {
                            return _this.getContact(memberId);
                        });
                        return [4, Promise.all(actions)];
                    case 2: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getContact = function (contactId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (contactId) { return WAPI.getContact(contactId); }, contactId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getChatById = function (contactId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (contactId) { return WAPI.getChatById(contactId); }, contactId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getMessageById = function (messageId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (messageId) { return WAPI.getMessageById(messageId); }, messageId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getChat = function (contactId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (contactId) { return WAPI.getChat(contactId); }, contactId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getCommonGroups = function (contactId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (contactId) { return WAPI.getCommonGroups(contactId); }, contactId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getLastSeen = function (chatId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (chatId) { return WAPI.getLastSeen(chatId); }, chatId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getProfilePicFromServer = function (chatId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (chatId) { return WAPI.getProfilePicFromServer(chatId); }, chatId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.sendSeen = function (chatId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (chatId) { return WAPI.sendSeen(chatId); }, chatId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.markAsUnread = function (chatId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (chatId) { return WAPI.markAsUnread(chatId); }, chatId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.isChatOnline = function (chatId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (chatId) { return WAPI.isChatOnline(chatId); }, chatId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.loadEarlierMessages = function (contactId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (contactId) { return WAPI.loadEarlierMessages(contactId); }, contactId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getStatus = function (contactId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (contactId) { return WAPI.getStatus(contactId); }, contactId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.loadAllEarlierMessages = function (contactId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (contactId) { return WAPI.loadAllEarlierMessages(contactId); }, contactId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.deleteChat = function (chatId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (chatId) { return WAPI.deleteConversation(chatId); }, chatId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.clearChat = function (chatId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (chatId) { return WAPI.clearChat(chatId); }, chatId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getGroupInviteLink = function (chatId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (chatId) { return WAPI.getGroupInviteLink(chatId); }, chatId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.inviteInfo = function (link) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (link) { return WAPI.inviteInfo(link); }, link)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.revokeGroupInviteLink = function (chatId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (chatId) { return WAPI.revokeGroupInviteLink(chatId); }, chatId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.deleteMessage = function (contactId, messageId, onlyLocal) {
        if (onlyLocal === void 0) { onlyLocal = false; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var contactId = _a.contactId, messageId = _a.messageId, onlyLocal = _a.onlyLocal;
                            return WAPI.smartDeleteMessages(contactId, messageId, onlyLocal);
                        }, { contactId: contactId, messageId: messageId, onlyLocal: onlyLocal })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.checkNumberStatus = function (contactId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (contactId) { return WAPI.checkNumberStatus(contactId); }, contactId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getUnreadMessages = function (includeMe, includeNotifications, use_unread_count) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var includeMe = _a.includeMe, includeNotifications = _a.includeNotifications, use_unread_count = _a.use_unread_count;
                            return WAPI.getUnreadMessages(includeMe, includeNotifications, use_unread_count);
                        }, { includeMe: includeMe, includeNotifications: includeNotifications, use_unread_count: use_unread_count })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getAllNewMessages = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function () { return WAPI.getAllNewMessages(); })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getAllUnreadMessages = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function () { return WAPI.getAllUnreadMessages(); })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getIndicatedNewMessages = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _b = (_a = JSON).parse;
                        return [4, this.pup(function () { return WAPI.getIndicatedNewMessages(); })];
                    case 1: return [2, _b.apply(_a, [_c.sent()])];
                }
            });
        });
    };
    Client.prototype.getAllMessagesInChat = function (chatId, includeMe, includeNotifications) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var chatId = _a.chatId, includeMe = _a.includeMe, includeNotifications = _a.includeNotifications;
                            return WAPI.getAllMessagesInChat(chatId, includeMe, includeNotifications);
                        }, { chatId: chatId, includeMe: includeMe, includeNotifications: includeNotifications })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.loadAndGetAllMessagesInChat = function (chatId, includeMe, includeNotifications) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var chatId = _a.chatId, includeMe = _a.includeMe, includeNotifications = _a.includeNotifications;
                            return WAPI.loadAndGetAllMessagesInChat(chatId, includeMe, includeNotifications);
                        }, { chatId: chatId, includeMe: includeMe, includeNotifications: includeNotifications })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.createGroup = function (groupName, contacts) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var groupName = _a.groupName, contacts = _a.contacts;
                            return WAPI.createGroup(groupName, contacts);
                        }, { groupName: groupName, contacts: contacts })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.removeParticipant = function (groupId, participantId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var groupId = _a.groupId, participantId = _a.participantId;
                            return WAPI.removeParticipant(groupId, participantId);
                        }, { groupId: groupId, participantId: participantId })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.setGroupIcon = function (groupId, b64) {
        return __awaiter(this, void 0, void 0, function () {
            var buff, mimeInfo, scaledImageBuffer, jpeg, imgData, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        buff = Buffer.from(b64.replace(/^data:image\/(png|gif|jpeg);base64,/, ''), 'base64');
                        mimeInfo = base64MimeType(b64);
                        console.log("setGroupIcon -> mimeInfo", mimeInfo);
                        if (!(!mimeInfo || mimeInfo.includes("image"))) return [3, 4];
                        return [4, sharp_1.default(buff, { failOnError: false })
                                .resize({ height: 300 })
                                .toBuffer()];
                    case 1:
                        scaledImageBuffer = _b.sent();
                        jpeg = sharp_1.default(scaledImageBuffer, { failOnError: false }).jpeg();
                        _a = "data:jpeg;base64,";
                        return [4, jpeg.toBuffer()];
                    case 2:
                        imgData = _a + (_b.sent()).toString('base64');
                        console.log("setGroupIcon -> imgData", imgData);
                        return [4, this.pup(function (_a) {
                                var groupId = _a.groupId, imgData = _a.imgData;
                                return WAPI.setGroupIcon(groupId, imgData);
                            }, { groupId: groupId, imgData: imgData })];
                    case 3: return [2, _b.sent()];
                    case 4: return [2];
                }
            });
        });
    };
    Client.prototype.setGroupIconByUrl = function (groupId, url, requestConfig) {
        if (requestConfig === void 0) { requestConfig = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var base64, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4, exports.getBase64(url, requestConfig)];
                    case 1:
                        base64 = _a.sent();
                        return [4, this.setGroupIcon(groupId, base64)];
                    case 2: return [2, _a.sent()];
                    case 3:
                        error_5 = _a.sent();
                        throw error_5;
                    case 4: return [2];
                }
            });
        });
    };
    Client.prototype.addParticipant = function (groupId, participantId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var groupId = _a.groupId, participantId = _a.participantId;
                            return WAPI.addParticipant(groupId, participantId);
                        }, { groupId: groupId, participantId: participantId })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.promoteParticipant = function (groupId, participantId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var groupId = _a.groupId, participantId = _a.participantId;
                            return WAPI.promoteParticipant(groupId, participantId);
                        }, { groupId: groupId, participantId: participantId })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.demoteParticipant = function (groupId, participantId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var groupId = _a.groupId, participantId = _a.participantId;
                            return WAPI.demoteParticipant(groupId, participantId);
                        }, { groupId: groupId, participantId: participantId })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.setGroupToAdminsOnly = function (groupId, onlyAdmins) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var groupId = _a.groupId, onlyAdmins = _a.onlyAdmins;
                            return WAPI.setGroupToAdminsOnly(groupId, onlyAdmins);
                        }, { groupId: groupId, onlyAdmins: onlyAdmins })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.setGroupEditToAdminsOnly = function (groupId, onlyAdmins) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var groupId = _a.groupId, onlyAdmins = _a.onlyAdmins;
                            return WAPI.setGroupEditToAdminsOnly(groupId, onlyAdmins);
                        }, { groupId: groupId, onlyAdmins: onlyAdmins })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getGroupAdmins = function (groupId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (groupId) { return WAPI.getGroupAdmins(groupId); }, groupId)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.setChatBackgroundColourHex = function (hex) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (hex) { return WAPI.setChatBackgroundColourHex(hex); }, hex)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.darkMode = function (activate) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (activate) { return WAPI.darkMode(activate); }, activate)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.sendStickerfromUrl = function (to, url, requestConfig) {
        if (requestConfig === void 0) { requestConfig = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var base64, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4, exports.getBase64(url, requestConfig)];
                    case 1:
                        base64 = _a.sent();
                        return [4, this.sendImageAsSticker(to, base64)];
                    case 2: return [2, _a.sent()];
                    case 3:
                        error_6 = _a.sent();
                        console.log('Something went wrong', error_6);
                        throw error_6;
                    case 4: return [2];
                }
            });
        });
    };
    Client.prototype.getSingleProperty = function (namespace, id, property) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var namespace = _a.namespace, id = _a.id, property = _a.property;
                            return WAPI.getSingleProperty(namespace, id, property);
                        }, { namespace: namespace, id: id, property: property })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.injectJsSha = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (x) { return eval(x); }, "'use strict';(function(I){function w(c,a,d){var l=0,b=[],g=0,f,n,k,e,h,q,y,p,m=!1,t=[],r=[],u,z=!1;d=d||{};f=d.encoding||\"UTF8\";u=d.numRounds||1;if(u!==parseInt(u,10)||1>u)throw Error(\"numRounds must a integer >= 1\");if(0===c.lastIndexOf(\"SHA-\",0))if(q=function(b,a){return A(b,a,c)},y=function(b,a,l,f){var g,e;if(\"SHA-224\"===c||\"SHA-256\"===c)g=(a+65>>>9<<4)+15,e=16;else throw Error(\"Unexpected error in SHA-2 implementation\");for(;b.length<=g;)b.push(0);b[a>>>5]|=128<<24-a%32;a=a+l;b[g]=a&4294967295;b[g-1]=a/4294967296|0;l=b.length;for(a=0;a<l;a+=e)f=A(b.slice(a,a+e),f,c);if(\"SHA-224\"===c)b=[f[0],f[1],f[2],f[3],f[4],f[5],f[6]];else if(\"SHA-256\"===c)b=f;else throw Error(\"Unexpected error in SHA-2 implementation\");return b},p=function(b){return b.slice()},\"SHA-224\"===c)h=512,e=224;else if(\"SHA-256\"===c)h=512,e=256;else throw Error(\"Chosen SHA variant is not supported\");else throw Error(\"Chosen SHA variant is not supported\");k=B(a,f);n=x(c);this.setHMACKey=function(b,a,g){var e;if(!0===m)throw Error(\"HMAC key already set\");if(!0===z)throw Error(\"Cannot set HMAC key after calling update\");f=(g||{}).encoding||\"UTF8\";a=B(a,f)(b);b=a.binLen;a=a.value;e=h>>>3;g=e/4-1;if(e<b/8){for(a=y(a,b,0,x(c));a.length<=g;)a.push(0);a[g]&=4294967040}else if(e>b/8){for(;a.length<=g;)a.push(0);a[g]&=4294967040}for(b=0;b<=g;b+=1)t[b]=a[b]^909522486,r[b]=a[b]^1549556828;n=q(t,n);l=h;m=!0};this.update=function(a){var c,f,e,d=0,p=h>>>5;c=k(a,b,g);a=c.binLen;f=c.value;c=a>>>5;for(e=0;e<c;e+=p)d+h<=a&&(n=q(f.slice(e,e+p),n),d+=h);l+=d;b=f.slice(d>>>5);g=a%h;z=!0};this.getHash=function(a,f){var d,h,k,q;if(!0===m)throw Error(\"Cannot call getHash after setting HMAC key\");k=C(f);switch(a){case\"HEX\":d=function(a){return D(a,e,k)};break;case\"B64\":d=function(a){return E(a,e,k)};break;case\"BYTES\":d=function(a){return F(a,e)};break;case\"ARRAYBUFFER\":try{h=new ArrayBuffer(0)}catch(v){throw Error(\"ARRAYBUFFER not supported by this environment\");}d=function(a){return G(a,e)};break;default:throw Error(\"format must be HEX, B64, BYTES, or ARRAYBUFFER\");}q=y(b.slice(),g,l,p(n));for(h=1;h<u;h+=1)q=y(q,e,0,x(c));return d(q)};this.getHMAC=function(a,f){var d,k,t,u;if(!1===m)throw Error(\"Cannot call getHMAC without first setting HMAC key\");t=C(f);switch(a){case\"HEX\":d=function(a){return D(a,e,t)};break;case\"B64\":d=function(a){return E(a,e,t)};break;case\"BYTES\":d=function(a){return F(a,e)};break;case\"ARRAYBUFFER\":try{d=new ArrayBuffer(0)}catch(v){throw Error(\"ARRAYBUFFER not supported by this environment\");}d=function(a){return G(a,e)};break;default:throw Error(\"outputFormat must be HEX, B64, BYTES, or ARRAYBUFFER\");}k=y(b.slice(),g,l,p(n));u=q(r,x(c));u=y(k,e,h,u);return d(u)}}function m(){}function D(c,a,d){var l=\"\";a/=8;var b,g;for(b=0;b<a;b+=1)g=c[b>>>2]>>>8*(3+b%4*-1),l+=\"0123456789abcdef\".charAt(g>>>4&15)+\"0123456789abcdef\".charAt(g&15);return d.outputUpper?l.toUpperCase():l}function E(c,a,d){var l=\"\",b=a/8,g,f,n;for(g=0;g<b;g+=3)for(f=g+1<b?c[g+1>>>2]:0,n=g+2<b?c[g+2>>>2]:0,n=(c[g>>>2]>>>8*(3+g%4*-1)&255)<<16|(f>>>8*(3+(g+1)%4*-1)&255)<<8|n>>>8*(3+(g+2)%4*-1)&255,f=0;4>f;f+=1)8*g+6*f<=a?l+=\"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/\".charAt(n>>>6*(3-f)&63):l+=d.b64Pad;return l}function F(c,a){var d=\"\",l=a/8,b,g;for(b=0;b<l;b+=1)g=c[b>>>2]>>>8*(3+b%4*-1)&255,d+=String.fromCharCode(g);return d}function G(c,a){var d=a/8,l,b=new ArrayBuffer(d),g;g=new Uint8Array(b);for(l=0;l<d;l+=1)g[l]=c[l>>>2]>>>8*(3+l%4*-1)&255;return b}function C(c){var a={outputUpper:!1,b64Pad:\"=\",shakeLen:-1};c=c||{};a.outputUpper=c.outputUpper||!1;!0===c.hasOwnProperty(\"b64Pad\")&&(a.b64Pad=c.b64Pad);if(\"boolean\"!==typeof a.outputUpper)throw Error(\"Invalid outputUpper formatting option\");if(\"string\"!==typeof a.b64Pad)throw Error(\"Invalid b64Pad formatting option\");return a}function B(c,a){var d;switch(a){case\"UTF8\":case\"UTF16BE\":case\"UTF16LE\":break;default:throw Error(\"encoding must be UTF8, UTF16BE, or UTF16LE\");}switch(c){case\"HEX\":d=function(a,b,c){var f=a.length,d,k,e,h,q;if(0!==f%2)throw Error(\"String of HEX type must be in byte increments\");b=b||[0];c=c||0;q=c>>>3;for(d=0;d<f;d+=2){k=parseInt(a.substr(d,2),16);if(isNaN(k))throw Error(\"String of HEX type contains invalid characters\");h=(d>>>1)+q;for(e=h>>>2;b.length<=e;)b.push(0);b[e]|=k<<8*(3+h%4*-1)}return{value:b,binLen:4*f+c}};break;case\"TEXT\":d=function(c,b,d){var f,n,k=0,e,h,q,m,p,r;b=b||[0];d=d||0;q=d>>>3;if(\"UTF8\"===a)for(r=3,e=0;e<c.length;e+=1)for(f=c.charCodeAt(e),n=[],128>f?n.push(f):2048>f?(n.push(192|f>>>6),n.push(128|f&63)):55296>f||57344<=f?n.push(224|f>>>12,128|f>>>6&63,128|f&63):(e+=1,f=65536+((f&1023)<<10|c.charCodeAt(e)&1023),n.push(240|f>>>18,128|f>>>12&63,128|f>>>6&63,128|f&63)),h=0;h<n.length;h+=1){p=k+q;for(m=p>>>2;b.length<=m;)b.push(0);b[m]|=n[h]<<8*(r+p%4*-1);k+=1}else if(\"UTF16BE\"===a||\"UTF16LE\"===a)for(r=2,n=\"UTF16LE\"===a&&!0||\"UTF16LE\"!==a&&!1,e=0;e<c.length;e+=1){f=c.charCodeAt(e);!0===n&&(h=f&255,f=h<<8|f>>>8);p=k+q;for(m=p>>>2;b.length<=m;)b.push(0);b[m]|=f<<8*(r+p%4*-1);k+=2}return{value:b,binLen:8*k+d}};break;case\"B64\":d=function(a,b,c){var f=0,d,k,e,h,q,m,p;if(-1===a.search(/^[a-zA-Z0-9=+/]+$/))throw Error(\"Invalid character in base-64 string\");k=a.indexOf(\"=\");a=a.replace(/=/g,\"\");if(-1!==k&&k<a.length)throw Error(\"Invalid '=' found in base-64 string\");b=b||[0];c=c||0;m=c>>>3;for(k=0;k<a.length;k+=4){q=a.substr(k,4);for(e=h=0;e<q.length;e+=1)d=\"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/\".indexOf(q[e]),h|=d<<18-6*e;for(e=0;e<q.length-1;e+=1){p=f+m;for(d=p>>>2;b.length<=d;)b.push(0);b[d]|=(h>>>16-8*e&255)<<8*(3+p%4*-1);f+=1}}return{value:b,binLen:8*f+c}};break;case\"BYTES\":d=function(a,b,c){var d,n,k,e,h;b=b||[0];c=c||0;k=c>>>3;for(n=0;n<a.length;n+=1)d=a.charCodeAt(n),h=n+k,e=h>>>2,b.length<=e&&b.push(0),b[e]|=d<<8*(3+h%4*-1);return{value:b,binLen:8*a.length+c}};break;case\"ARRAYBUFFER\":try{d=new ArrayBuffer(0)}catch(l){throw Error(\"ARRAYBUFFER not supported by this environment\");}d=function(a,b,c){var d,n,k,e,h;b=b||[0];c=c||0;n=c>>>3;h=new Uint8Array(a);for(d=0;d<a.byteLength;d+=1)e=d+n,k=e>>>2,b.length<=k&&b.push(0),b[k]|=h[d]<<8*(3+e%4*-1);return{value:b,binLen:8*a.byteLength+c}};break;default:throw Error(\"format must be HEX, TEXT, B64, BYTES, or ARRAYBUFFER\");}return d}function r(c,a){return c>>>a|c<<32-a}function J(c,a,d){return c&a^~c&d}function K(c,a,d){return c&a^c&d^a&d}function L(c){return r(c,2)^r(c,13)^r(c,22)}function M(c){return r(c,6)^r(c,11)^r(c,25)}function N(c){return r(c,7)^r(c,18)^c>>>3}function O(c){return r(c,17)^r(c,19)^c>>>10}function P(c,a){var d=(c&65535)+(a&65535);return((c>>>16)+(a>>>16)+(d>>>16)&65535)<<16|d&65535}function Q(c,a,d,l){var b=(c&65535)+(a&65535)+(d&65535)+(l&65535);return((c>>>16)+(a>>>16)+(d>>>16)+(l>>>16)+(b>>>16)&65535)<<16|b&65535}function R(c,a,d,l,b){var g=(c&65535)+(a&65535)+(d&65535)+(l&65535)+(b&65535);return((c>>>16)+(a>>>16)+(d>>>16)+(l>>>16)+(b>>>16)+(g>>>16)&65535)<<16|g&65535}function x(c){var a=[],d;if(0===c.lastIndexOf(\"SHA-\",0))switch(a=[3238371032,914150663,812702999,4144912697,4290775857,1750603025,1694076839,3204075428],d=[1779033703,3144134277,1013904242,2773480762,1359893119,2600822924,528734635,1541459225],c){case\"SHA-224\":break;case\"SHA-256\":a=d;break;case\"SHA-384\":a=[new m,new m,new m,new m,new m,new m,new m,new m];break;case\"SHA-512\":a=[new m,new m,new m,new m,new m,new m,new m,new m];break;default:throw Error(\"Unknown SHA variant\");}else throw Error(\"No SHA variants supported\");return a}function A(c,a,d){var l,b,g,f,n,k,e,h,m,r,p,w,t,x,u,z,A,B,C,D,E,F,v=[],G;if(\"SHA-224\"===d||\"SHA-256\"===d)r=64,w=1,F=Number,t=P,x=Q,u=R,z=N,A=O,B=L,C=M,E=K,D=J,G=H;else throw Error(\"Unexpected error in SHA-2 implementation\");d=a[0];l=a[1];b=a[2];g=a[3];f=a[4];n=a[5];k=a[6];e=a[7];for(p=0;p<r;p+=1)16>p?(m=p*w,h=c.length<=m?0:c[m],m=c.length<=m+1?0:c[m+1],v[p]=new F(h,m)):v[p]=x(A(v[p-2]),v[p-7],z(v[p-15]),v[p-16]),h=u(e,C(f),D(f,n,k),G[p],v[p]),m=t(B(d),E(d,l,b)),e=k,k=n,n=f,f=t(g,h),g=b,b=l,l=d,d=t(h,m);a[0]=t(d,a[0]);a[1]=t(l,a[1]);a[2]=t(b,a[2]);a[3]=t(g,a[3]);a[4]=t(f,a[4]);a[5]=t(n,a[5]);a[6]=t(k,a[6]);a[7]=t(e,a[7]);return a}var H;H=[1116352408,1899447441,3049323471,3921009573,961987163,1508970993,2453635748,2870763221,3624381080,310598401,607225278,1426881987,1925078388,2162078206,2614888103,3248222580,3835390401,4022224774,264347078,604807628,770255983,1249150122,1555081692,1996064986,2554220882,2821834349,2952996808,3210313671,3336571891,3584528711,113926993,338241895,666307205,773529912,1294757372,1396182291,1695183700,1986661051,2177026350,2456956037,2730485921,2820302411,3259730800,3345764771,3516065817,3600352804,4094571909,275423344,430227734,506948616,659060556,883997877,958139571,1322822218,1537002063,1747873779,1955562222,2024104815,2227730452,2361852424,2428436474,2756734187,3204031479,3329325298];\"function\"===typeof define&&define.amd?define(function(){return w}):\"undefined\"!==typeof exports?(\"undefined\"!==typeof module&&module.exports&&(module.exports=w),exports=w):I.jsSHA=w})(this);")];
                    case 1:
                        _a.sent();
                        return [2, true];
                }
            });
        });
    };
    Client.prototype.sendImageAsSticker = function (to, b64) {
        return __awaiter(this, void 0, void 0, function () {
            var buff, mimeInfo, scaledImageBuffer, webp, metadata, webpBase64;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this._loadedModules.includes('jsSha')) return [3, 2];
                        return [4, this.injectJsSha()];
                    case 1:
                        _a.sent();
                        this._loadedModules.push('jsSha');
                        _a.label = 2;
                    case 2:
                        buff = Buffer.from(b64.replace(/^data:image\/(png|gif|jpeg);base64,/, ''), 'base64');
                        mimeInfo = base64MimeType(b64);
                        if (!(!mimeInfo || mimeInfo.includes("image"))) return [3, 7];
                        return [4, sharp_1.default(buff, { failOnError: false })
                                .resize({ width: 512, height: 512 })
                                .toBuffer()];
                    case 3:
                        scaledImageBuffer = _a.sent();
                        webp = sharp_1.default(scaledImageBuffer, { failOnError: false }).webp();
                        return [4, webp.metadata()];
                    case 4:
                        metadata = _a.sent();
                        console.log("sendImageAsSticker -> metadata", metadata);
                        return [4, webp.toBuffer()];
                    case 5:
                        webpBase64 = (_a.sent()).toString('base64');
                        return [4, this.pup(function (_a) {
                                var webpBase64 = _a.webpBase64, to = _a.to, metadata = _a.metadata;
                                return WAPI.sendImageAsSticker(webpBase64, to, metadata);
                            }, { webpBase64: webpBase64, to: to, metadata: metadata })];
                    case 6: return [2, _a.sent()];
                    case 7:
                        console.log('Not an image');
                        return [2, false];
                }
            });
        });
    };
    Client.prototype.sendRawWebpAsSticker = function (to, webpBase64) {
        return __awaiter(this, void 0, void 0, function () {
            var metadata;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this._loadedModules.includes('jsSha')) return [3, 2];
                        return [4, this.injectJsSha()];
                    case 1:
                        _a.sent();
                        this._loadedModules.push('jsSha');
                        _a.label = 2;
                    case 2:
                        metadata = {
                            format: 'webp',
                            width: 512,
                            height: 512,
                            animated: true,
                        };
                        return [4, this.pup(function (_a) {
                                var webpBase64 = _a.webpBase64, to = _a.to, metadata = _a.metadata;
                                return WAPI.sendImageAsSticker(webpBase64, to, metadata);
                            }, { webpBase64: webpBase64, to: to, metadata: metadata })];
                    case 3: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.postTextStatus = function (text, textRgba, backgroundRgba, font) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var text = _a.text, textRgba = _a.textRgba, backgroundRgba = _a.backgroundRgba, font = _a.font;
                            return WAPI.postTextStatus(text, textRgba, backgroundRgba, font);
                        }, { text: text, textRgba: textRgba, backgroundRgba: backgroundRgba, font: font })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.postImageStatus = function (data, caption) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var data = _a.data, caption = _a.caption;
                            return WAPI.postImageStatus(data, caption);
                        }, { data: data, caption: caption })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.postVideoStatus = function (data, caption) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var data = _a.data, caption = _a.caption;
                            return WAPI.postVideoStatus(data, caption);
                        }, { data: data, caption: caption })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.deleteStatus = function (statusesToDelete) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var statusesToDelete = _a.statusesToDelete;
                            return WAPI.deleteStatus(statusesToDelete);
                        }, { statusesToDelete: statusesToDelete })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.deleteAllStatus = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function () { return WAPI.deleteAllStatus(); })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getMyStatusArray = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function () { return WAPI.getMyStatusArray(); })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.getStoryViewers = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var id = _a.id;
                            return WAPI.getStoryViewers(id);
                        }, { id: id })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.clearAllChats = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function () { return WAPI.clearAllChats(); })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.cutMsgCache = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function () { return WAPI.cutMsgCache(); })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.downloadProfilePicFromMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.downloadFileWithCredentials(message.sender.profilePicThumbObj.imgFull)];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.downloadFileWithCredentials = function (url) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!url)
                            throw new Error('Missing URL');
                        return [4, this.pup(function (_a) {
                                var url = _a.url;
                                return WAPI.downloadFileWithCredentials(url);
                            }, { url: url })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.setProfilePic = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.pup(function (_a) {
                            var data = _a.data;
                            return WAPI.setProfilePic(data);
                        }, { data: data })];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    Client.prototype.registerWebhook = function (event, url, requestConfig, concurrency) {
        if (requestConfig === void 0) { requestConfig = {}; }
        if (concurrency === void 0) { concurrency = 5; }
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (!this._webhookQueue)
                    this._webhookQueue = new PQueue({ concurrency: concurrency });
                if (this[event]) {
                    if (!this._registeredWebhooks)
                        this._registeredWebhooks = {};
                    if (this._registeredWebhooks[event]) {
                        console.log('webhook already registered');
                        return [2, false];
                    }
                    this._registeredWebhooks[event] = this[event](function (_data) { return __awaiter(_this, void 0, void 0, function () {
                        var _this = this;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4, this._webhookQueue.add(function () { return __awaiter(_this, void 0, void 0, function () {
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0: return [4, axios_1.default(__assign({ method: 'post', url: url, data: {
                                                            ts: Date.now(),
                                                            event: event,
                                                            data: _data
                                                        } }, requestConfig))];
                                                case 1: return [2, _a.sent()];
                                            }
                                        });
                                    }); })];
                                case 1: return [2, _a.sent()];
                            }
                        });
                    }); });
                    return [2, this._registeredWebhooks[event]];
                }
                console.log('Invalid lisetner', event);
                return [2, false];
            });
        });
    };
    return Client;
}());
exports.Client = Client;
var puppeteer_config_2 = require("../config/puppeteer.config");
Object.defineProperty(exports, "useragent", { enumerable: true, get: function () { return puppeteer_config_2.useragent; } });
