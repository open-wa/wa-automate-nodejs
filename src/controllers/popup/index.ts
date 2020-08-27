/** @internal *//** */
import { ev } from "../events";
import path from "path";

var http = require('http'),
    io = require('socket.io'),
    open = require('open'),
    fs = require('fs'),
    getPort = require('get-port'),
    gClient,
    PORT,
    server;

const timeout = ms => {
    return new Promise(resolve => setTimeout(resolve, ms, 'timeout'));
  }

  ev.on('**', async (data, sessionId, namespace) => {
    if(gClient) await gClient.send({ data, sessionId, namespace })
    });

export async function popup(preferredPort : boolean | number) {
    /**
     * There should only be one instance of this open. If the server is already running, respond with the address.
     */

    if(server) return `http://localhost:${PORT}`;
    PORT = await getPort({host:'localhost',port: typeof preferredPort == 'number' ?  [preferredPort, 3000, 3001, 3002] : [3000, 3001, 3002]});

    server = http.createServer(function (req, res) {
        res.writeHead(200, { 'Content-Type': 'text/html' })
        fs.readFile(path.resolve(__dirname, './index.html'), function (err, data) {
            res.write(data, 'utf8');
            res.end();
        });
    })

    server.listen(PORT, '0.0.0.0');

    var i = io.listen(server);

    await open(`http://localhost:${PORT}`, {app: ['google chrome', '--incognito']});
    
    return await new Promise(resolve => {
        i.on('connection', function (client) {
            gClient = client;
            resolve(`http://localhost:${PORT}`);
        });
    });
}