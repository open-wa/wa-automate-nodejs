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
Object.defineProperty(exports, "__esModule", { value: true });
var events_1 = require("../events");
var http = require('http'), io = require('socket.io'), open = require('open'), fs = require('fs'), getPort = require('get-port'), gClient, PORT, server;
var timeout = function (ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms, 'timeout'); });
};
events_1.ev.on('**', function (data, sessionId, namespace) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!gClient) return [3, 2];
                return [4, gClient.send({ data: data, sessionId: sessionId, namespace: namespace })];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2: return [2];
        }
    });
}); });
function popup(preferredPort) {
    return __awaiter(this, void 0, void 0, function () {
        var i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (server)
                        return [2, "http://localhost:" + PORT];
                    return [4, getPort({ host: 'localhost', port: typeof preferredPort == 'number' ? [preferredPort, 3000, 3001, 3002] : [3000, 3001, 3002] })];
                case 1:
                    PORT = _a.sent();
                    server = http.createServer(function (req, res) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        fs.readFile(__dirname + '/index.html', function (err, data) {
                            res.write(data, 'utf8');
                            res.end();
                        });
                    });
                    server.listen(PORT, '0.0.0.0');
                    i = io.listen(server);
                    return [4, open("http://localhost:" + PORT, { app: ['google chrome', '--incognito'] })];
                case 2:
                    _a.sent();
                    return [4, new Promise(function (resolve) {
                            i.on('connection', function (client) {
                                gClient = client;
                                resolve("http://localhost:" + PORT);
                            });
                        })];
                case 3: return [2, _a.sent()];
            }
        });
    });
}
exports.popup = popup;
