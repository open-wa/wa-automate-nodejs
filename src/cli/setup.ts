import { camelize, isBase64 } from './../utils/tools';
import commandLineUsage from 'command-line-usage';
import meow, { AnyFlags } from 'meow';
import { Merge, JsonObject } from 'type-fest';
import { HELP_HEADER } from "./logo";
import { readJsonSync, writeFile } from 'fs-extra'
import * as changeCase from "change-case";
import { tryOpenFileAsObject } from './file-utils';
import { ConfigObject } from '../api/model/config';
import uuidAPIKey from 'uuid-apikey';
import { ev, Spin } from '../controllers/events';
import isUrl from 'is-url-superb';
import * as path from 'path';
import { setupLogging } from '../logging/logging';
import { optionList } from './cli-options';

let checkUrl = url => typeof url === 'string' ? isUrl(url) : false;

const configWithCases = readJsonSync(path.join(__dirname,'../../bin/config-schema.json'));

export const optionKeys = optionList.map(({ name }) => camelize(name));

export const optionKeysWithDefalts = [...optionList.filter(o=>o.hasOwnProperty('default')).map(({ name }) => camelize(name)), 'popup'];

export const PrimitiveConverter = {
    Number : 1,
    Boolean : true,
    String : "hello"
}

export const cliOptionNames = optionList.reduce((acc, c) => {
    if (!c.type) return acc
    acc[camelize(c.name)] = typeof PrimitiveConverter[c.type.name]
    return acc
}, {})

export const meowFlags: () => AnyFlags = () => {
    const extraFlags = {}
    configWithCases.map(({ type, key }) => {
        if (key === "popup") type = "number";
        if (key === "viewport") type = "string";
        if (key === "stickerServerEndpoint") type = "string";
        extraFlags[key] = {
            type
        }
    });

    const res = {};
    optionList.map(option => {
        res[camelize(option.name)] = {
            ...option,
            //@ts-ignore
            type: option.type?.name?.toLowerCase()
        }
    });
    return {
        ...res,
        ...extraFlags
    };
}

export const helptext = commandLineUsage([{
    content: HELP_HEADER,
    raw: true,
},
{
    header: '',
    optionList
},
{
    header: "Session config flags",
    optionList: [
        ...configWithCases.map(c => {
            let type;
            if (c.type === 'boolean') type = Boolean;
            if (c.type === 'string') type = String;
            if (c.type === '"number"' || c.type === 'number') type = Number;
            return {
                name: c.p,
                type,
                description: c.description
            }
        })
    ]
},
{
    content: `Please check here for more information on some of the above mentioned parameters: {underline https://docs.openwa.dev/interfaces/api_model_config.configobject}`
},
{
    content: 'Project home: {underline https://github.com/open-wa/wa-automate-nodejs}'
}
])

export const envArgs: () => JsonObject = () => {
    const env = {};
    Object.entries(process.env).filter(([k, ]) => k.includes('WA')).map(([k, v]) => env[changeCase.camelCase(k.replace('WA_', ''))] = (v == 'false' || v == 'FALSE') ? false : (v == 'true' || v == 'TRUE') ? true : Number(v) || v);
    return env
}

export const configFile: (config : string) => JsonObject = (config : string) => {
    let confFile = {};
    const conf = config || process.env.WA_CLI_CONFIG
    if (conf) {
        if (isBase64(conf as string)) {
            confFile = JSON.parse(Buffer.from(conf as string, 'base64').toString('ascii'))
        } else {
            confFile = tryOpenFileAsObject(conf as string || `cli.config.json`);
            if (!confFile) console.error(`Unable to read config file json: ${conf}`)
        }
    } else {
        confFile = tryOpenFileAsObject(`cli.config.json`);
    }
    return confFile;
}

