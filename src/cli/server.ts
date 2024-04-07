//@ts-ignore
import express from 'express';
import https from 'https'
import http, {ServerOptions} from 'http'
import { collections } from './collections';
import robots from "express-robots-txt";
import swaggerUi from 'swagger-ui-express';
import { default as axios } from 'axios'
import parseFunction from 'parse-function';
import { Client, ev, SimpleListener, ChatId, Message, log } from '..';
import qs from 'qs';
import * as fs from 'fs';
import { convert } from 'xmlbuilder2';
import { chatwootMiddleware, chatwoot_webhook_check_event_name } from './integrations/chatwoot';
import {IpFilter, IpDeniedError} from'express-ipfilter'
import helmet from "helmet";
import { tunnel } from "cloudflared";

import { spawn } from 'child_process';
import { createCustomDomainTunnel } from './integrations/cloudflare';

export const app = express();
export let server = http.createServer(app);

// will be used to clean up cloudflared tunnel
let stop;

const trimChatId = (chatId : ChatId) => chatId.replace("@c.us","").replace("@g.us","")

export type cliFlags = {
    [k : string] : number | string | boolean
}

const socketListenerCallbacks : {
    [socketId: string] : {
        [listener in SimpleListener] ?: any
    }
} = {}

// const existingListeners = () => Object.keys(Object.keys(socketListenerCallbacks).flatMap(id=>Object.keys(socketListenerCallbacks[id])).reduce((acc,curr)=>{acc[curr]=true;return acc},{}))
const existingListeners = [];

const getCallbacks : (listener: SimpleListener) => any[] = (listener : SimpleListener) => Object.keys(socketListenerCallbacks).flatMap(k=>socketListenerCallbacks[k]).map(o=>o[listener]).filter(x=>x)

export const setupHttpServer = (cliConfig: cliFlags) => {
    //check if there is an allow IP list:
    if(cliConfig.allowIps){
        let allowIps = cliConfig.allowIps as string[] | string
        if(!Array.isArray(cliConfig.allowIps)) allowIps = [cliConfig.allowIps as string]
        if(Array.isArray(allowIps) && allowIps.length > 0 && allowIps[0]) {
          console.log("Allowed IPs", allowIps)
          let allowIpsOptions : any = {
            mode: 'allow',
            forbidden: 'You are not authorized to access this page.',
            log: false
          }
          if(cliConfig.verbose) allowIpsOptions = {
            ...allowIpsOptions,
            logLevel: 'deny',
            log: true
          }
          app.use(IpFilter(allowIps as string[], allowIpsOptions))
          app.use((err, req, res, next) => {
            if (err instanceof IpDeniedError) {
              res.status(401)
              res.send("Access Denied");
              return;
            }
            next()
          })
        }
    }
    if(cliConfig.helmet) {
        //@ts-ignore
        app.use(helmet())
    }
    const privkey = `${process.env.PRIV || cliConfig.privkey || ""}`;
    const cert =    `${process.env.CERT || cliConfig.cert || ""}`;
    if(privkey && cert) {
        console.log("HTTPS Mode:", privkey, cert)
        const privContents = fs.readFileSync(privkey);
        const certContents = fs.readFileSync(cert);
        app.use((req, res, next) => {
            if (!req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV !== "development") {
              return res.redirect('https://' + req.get('host') + req.url);
            }
            next();
        })
        if(privContents && certContents) {
            const options = {key: privContents,cert: certContents}
            server = https.createServer(options as ServerOptions, app);
            cliConfig.https = true;
            return;
        }
    }
    server = http.createServer(app);
}

export const setUpExpressApp : () => void = () => {
    app.use(robots({ UserAgent: '*', Disallow: '/' }))
    //@ts-ignore
    app.use(express.json({ limit: '99mb' })) //add the limit option so we can send base64 data through the api
    setupMetaMiddleware();
}

