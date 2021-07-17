//@ts-ignore
import express from 'express';
import http from 'http';
import { collections } from './collections';
import robots from "express-robots-txt";
import swaggerUi from 'swagger-ui-express';
import { default as axios } from 'axios'
import parseFunction from 'parse-function';
import { Client, ev, SimpleListener } from '..';

export const app = express();
export const server = http.createServer(app);

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

export const setupAuthenticationLayer : (cliConfig : cliFlags) => void = (cliConfig : cliFlags) => {
    app.use((req, res, next) => {
        if (req.path === '/' && req.method === 'GET') return res.redirect('/api-docs/');
        if (req.path.startsWith('/api-docs') || req.path.startsWith('/swagger-stats')) {
            return next();
        }
        const apiKey = req.get('key') || req.get('api_key')
        if (!apiKey || apiKey !== cliConfig.key) {
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


export const setupMediaMiddleware : () => void = () => {
    app.use("/media", express.static('media'))
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
                return callbacks[0](Object.entries(collections['swagger'].paths).reduce((acc,[key,value])=>{acc[key.replace("/","")]=(value as any)?.post?.requestBody?.content["application/json"]?.example?.args || {};return acc},{}))
            }

            if(m==="node_red_init_listen"){
                return callbacks[0](Object.keys(SimpleListener).map(eventKey => SimpleListener[eventKey]))
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