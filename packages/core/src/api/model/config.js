"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseType = exports.QRQuality = exports.OnError = exports.NotificationLanguage = exports.DIRECTORY_STRATEGY = exports.CLOUD_PROVIDERS = exports.QRFormat = void 0;
var QRFormat;
(function (QRFormat) {
    QRFormat["PNG"] = "png";
    QRFormat["JPEG"] = "jpeg";
    QRFormat["WEBM"] = "webm";
})(QRFormat || (exports.QRFormat = QRFormat = {}));
var CLOUD_PROVIDERS;
(function (CLOUD_PROVIDERS) {
    CLOUD_PROVIDERS["GCP"] = "GCP";
    CLOUD_PROVIDERS["WASABI"] = "WASABI";
    CLOUD_PROVIDERS["AWS"] = "AWS";
    CLOUD_PROVIDERS["CONTABO"] = "CONTABO";
    CLOUD_PROVIDERS["DO"] = "DO";
    CLOUD_PROVIDERS["MINIO"] = "MINIO";
})(CLOUD_PROVIDERS || (exports.CLOUD_PROVIDERS = CLOUD_PROVIDERS = {}));
var DIRECTORY_STRATEGY;
(function (DIRECTORY_STRATEGY) {
    DIRECTORY_STRATEGY["DATE"] = "DATE";
    DIRECTORY_STRATEGY["CHAT"] = "CHAT";
    DIRECTORY_STRATEGY["CHAT_DATE"] = "CHAT_DATE";
    DIRECTORY_STRATEGY["DATE_CHAT"] = "DATE_CHAT";
})(DIRECTORY_STRATEGY || (exports.DIRECTORY_STRATEGY = DIRECTORY_STRATEGY = {}));
var NotificationLanguage;
(function (NotificationLanguage) {
    NotificationLanguage["PTBR"] = "pt-br";
    NotificationLanguage["ENGB"] = "en-gb";
    NotificationLanguage["DEDE"] = "de-de";
    NotificationLanguage["IDID"] = "id-id";
    NotificationLanguage["ITIT"] = "it-it";
    NotificationLanguage["NLNL"] = "nl-nl";
    NotificationLanguage["ES"] = "es";
})(NotificationLanguage || (exports.NotificationLanguage = NotificationLanguage = {}));
var OnError;
(function (OnError) {
    OnError["AS_STRING"] = "AS_STRING";
    OnError["RETURN_FALSE"] = "RETURN_FALSE";
    OnError["THROW"] = "THROW";
    OnError["LOG_AND_FALSE"] = "LOG_AND_FALSE";
    OnError["LOG_AND_STRING"] = "LOG_AND_STRING";
    OnError["RETURN_ERROR"] = "RETURN_ERROR";
    OnError["NOTHING"] = "NOTHING";
})(OnError || (exports.OnError = OnError = {}));
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
})(QRQuality || (exports.QRQuality = QRQuality = {}));
var LicenseType;
(function (LicenseType) {
    LicenseType["CUSTOM"] = "CUSTOM";
    LicenseType["B2B_RESTRICTED_VOLUME_LICENSE"] = "B2B_RESTRICTED_VOLUME_LICENSE";
    LicenseType["INSIDER"] = "Insiders Program";
    LicenseType["TEXT_STORY"] = "Text Story License Key";
    LicenseType["IMAGE_STORY"] = "Image Story License Key";
    LicenseType["VIDEO_STORY"] = "Video Story License Key";
    LicenseType["PREMIUM"] = "Premium License Key";
    LicenseType["NONE"] = "NONE";
})(LicenseType || (exports.LicenseType = LicenseType = {}));
//# sourceMappingURL=config.js.map