export const enableCORSRequests : (cliConfig : cliFlags) => void = async (cliConfig : cliFlags) => {
    const {default : cors} = await import('cors');
    app.use(cors(typeof cliConfig.cors === 'object' && cliConfig.cors));
}

export const setupAuthenticationLayer : (cliConfig : cliFlags) => void = (cliConfig : cliFlags) => {
    app.use((req, res, next) => {
        if (req.path === '/' && req.method === 'GET') return res.redirect('/api-docs/');
        if (req.path.startsWith('/api-docs') || req.path.startsWith('/swagger-stats')) {
            return next();
        }
        const apiKey = req.get('key') || req.get('api_key')
        if (req.path.includes('chatwoot') && req.query['api_key'] && req.query['api_key'] == cliConfig.key) {
            next();
        } else if (!apiKey || apiKey !== cliConfig.key) {
            res.status(401).json({ error: 'unauthorised' })
        } else {
            next()
        }
    })
}

export const setupApiDocs : (cliConfig : cliFlags) => void = (cliConfig : cliFlags) => {
    const swOptions = {
        customCss: '.opblock-description { white-space: pre-line }'
    }
    if (cliConfig.key && cliConfig.preAuthDocs) {
        swOptions["swaggerOptions"] = {
            authAction: {
                api_key: {
                    name: "api_key",
                    schema: { type: "apiKey", in: "header", name: "Authorization", description: "" },
                    value: cliConfig.key
                }
            }
        }
    }
    app.use('/api-docs', (req, res, next) => {
        if (req.originalUrl == "/api-docs") return res.redirect('api-docs/')
        next()
    }, swaggerUi.serve, swaggerUi.setup(collections["swagger"], swOptions));
    /**
     * Redirect to api docs if no path is specified
     */
    app.get('/',  (req, res) => res.redirect('/api-docs'))
}

export const setupSwaggerStatsMiddleware : (cliConfig : cliFlags) => Promise<void> = async (cliConfig : cliFlags) => {
    const { default: swStats } = await import('swagger-stats');
    app.use(swStats.getMiddleware({
        elasticsearch: process.env.elastic_url,
        elasticsearchUsername: process.env.elastic_un,
        elasticsearchPassword: process.env.elastic_pw,
        swaggerSpec: collections["swagger"],
        authentication: !!cliConfig.key,
        swaggerOnly: true,
        onResponseFinish: function (req, res, rrr) {
            ['file', 'base64', 'image', 'webpBase64', 'base64', 'durl', 'thumbnail'].forEach(key => {
                if (req.body.args[key])
                    req.body.args[key] = rrr.http.request.body.args[key] = req.body.args[key].slice(0, 25) || 'EMPTY'
            });
            if (rrr.http.response.code !== 200 && rrr.http.response.code !== 404) {
                rrr.http.response.phrase = res.statusMessage
            }
        },
        onAuthenticate: function (req, username, password) {
            return ((username === "admin") && (password === cliConfig.key));
        }
    }));
}

export const setupRefocusDisengageMiddleware : (cliConfig : cliFlags) => void = async (cliConfig : cliFlags) => {
    app.post('/disengage', (req: express.Request, res: express.Response) => {
        cliConfig.keepAlive = false;
        return res.send({
            result: true
        })
    })
}

