//@ts-ignore
import express from 'express';
import http from 'http';
import { collections } from './collections';
import robots from "express-robots-txt";
import swaggerUi from 'swagger-ui-express';
import { default as axios } from 'axios'
import parseFunction from 'parse-function';
import { Client, ev, SimpleListener, ChatId, Message, log } from '..';
import qs from 'qs';
import { convert } from 'xmlbuilder2';
import { chatwootMiddleware, setupChatwootOutgoingMessageHandler } from './integrations/chatwoot';

export const app = express();
export const server = http.createServer(app);

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

export const setUpExpressApp : () => void = () => {
    app.use(robots({ UserAgent: '*', Disallow: '/' }))
    //@ts-ignore
    app.use(express.json({ limit: '99mb' })) //add the limit option so we can send base64 data through the api
    setupMetaMiddleware();
}

export const enableCORSRequests : () => void = async () => {
    const {default : cors} = await import('cors');
    app.use(cors());
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

export const getCommands : () => any = () => Object.entries(collections['swagger'].paths).reduce((acc,[key,value])=>{acc[key.replace("/","")]=(value as any)?.post?.requestBody?.content["application/json"]?.example?.args || {};return acc},{})

export const listListeners : () => string[] = () => {
    return Object.keys(SimpleListener).map(eventKey => SimpleListener[eventKey])
}


export const setupMediaMiddleware : () => void = () => {
    app.use("/media", express.static('media'))
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
    await setupChatwootOutgoingMessageHandler(cliConfig, client);
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
    const io = new Server(server);
    if (cliConfig.key) {
        io.use((socket, next) => {
            if (socket.handshake.auth["apiKey"] == cliConfig.key) next()
            next(new Error("Authentication error"));
        });
    }
    io.on("connection", (socket) => {
        console.log("Connected to socket:", socket.id)
        socket.on('disconnect', (reason : string) => {
            console.log(`Socket ${socket.id} ~ reason: ${reason}`)
            socketListenerCallbacks[socket.id] = {}
        })
        socket.onAny(async (m, ...args) => {
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
                    const data = await client[m](...args)
                    callbacks[0](data)
                }
            }
            return;
        });
    });
}