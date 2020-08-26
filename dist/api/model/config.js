"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QRQuality = exports.NotificationLanguage = exports.QRFormat = void 0;
var QRFormat;
(function (QRFormat) {
    QRFormat["PNG"] = "png";
    QRFormat["JPEG"] = "jpeg";
    QRFormat["WEBM"] = "webm";
})(QRFormat = exports.QRFormat || (exports.QRFormat = {}));
var NotificationLanguage;
(function (NotificationLanguage) {
    NotificationLanguage["PTBR"] = "pt-br";
    NotificationLanguage["ENGB"] = "en-gb";
    NotificationLanguage["DEDE"] = "de-de";
    NotificationLanguage["ES"] = "es";
})(NotificationLanguage = exports.NotificationLanguage || (exports.NotificationLanguage = {}));
var QRQuality;
(function (QRQuality) {
    QRQuality[QRQuality["ONE"] = 0.1] = "ONE";
    QRQuality[QRQuality["TWO"] = 0.2] = "TWO";
    QRQuality[QRQuality["THREE"] = 0.3] = "THREE";
    QRQuality[QRQuality["FOUR"] = 0.4] = "FOUR";
    QRQuality[QRQuality["FIVE"] = 0.5] = "FIVE";
    QRQuality[QRQuality["SIX"] = 0.6] = "SIX";
    QRQuality[QRQuality["SEVEN"] = 0.7] = "SEVEN";
    QRQuality[QRQuality["EIGHT"] = 0.8] = "EIGHT";
    QRQuality[QRQuality["NINE"] = 0.9] = "NINE";
    QRQuality[QRQuality["TEN"] = 1] = "TEN";
})(QRQuality = exports.QRQuality || (exports.QRQuality = {}));