const setupMetaMiddleware = () => {
    /**
     * Collection getter
     */
    app.get("/meta/:collectiontype", (req, res) => {
        const types = Object.keys(collections)
        const coltype = req.params.collectiontype.replace('.json', '');
        if (!coltype) return res.status(400).send("collection type missing")
        if (!types.includes(coltype)) return res.status(404).send(`collection ${coltype} not found`)
        return res.send(collections[coltype.replace('.json', '')])
    })

    /**
     * Basic
     */
    app.get("/meta/basic/commands", (_, res) => res.send(getCommands()))
    app.get("/meta/basic/listeners", (_, res) => res.send(listListeners()))
    
    /**
     * If you want to list the list of all languages GET https://codegen.openwa.dev/api/gen/clients
     * 
     * See here for request body: https://github.com/swagger-api/swagger-codegen#online-generators
     */
    app.post("/meta/codegen/:language", async (req, res) => {
        if (!req.params.language) return res.status(400).send({
            error: `language parameter missing`
        })
        try {
            if (!collections["swagger"]) return res.status(404).send(`collection not found`)
            const codeGenResponse = await axios.post(`https://codegen.openwa.dev/api/gen/clients/${req.params.language}`, {
                ...(req.body || {}),
                spec: {
                    ...collections["swagger"]
                }
            })
            return res.send(codeGenResponse.data)
        } catch (error) {
            return res.status(400).send({
                error: error.message
            })
        }
    })
}

export const setupMetaProcessMiddleware = (client : Client, cliConfig) => {
    /**
     * Kill the client. End the process.
     */
    let closing = false;
    const nuke = async (req, res, restart) => {
        res.set("Connection", "close");
        res.send(closing ? `Already closing! Stop asking!!` : 'Closing after connections closed. Waiting max 5 seconds');
        res.end()
        res.connection.end();
        res.connection.destroy();
        if(closing) return;
        closing = true;
        await client.kill("API_KILL");
        log.info("Waiting for maximum ")
        if(stop && typeof stop === 'function') stop()
        await Promise.race([
            new Promise((resolve)=>server.close(() => {
                console.log('Server closed');
                resolve(true);
            })),
            new Promise(resolve => setTimeout(resolve, 5000, 'timeout'))
        ]);
        if(process.env.pm_id && process.env.PM2_USAGE) {
            const cmd = `pm2 ${restart ? 'restart' : 'stop'} ${process.env.pm_id}`;
            log.info(`PM2 DETECTED, RUNNING COMMAND: ${cmd}`)
            const cmda = cmd.split(' ')
            spawn(cmda[0], cmda.splice(1), { stdio: 'inherit' })
        } else {
            if(restart) setTimeout(function () {
                process.on("exit", function () {
                    spawn(process.argv.shift(), process.argv, {
                        cwd: process.cwd(),
                        detached : true,
                        stdio: "inherit"
                    });
                });
                process.exit();
            }, 5000);
            else process.exit(restart ? 0 : 10);
        }
    }
    /**
     * Exit code 10 will prevent pm2 process from auto-restarting
     */
    app.post('/meta/process/exit', async (req, res) => {
        return await nuke(req,res,false)
    })

    /**
     * Will only restart if the process is managed by pm2
     * 
     * Note: Only works when `--pm2` flag is enabled.
     */
    app.post('/meta/process/restart', async (req, res) => {
        return await nuke(req,res,true)
    })
}
export const getCommands : () => any = () => Object.entries(collections['swagger'].paths).reduce((acc,[key,value])=>{acc[key.replace("/","")]=(value as any)?.post?.requestBody?.content["application/json"]?.example?.args || {};return acc},{})

export const listListeners : () => string[] = () => {
    return Object.keys(SimpleListener).map(eventKey => SimpleListener[eventKey])
}

export const setupMediaMiddleware : () => void = () => {
    app.use("/media", express.static('media'))
}

export const setupTunnel : (cliConfig, PORT: number) => Promise<string> = async (cliConfig, PORT: number) => {
    const cfT = cliConfig.cfTunnelHostDomain ? await createCustomDomainTunnel(cliConfig,PORT) : tunnel({ "--url": `localhost:${PORT}` });
    stop = cfT.stop;
    const url = await cfT.url;
    const conns = await Promise.all(cfT.connections);
    log.info(`Connections Ready! ${JSON.stringify(conns, null, 2)}`)
    cliConfig.apiHost = cliConfig.tunnel = url;
    return url;
}

