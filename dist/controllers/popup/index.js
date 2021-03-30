"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeHttp = exports.popup = void 0;
/** @internal */ /** */
const events_1 = require("../events");
const socket_io_1 = require("socket.io");
const open_1 = __importDefault(require("open"));
const get_port_1 = __importDefault(require("get-port"));
const osName = require("os-name");
const command_exists_1 = __importDefault(require("command-exists"));
const http_1 = __importDefault(require("http"));
const currentQrCodes = {
    "latest": "data:image/png;base64,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"
}, serverSockets = {};
let io, express, app, gClient, PORT, server;
const setUpApp = () => {
    express = require('express');
    app = express();
    app.use(express.static(__dirname + '/node_modules'));
    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/index.html');
    });
    app.get('/qr', function (req, res) {
        const { sessionId } = req.query;
        const qr = sessionId ? currentQrCodes[sessionId] || currentQrCodes.latest : currentQrCodes.latest;
        res.writeHead(200, { 'Content-Type': 'image/png' });
        res.write(Buffer.from(qr.replace('data:image/png;base64,', ''), 'base64'), 'utf8');
        res.end();
    });
};
function popup(config) {
    return __awaiter(this, void 0, void 0, function* () {
        setUpApp();
        const preferredPort = config.popup;
        const popupListener = events_1.ev.on('**', (data, sessionId, namespace) => __awaiter(this, void 0, void 0, function* () {
            if (namespace.includes("sessionData"))
                return;
            if (gClient) {
                yield gClient.send({ data, sessionId, namespace });
                if ((data === null || data === void 0 ? void 0 : data.includes) && (data === null || data === void 0 ? void 0 : data.includes("ready for account"))) {
                    yield gClient.send({ data: config === null || config === void 0 ? void 0 : config.apiHost, sessionId, namespace: "ready" });
                }
            }
            if (namespace === 'qr') {
                currentQrCodes[sessionId] = data;
                currentQrCodes['latest'] = data;
            }
            if ((data === null || data === void 0 ? void 0 : data.includes) && (data === null || data === void 0 ? void 0 : data.includes("ready for account"))) {
                //@ts-ignore
                popupListener.off();
                yield exports.closeHttp();
            }
        }), { objectify: true });
        /**
         * There should only be one instance of this open. If the server is already running, respond with the address.
         */
        if (server)
            return `http://localhost:${PORT}`;
        PORT = yield get_port_1.default({ host: 'localhost', port: typeof preferredPort == 'number' ? [preferredPort, 7000, 7001, 7002] : [7000, 7001, 7002] });
        server = http_1.default.createServer(app);
        if (!(config === null || config === void 0 ? void 0 : config.qrPopUpOnly)) {
            io = new socket_io_1.Server(server);
            io.on('connection', function (client) {
                gClient = client;
            });
        }
        server.on("connection", (conn) => {
            const key = conn.remoteAddress + ':' + conn.remotePort;
            serverSockets[key] = conn;
            conn.on("close", () => {
                delete serverSockets[key];
            });
        });
        server.listen(PORT);
        const os = osName();
        const appName = os.includes('macOS') ? 'google chrome' : os.includes('Windows') ? 'chrome' : 'google-chrome';
        const hasChrome = yield command_exists_1.default(appName).then(() => true).catch(() => false);
        if (hasChrome) {
            if (!(config === null || config === void 0 ? void 0 : config.inDocker))
                yield open_1.default(`http://localhost:${PORT}${(config === null || config === void 0 ? void 0 : config.qrPopUpOnly) ? `/qr` : ``}`, { app: {
                        name: (config === null || config === void 0 ? void 0 : config.executablePath) || appName,
                        arguments: ['--incognito']
                    }, allowNonzeroExitCode: true }).catch(() => { return; });
            else
                return "NA";
        }
        else
            return `http://localhost:${PORT}${(config === null || config === void 0 ? void 0 : config.qrPopUpOnly) ? '/qr' : ''}`;
        return `http://localhost:${PORT}${(config === null || config === void 0 ? void 0 : config.qrPopUpOnly) ? '/qr' : ''}`;
    });
}
exports.popup = popup;
const closeHttp = () => __awaiter(void 0, void 0, void 0, function* () {
    if (!server)
        return;
    for (const key in serverSockets) {
        serverSockets[key].destroy();
    }
    return yield new Promise(resolve => server.close(resolve));
});
exports.closeHttp = closeHttp;
