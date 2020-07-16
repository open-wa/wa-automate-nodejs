"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var eventemitter2_1 = require("eventemitter2");
var spinnies_1 = __importDefault(require("spinnies"));
var spinner = {
    "interval": 80,
    "frames": [
        "🌑 ",
        "🌒 ",
        "🌓 ",
        "🌔 ",
        "🌕 ",
        "🌖 ",
        "🌗 ",
        "🌘 "
    ]
};
exports.ev = new eventemitter2_1.EventEmitter2({
    wildcard: true,
});
var globalSpinner;
var getGlobalSpinner = function (disableSpins) {
    if (disableSpins === void 0) { disableSpins = false; }
    if (!globalSpinner)
        globalSpinner = new spinnies_1.default({ color: 'blue', succeedColor: 'green', spinner: spinner, disableSpins: disableSpins });
    return globalSpinner;
};
var EvEmitter = (function () {
    function EvEmitter(sessionId, eventNamespace) {
        this.sessionId = sessionId;
        this.eventNamespace = eventNamespace;
    }
    EvEmitter.prototype.emit = function (data, eventNamespaceOverride) {
        exports.ev.emit((eventNamespaceOverride || this.eventNamespace) + "." + this.sessionId, data, this.sessionId, this.eventNamespace);
    };
    return EvEmitter;
}());
exports.EvEmitter = EvEmitter;
var Spin = (function (_super) {
    __extends(Spin, _super);
    function Spin(sessionId, eventNamespace, disableSpins, shouldEmit) {
        if (disableSpins === void 0) { disableSpins = false; }
        if (shouldEmit === void 0) { shouldEmit = true; }
        var _this = _super.call(this, sessionId, eventNamespace) || this;
        _this._spinId = sessionId + "_" + eventNamespace;
        _this._spinner = getGlobalSpinner(disableSpins);
        _this._shouldEmit = shouldEmit;
        return _this;
    }
    Spin.prototype.start = function (eventMessage) {
        this._spinner.add(this._spinId, { text: eventMessage });
        if (this._shouldEmit)
            this.emit(eventMessage);
    };
    Spin.prototype.info = function (eventMessage) {
        if (!this._spinner.pick(this._spinId))
            this.start('');
        this._spinner.update(this._spinId, { text: eventMessage });
        if (this._shouldEmit)
            this.emit(eventMessage);
    };
    Spin.prototype.fail = function (eventMessage) {
        if (!this._spinner.pick(this._spinId))
            this.start('');
        this._spinner.fail(this._spinId, { text: eventMessage });
        if (this._shouldEmit)
            this.emit(eventMessage);
    };
    Spin.prototype.succeed = function (eventMessage) {
        if (!this._spinner.pick(this._spinId))
            this.start('');
        this._spinner.succeed(this._spinId, { text: eventMessage });
        if (this._shouldEmit)
            this.emit(eventMessage || 'SUCCESS');
    };
    Spin.prototype.remove = function () {
        this._spinner.remove(this._spinId);
    };
    return Spin;
}(EvEmitter));
exports.Spin = Spin;