export const setupTwilioCompatibleWebhook : (cliConfig : cliFlags, client: Client) => void = (cliConfig : cliFlags, client: Client) => {
    const url = cliConfig.twilioWebhook as string
    client.onMessage(async message=>{
        const waId = trimChatId(message.from)
        const fd = {};
        fd["To"] = `whatsapp:${trimChatId(message.to)}`
        fd["AccountSid"] = trimChatId(message.to)
        fd["WaId"] = waId
        fd["ProfileName"] = message?.chat?.formattedTitle || ""
        fd["SmsSid"] = message.id
        fd["SmsMessageSid"] = message.id
        fd["MessageSid"] = message.id
        fd["NumSegments"] = "1"
        fd["NumSegments"] = "1"
        fd["Body"] = message.loc || message.body || message.caption || ""
        fd["From"] = `whatsapp:${waId}`
        if(message.mimetype) {
            fd["MediaContentType0"] = message.mimetype || ""
            fd["MediaUrl0"] = message.cloudUrl || ""
            fd["NumMedia"] = "1"
        }
        if(message.lat) {
            fd["Latitude"] = message.lat || ""
            fd["Longitude"] = message.lng || ""
        }
        try {
        const {data} =  await axios( {
            method: 'post',
            url,
            data: qs.stringify(fd),
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
          })
          const obj : any = convert(data, { format: "object" });
              const msg = obj.Response.Message;
            //   const toId : string = msg['@to'].match(/\d*/g).filter(x=>x).join("-");
            //   const to = `${toId}@${toId.includes("-") ? 'g' : 'c'}.us` as ChatId
              if(msg.Media) {
                  return await client.sendFile(message.from, msg.Media, `file.${msg.Media.split(/[#?]/)[0].split('.').pop().trim()}`, msg['#'] || "")
              }
              return await client.sendText(message.from, msg['#'])
        } catch (error) {
            log.error("TWILIO-COMPAT WEBHOOK ERROR", url, error.message)
        }
    })
}

export const setupChatwoot : (cliConfig : cliFlags, client: Client) => void = async (cliConfig : cliFlags, client: Client) => {
    app.post('/chatwoot', chatwootMiddleware(cliConfig, client));
    app.post(`/chatwoot/checkWebhook`,async (req,res)=>{
        const {body} = req;
        log.info(`chatwoot webhook check request received: ${body.checkCode}`)
        await ev.emitAsync(chatwoot_webhook_check_event_name, body);
        return res.send({})
    })
    // await setupChatwootOutgoingMessageHandler(cliConfig, client);
}

export const setupBotPressHandler : (cliConfig : cliFlags, client: Client) => void = (cliConfig : cliFlags, client: Client) => {
    const u = cliConfig.botPressUrl as string
    const sendBotPressMessage = async (text:string, chatId : ChatId, message : Message) => {
    const url = `${u.split("/").slice(0,u.split("/").findIndex(x=>x=="converse")).join("/")}/converse/${chatId.replace("@c.us","").replace("@g.us","")}`
        try {
            const {data} =  await axios.post(url, {
                "type": "text",
                text,
                metadata: message
              })
            const {responses} = data;
            return await Promise.all(responses.filter(({type})=>type!="typing").map((response : any) => {
                if(response.type=="text"){
                    response.text = response.variations ? (response.variations.concat(response.text))[Math.floor(Math.random() * (response.variations.length + 1))] : response.text;
                    return client.sendText(chatId, response.text)
                }
                if(response.type=="file"){
                    return client.sendFile(chatId, response.url, `file.${response.url.split(/[#?]/)[0].split('.').pop().trim()}`, response.title || "")
                }
                if(response.type=="image"){
                    return client.sendFile(chatId, response.image, `file.${response.image.split(/[#?]/)[0].split('.').pop().trim()}`, response.title || "")
                }
                if(response.type=="single-choice"){
                    if(response["choices"] && response["choices"].length >= 1 && response["choices"].length <= 3){
                        return client.sendButtons(chatId, response.text , response["choices"].map(qr=>{
                            return {
                                id: qr.value,
                                text: qr.title
                            }
                        }),"")
                    }
                }
                if(response.type=="quick_replies"){
                    if(response["quick_replies"] && response["quick_replies"].length >= 1 && response["quick_replies"].length <= 3){
                        return client.sendButtons(chatId, response.wrapped.text, response["quick_replies"].map(qr=>{
                            return {
                                id: qr.payload,
                                text: qr.title
                            }
                        }),"")
                    }
                }
            }))
        } catch (error) {
            console.error("BOTPRESS API ERROR", url, error.message)
        }
    }
    client.onMessage(async message=>{
            let text = message.body;
            switch(message.type) {
                case 'location':
                    text = `${message.lat},${message.lng}`;
                    break;
                case 'buttons_response':
                    text = message.selectedButtonId;
                    break;
                case 'document':
                case 'image':
                case 'audio':
                case 'ptt':
                case 'video':
                    if(message.cloudUrl) text = message.cloudUrl;
                    break;
                default:
                    text = message.body || "__UNHANDLED__";
                    break;
            }
            await sendBotPressMessage(text, message.from, message)
    })
}

