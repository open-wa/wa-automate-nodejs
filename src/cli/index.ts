import { create, ev } from '../index'
import terminalLink from 'terminal-link';
import isUrl from 'is-url-superb';
import tcpPortUsed from 'tcp-port-used';
import { default as axios } from 'axios'
import { cli } from './setup';
import { collections, generateCollections } from './collections';
import { setUpExpressApp, setupAuthenticationLayer, setupRefocusDisengageMiddleware, setupApiDocs, setupSwaggerStatsMiddleware, setupMediaMiddleware, app, setupSocketServer, server, setupBotPressHandler, setupTwilioCompatibleWebhook, enableCORSRequests } from './server';

let checkUrl = (s : any) => (typeof s === "string") && isUrl(s);

const ready: (config : any) => Promise<void> = async (config : any) => {
    if (process.send) {
        process.send('ready');
        process.send('ready');
        process.send('ready');
    }
    if(config.readyWebhook)
    await axios({
        method: 'post',
        url: config.readyWebhook,
        data: {
            ts: Date.now(),
            data: {
                ...config
            },
            sessionId: config.sessionId,
            namespace: "READY"
        }
    }).catch(err => console.error(`WEBHOOK ERROR: ${config.readyWebhook} ${err.message}`));
}

async function start() {

    const { cliConfig, createConfig, PORT, spinner } = cli()

    spinner.start("Launching EASY API")
    setUpExpressApp();
    if(cliConfig.cors) await enableCORSRequests();
    try {
        const { status, data } = await axios.post(`http://localhost:${PORT}/getConnectionState`);
        if (status === 200 && data.response === "CONNECTED") {
            const { data: { response: { sessionId, port, webhook, apiHost } } } = await axios.post(`http://localhost:${PORT}/getConfig`);
            if (createConfig?.sessionId == sessionId && createConfig.port === port && createConfig.webhook === webhook && createConfig.apiHost === apiHost) {
                spinner.info('removing popup flag')
                if (createConfig.popup) {
                    delete createConfig.popup;
                }
            }
        }
    } catch (error) {
        if (error.code === "ECONNREFUSED") spinner.info('Selected port is free')
    }
    createConfig.headless = cliConfig.headful != undefined ? !cliConfig.headful : cliConfig.headless
    if (cliConfig.ev || cliConfig.ev == "") {
        //prepare ef
        if (cliConfig?.ef) {
            if (!Array.isArray(cliConfig.ef)) cliConfig.ef = [cliConfig.ef]
            cliConfig.ef = cliConfig.ef.flatMap(s => s.split(','))
        }
        if(cliConfig.skipUrlCheck) checkUrl = () => true
        if (!checkUrl(cliConfig.ev)) spinner.fail("--ev/-e expecting URL - invalid URL.")
        else ev.on('**', async (data, sessionId, namespace) => {
            if (cliConfig?.ef) {
                if (!cliConfig.ef.includes(namespace)) return;
            }
            if (!cliConfig.allowSessionDataWebhook && (namespace == "sessionData" || namespace == "sessionDataBase64")) return;
            await axios({
                method: 'post',
                url: cliConfig.ev,
                data: {
                    ts: Date.now(),
                    data,
                    sessionId,
                    namespace
                }
            }).catch(err => console.error(`WEBHOOK ERROR: ${cliConfig.ev} ${err.message}`));
        })
    }
    //These things can be done before the client is created
    if (cliConfig?.generateApiDocs || cliConfig?.stats) {
        await generateCollections({
            ...createConfig,
            ...cliConfig
        }, spinner)
    }

    try {
        const client = await create({ ...createConfig });
        if(cliConfig.autoReject){
            await client.autoReject(cliConfig.onCall)
        } else if(cliConfig.onCall) {
            await client.onIncomingCall(async call => {
                await client.sendText(call.peerJid, cliConfig.onCall)
            })
        }
        client.onLogout(async () => {
            console.error('!!!! CLIENT LOGGED OUT !!!!')
            if (cliConfig && !cliConfig.noKillOnLogout) {
                console.error("Shutting down.")
                process.exit();
            }
        })
        if(cliConfig?.botPressUrl){
            spinner.info('Setting Up Botpress handler');
            setupBotPressHandler(cliConfig, client)
            spinner.succeed('Botpress handler set up successfully');
        }

        if(cliConfig?.twilioWebhook){
            spinner.info('Setting Up Twilio Compaitible Webhook');
            setupTwilioCompatibleWebhook(cliConfig, client)
            spinner.succeed('Twilio Compaitible Webhook set up successfully');
        }

        
        if (cliConfig?.webhook) {
            if (Array.isArray(cliConfig.webhook)) {
                await Promise.all(cliConfig.webhook.map(webhook => {
                    if (webhook.url && webhook.events) return client.registerWebhook(webhook.url, webhook.events, webhook.requestConfig || {})
                }))
            } else await client.registerWebhook(cliConfig.webhook, "all")
        }
        if (cliConfig?.keepAlive) client.onStateChanged(async state => {
            if ((state === "CONFLICT" || state === "UNLAUNCHED") && cliConfig?.keepAlive) await client.forceRefocus();
        });

        if (!cliConfig?.noApi) {
            if (cliConfig?.key) {
                spinner.info(`Please see machine logs to see the API key`)
                console.log(`Please use the following api key for requests as a header:\napi_key: ${cliConfig.key}`)
                setupAuthenticationLayer(cliConfig)
            }

            setupRefocusDisengageMiddleware(cliConfig)

            if (cliConfig && cliConfig.generateApiDocs && collections["swagger"]) {
                spinner.info('Setting Up API Explorer');
                setupApiDocs(cliConfig)
                spinner.succeed('API Explorer set up successfully');
            }

            if (cliConfig?.stats && collections["swagger"]) {
                spinner.info('Setting Up API Stats');
                setupSwaggerStatsMiddleware(cliConfig)
                spinner.info('API Stats set up successfully');
            }
            if (createConfig.messagePreprocessor === "AUTO_DECRYPT_SAVE") {
                setupMediaMiddleware();
            }

            app.use(client.middleware((cliConfig && cliConfig.useSessionIdInPath)));

            if (cliConfig.socket) {
                spinner.info("Setting up socket")
                await setupSocketServer(cliConfig, client)
                spinner.succeed("Socket ready for connection")
            }
            spinner.info(`...waiting for port ${PORT} to be free`);
            await tcpPortUsed.waitUntilFree(PORT, 200, 20000).catch(()=>{
                spinner.fail(`Port ${PORT} is not available. Closing`);
                process.exit();
            })
            spinner.succeed(`Port ${PORT} is now free.`);
            server.listen(PORT, async () => {
                spinner.succeed(`\n• Listening on port ${PORT}!`);
                await ready({...cliConfig, ...createConfig, ...client.getSessionInfo(), hostAccountNumber: await client.getHostNumber()});
            });
            const apiDocsUrl = cliConfig.apiHost ? `${cliConfig.apiHost}/api-docs/ ` : `${cliConfig.host.includes('http') ? '' : 'http://'}${cliConfig.host}:${PORT}/api-docs/ `;
            const link = terminalLink('API Explorer', apiDocsUrl);
            if (cliConfig && cliConfig.generateApiDocs) spinner.succeed(`\n\t${link}`)

            if (cliConfig && cliConfig.generateApiDocs && cliConfig.stats) {
                const swaggerStatsUrl = cliConfig.apiHost ? `${cliConfig.apiHost}/swagger-stats/ ` : `${cliConfig.host.includes('http') ? '' : 'http://'}${cliConfig.host}:${PORT}/swagger-stats/ `;
                const statsLink = terminalLink('API Stats', swaggerStatsUrl);
                spinner.succeed(`\n\t${statsLink}`)
            }
        } else ready({...cliConfig, ...createConfig, ...client.getSessionInfo(), hostAccountNumber: await client.getHostNumber()});
    } catch (e) {
        spinner.fail(`Error ${e.message} ${e}`)
    }
}

start();