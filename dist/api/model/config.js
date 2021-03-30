"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseType = exports.QRQuality = exports.NotificationLanguage = exports.QRFormat = void 0;
/**
 * The different types of qr code output.
 */
var QRFormat;
(function (QRFormat) {
    QRFormat["PNG"] = "png";
    QRFormat["JPEG"] = "jpeg";
    QRFormat["WEBM"] = "webm";
})(QRFormat = exports.QRFormat || (exports.QRFormat = {}));
/**
 * The available languages for the host security notification
 */
var NotificationLanguage;
(function (NotificationLanguage) {
    NotificationLanguage["PTBR"] = "pt-br";
    NotificationLanguage["ENGB"] = "en-gb";
    NotificationLanguage["DEDE"] = "de-de";
    NotificationLanguage["IDID"] = "id-id";
    NotificationLanguage["ITIT"] = "it-it";
    NotificationLanguage["ES"] = "es";
})(NotificationLanguage = exports.NotificationLanguage || (exports.NotificationLanguage = {}));
/**
 * The set values of quality you can set for the quality of the qr code output. Ten being the highest quality.
 */
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
var LicenseType;
(function (LicenseType) {
    LicenseType["CUSTOM"] = "CUSTOM";
    LicenseType["B2B_RESTRICTED_VOLUME_LICENSE"] = "B2B_RESTRICTED_VOLUME_LICENSE";
    LicenseType["INSIDER"] = "Insiders Program";
    LicenseType["TEXT_STORY"] = "Text Story License Key";
    LicenseType["IMAGE_STORY"] = "Image Story License Key";
    LicenseType["VIDEO_STORY"] = "Video Story License Key";
    LicenseType["PREMIUM"] = "Premium License Key";
})(LicenseType = exports.LicenseType || (exports.LicenseType = {}));