export const setupSocketServer : (cliConfig, client : Client) => Promise<void> = async (cliConfig, client : Client) => {
    const { Server } = await import("socket.io");
    const socketServerOptions = cliConfig.cors ? {
        cors: typeof cliConfig.cors === 'object' ? cliConfig.cors : {
              origin: "*",
              methods: ["GET", "POST"],
        },
    } : null
    const io = socketServerOptions ? new Server(server, socketServerOptions) : new Server(server);
    if (cliConfig.key) {
        io.use((socket, next) => {
            if (socket.handshake.auth["apiKey"] == cliConfig.key) next()
            else next(new Error("Authentication error"));
        });
    }
    io.on("connection", (socket) => {
        console.log("Connected to socket:", socket.id)
        socket.on('disconnect', (reason : string) => {
            console.log(`Socket ${socket.id} ~ reason: ${reason}`)
            socketListenerCallbacks[socket.id] = {}
        })
        socket.onAny(async (m, ...args) => {
            log.info("🔌", m)
            if(m==="register_ev") {
                ev.onAny((event:string,value:any)=>socket.emit(event,value))
            }
            const callbacks = args.filter(arg => typeof arg === "function")
            const objs = args.filter(arg => typeof arg === "object")
            if(m==="node_red_init_call"){
                if(!collections['swagger']) return callbacks[0]();
                return callbacks[0](getCommands())
            }

            if(m==="node_red_init_listen"){
                return callbacks[0](listListeners())
            }

            
            if (client[m as string]) {
                if (m.startsWith("on") && callbacks[0]) {
                    //there should only be one instance of the socket callback per listener
                    if(!socketListenerCallbacks[socket.id]) socketListenerCallbacks[socket.id] = {}
                        const callback = x => socket.emit(m, x)
                        let listenerSet = true;
                        if(!existingListeners.includes(m)){
                            listenerSet = await client[m](async data=> Promise.all(getCallbacks(m).map(fn=>fn(data))))
                            existingListeners.push(m)
                        }
                        callbacks[0](listenerSet)
                    socketListenerCallbacks[socket.id][m] = callback
                } else {
                    let { args } = objs[0]
                    if (args && !Array.isArray(args)) args = parseFunction().parse(client[m]).args.map(argName => args[argName]);
                    else if (!args) args = [];
                    try {
                        const data = await client[m](...args)
                        callbacks[0](data)
                    } catch (error) {
                        callbacks[0]({error: {
                            message: error.message,
                            stack: error.stack || ""
                        }})
                    }
                }
            }
            return;
        });
    });
}