export const cli: () => {
    createConfig: ConfigObject,
    cliConfig: Merge<ConfigObject, {
        [k: string]: any
    }>,
    PORT: number,
    spinner: Spin
} = () => {
    const _cli = meow(helptext, {
        flags: {
            ...meowFlags(),
            popup: {
                type: 'boolean',
                default: false
            }
        },
        booleanDefault: undefined
    });

    /**
     * Config order should follow airmanship rules. Least maneuverable to most maneuverable.
     * 
     * 1. ENV VARS
     * 2. Config file
     * 3. CLI flags
     */

    const nonCliConfigs = {
        /**
         * Environmental Variables
         */
         ...envArgs(),
         /**
          * The configuration file OR the --config base64 encoded config object
          */
         ...(configFile(_cli.flags.config as string) || {}),
    }

    optionList.filter(option=>option.default)

    const cliConfig: any = {
        sessionId: "session",
        /**
         * Prioirity goes from bottom up
         */
        ...nonCliConfigs,
        /**
         * CLI flags
         */
        ..._cli.flags,
        /**
         * Grab the configs for the cli defaults
         */
         ...optionKeysWithDefalts.reduce((p,c)=> nonCliConfigs.hasOwnProperty(c) ? {
            ...p,
            [c]:nonCliConfigs[c]
            } : p,{})
    };
    
    //firstly set up logger
    if(cliConfig?.logging || cliConfig?.verbose){
        if(!cliConfig?.logging && cliConfig?.verbose) cliConfig.logging = []
        if(cliConfig?.logging && !(cliConfig?.logging || []).find(transport => transport.type === "console")) cliConfig.logging.push({type: 'console'})
        if(Array.isArray(cliConfig?.logging))
        cliConfig.logging = setupLogging(cliConfig?.logging, `easy-api-${cliConfig?.sessionId || 'session'}`)
    }

    const PORT = Number(cliConfig.port || process.env.PORT || 8080);
    const spinner = new Spin(cliConfig.sessionId, 'STARTUP', cliConfig?.disableSpins);

    const createConfig: ConfigObject = {
        ...cliConfig
    };


    if (cliConfig?.session) {
        createConfig.sessionData = cliConfig.session;
    }

    if (cliConfig?.allowSessionDataWh) {
        cliConfig.allowSessionDataWebhook = cliConfig.allowSessionDataWh;
    }

    /**
     * Build create() specific conig
     */

    if ((cliConfig?.licenseKey || cliConfig?.l)) {
        createConfig.licenseKey = cliConfig.licenseKey || cliConfig.l
    }

    if (cliConfig?.popup) {
        createConfig.popup = PORT
    }

    if (!(cliConfig?.key == null) && cliConfig?.key == "") {
        cliConfig.key = uuidAPIKey.create().apiKey;
    }

    if (cliConfig.viewport && cliConfig.viewport.split && cliConfig.viewport.split('x').length && cliConfig.viewport.split('x').length == 2 && cliConfig.viewport.split('x').map(Number).map(n => !!n ? n : null).filter(n => n).length == 2) {
        const [width, height] = cliConfig.viewport.split('x').map(Number).map(n => !!n ? n : null).filter(n => n);
        createConfig.viewport = { width, height }
    }

    if (cliConfig.resizable) {
        createConfig.defaultViewport = null // <= set this to have viewport emulation off
    }

    if (cliConfig.sessionDataOnly) {
        ev.on(`sessionData.**`, async (sessionData, sessionId) => {
            writeFile(`${sessionId}.data.json`, JSON.stringify(sessionData), (err) => {
                if (err) { spinner.fail(err.message); return; }
                else
                    spinner.succeed(`Session data saved: ${sessionId}.data.json\nClosing.`);
                process.exit();
            });
        })
    }

    if(cliConfig.skipUrlCheck) checkUrl = () => true;

    if (cliConfig.webhook || cliConfig.webhook == '') {
        if (checkUrl(cliConfig.webhook) || Array.isArray(cliConfig.webhook)) {
            spinner.succeed('webhooks set already')
        } else {
            if (cliConfig.webhook == '') cliConfig.webhook = 'webhooks.json';
            cliConfig.webhook = tryOpenFileAsObject(cliConfig.webhook, true);
            if (!checkUrl(cliConfig.webhook)) {
                cliConfig.webhook = undefined
            }
        }
    }


    if (cliConfig.twilioWebhook || cliConfig.twilioWebhook == '') {
            if (cliConfig.twilioWebhook == '' && cliConfig.webhook) cliConfig.twilioWebhook = cliConfig.webhook;
            if (!checkUrl(cliConfig.twilioWebhook)) {
                cliConfig.twilioWebhook = undefined
        }
        if(cliConfig.twilioWebhook && (!createConfig.cloudUploadOptions || createConfig.messagePreprocessor!=='UPLOAD_CLOUD')) {
            spinner.info('twilioWebhook set but messagePreprocessor not set to UPLOAD_CLOUD or cloudUploadOptions is missing')
        }
    }

    if (cliConfig.apiHost) {
        cliConfig.apiHost = cliConfig.apiHost.replace(/\/$/, '')
    }

    if (cliConfig.debug) {
        spinner.succeed(`DEBUG - flags: ${JSON.stringify(cliConfig)}`)
        const WA_ENV = {};
        Object.keys(process.env).map(k => {
            if (k.startsWith('WA_')) WA_ENV[k] = process.env[k];
        })
        spinner.succeed(`DEBUG - env vars: ${JSON.stringify(WA_ENV)}`)
    }


    return {
        createConfig, cliConfig, PORT, spinner
    }
}