const meow = require('meow');
const wa = require('../dist');
const { create, generatePostmanJson, ev } = wa;
const path = require('path');
const express = require('express');
const app = express();
const fs = require('fs');
const uuidAPIKey = require('uuid-apikey');
const p2s = require('postman-2-swagger');
const swaggerUi = require('swagger-ui-express');
const terminalLink = require('terminal-link');
const isUrl = require('is-url');
const tcpPortUsed = require('tcp-port-used');
const changeCase = require("change-case");
const robots = require("express-robots-txt");
const extraFlags = {};
const configWithCases = require('./config-schema.json');
const commandLineUsage = require('command-line-usage');
const chalk = require('chalk');
const axios = require('axios').default;
const isBase64 = (str) => {
	const len = str.length;
	if (!len || len % 4 !== 0 || /[^A-Z0-9+\/=]/i.test(str)) {
      return false;
	}
	const firstPaddingChar = str.indexOf('=');
	return firstPaddingChar === -1 ||
       firstPaddingChar === len - 1 ||
       (firstPaddingChar === len - 2 && str[len - 1] === '=');
  }

const tryOpenFileAsObject = (filelocation, needArray = false) => {
	let res = undefined;
	let relativePath = path.join(path.resolve(process.cwd(),filelocation|| ''));
	if(fs.existsSync(filelocation) || fs.existsSync(relativePath)) {
		const fp = fs.existsSync(filelocation)  ? filelocation : relativePath;
		try {
			let data = JSON.parse(fs.readFileSync(fp, 'utf8'));
			if(data && (Array.isArray(data) == needArray)) res = data;
		} catch (error) {
			throw `Unable to parse config file as JSON. Please make sure ${fp} is a valid JSON config file`;
		}
	}
	return res;
}

configWithCases.map(({ type, key }) => {
	if (key === "popup") type = "number";
	if (key === "viewport") type= "string" ;
	if (key === "stickerServerEndpoint") type = "string";
	extraFlags[key] = {
		type
	}
});

const CLI_TITLE = chalk.bold.underline('@open-wa/wa-automate EASY API CLI');
const CLI_DESCRIPTION = 'The easiest way to get started with WA automation';
const CLI_USAGE = 'Usage: \`npx open-wa/wa-automate -p 8080 --disable-spins -a [options ...]\`';
const TWITTER = 'Follow for updates on twitter @openwadev'
const g = chalk.gray;
const m = chalk.magenta;
const o = chalk.yellow;
const d = chalk.hex('#302c3b');
const l = chalk.hex('#0092a5');
const sk = chalk.hex('#aababf');

const HELP_HEADER = 
`                                                                                
                                                                                
                                                                                
                                                                                
                                      ${o(`&&/&`)}                                      
        ${g(`%%%%%`)}                      ${o(`//////////%`)}                      ${g(`%%%%%`)}        
        ${g(`%%%%%`)}                   ${m(`&&(///////////%&`)}                    ${g(`%%%%`)}        
	   ${sk(`,,,,`)}                  ${m(`&&&&&&&&&&&&&&&&&&&`)}                  ${sk(`,,,`)}         
          ${sk(`,,,`)}  ${l(`#(((((((((((((((((((((((((((((((((((((((((((((((((`)}   ${sk(`,,,`)}         
          ${sk(`,,,`)} ${l(`(((`)},.............................................${l(`(((#`)}${sk(`,,,,`)}         
          ${sk(`,,,,`)}${l(`(((`)}..............................................,${l(`(((`)}${sk(`,,,&`)}         
          ${sk(`&,,,`)}${l(`(((`)}..............................................,${l(`(((`)}${sk(`,,,`)}          
           ${sk(`,,,`)}${l(`(((`)}.......           ...........           ......,${l(`(((`)}${sk(`,,,`)}          ${CLI_TITLE}
           ${sk(`,,,`)}${l(`(((`)}.....               .......               ....,${l(`(((`)}${sk(`,,%`)}          
	   ${d(`%%%%%`)}${l(`(((`)}...       ${d(`&&&&&(`)}     .....     ${d(`&&&&&&`)}      ...,${l(`((`)}${d(`#%%%%%`)}        
        ${d(`%%%%%%`)}${l(`(((`)}...      ${d(`&&&&&&&`)}     ....     ${d(`#&&&&&&*`)}      ..,${l(`((`)}${d(`#%%%%%`)}        ${CLI_DESCRIPTION}
        ${d(`%%%%%%`)}${l(`(((`)}...       ${d(`&&&&&.`)}     .....     ${d(`&&&&&%`)}      ...,${l(`((`)}${d(`#%%%%%%`)}       
        ${d(`%%%%%%`)}${l(`(((`)}.....               .......               ....,${l(`((`)}${d(`#%%%%%%`)}       
        ${d(`%%%%%%`)}${l(`(((`)}....             .....  .....          .......,${l(`((`)}${d(`#%%%%%%`)}       ${CLI_USAGE}
        ${d(`%%%%%%`)}${l(`(((`)}......................   .....................,${l(`((`)}${d(`#%%%%%`)}        
         ${d(`%%%%%`)}${l(`(((`)}..............................................,${l(`((`)}${d(`#%%%%&`)}        ${TWITTER}
              ${l(`(((`)}...........&&&&&&&&&&&&&&&&&&&&&&&&*..........,${l(`(((`)}             
              ${l(`(((`)}...........&&     %&      %&.    (&/..........,${l(`(((`)}             
              ${l(`(((`)}...........&&.....%&......%&,....(&/..........,${l(`(((`)}             
              ${l(`(((`)}..............................................,${l(`(((`)}             
              ${l(`(((`)}*.............................................${l(`(((#`)}             
               ${l(`#(((((((((((((((((((((((((((((((((((((((((((((((((`)}               
                                                                                
                                                                                
                                                                                
                                                                                
                                                                                 `

const helptext = commandLineUsage([{
	content: HELP_HEADER,
	raw: true,
},
{
	header: '',
	optionList: [{
			name: 'no-api',
			alias: 'n',
			type: Boolean,
			description: "Don't expose the api. This may be useful if you just want to set the webhooks."
		},
		{
			name: 'port',
			alias: 'p',
			type: Number,
			typeLabel: '{blue {underline 8080}}',
			description: "Set the port for the api. Default to 8002."
		},
		{
			name: 'api-host',
			type: String,
			typeLabel: '{yellow {underline localhost}}',
			description: "The easy API may be sitting behind a reverse proxy. In this case set --api-host in order to make sure the api docs and api explorer are working properly. You will need to include the protocol as well."
		},
		{
			name: 'host',
			alias: 'h',
			type: String,
			typeLabel: '{red {underline localhost}}',
			description: "Set the hostname for the api documantation and statistics. Overrides --api-host. Default: localhost."
		},
		{
			name: 'webhook',
			alias: 'w',
			type: String,
			typeLabel: '{yellow {underline https://webhook.site/....}}',
			description: "Webhook to use for the listeners."
		},
		{
			name: 'ev',
			alias: 'e',
			type: String,
			typeLabel: '{green {underline https://webhook.site/....}}',
			description: "Send launch events to this URL."
		},
		{
			name: 'ef',
			type: String,
			typeLabel: '{blueBright {underline qr,STARTUP}}',
			description: "Filters which namespaces trigger the webhook set in -e/--ev."
		},
		{
			name: 'allow-session-data-wh',
			alias: 'x',
			type: Boolean,
			description: "By default, if you set -e flag, the session data is not transferred to the webhook as it is extremely sensitive data. In order to bypass this security measure, use this flag."
		},
		{
			name: 'key',
			alias: 'k',
			type: String,
			typeLabel: '{redBright {underline apikey}}',
			description: "Specify an api key to use as a check for all requests. If you add -k by itself, a key will be autogenerated for you."
		},
		{
			name: 'config',
			alias: 'c',
			type: String,
			typeLabel: '{yellowBright {underline ./config.json}}',
			description: "The relative json file that contains the config. By default the system will look for config.json which will override any config variables set. Default: './config.json'."
		},
		{
			name: 'session',
			alias: 's',
			type: String,
			typeLabel: '{magentaBright {underline BASE64}}',
			description: "A base64 string representing the session data."
		},
		{
			name: 'keep-alive',
			alias: 'a',
			type: Boolean,
			description: "If true, the system will force the session to refocus in this process. This will prevent you from opening a session elsewhere."
		},
		{
			name: 'use-session-id-in-path',
			alias: 'i',
			type: Boolean,
			description: "If true, all API paths will include the session id. default to false and the default session Id is 'session'."
		},
		{
			name: 'generate-api-docs',
			alias: 'd',
			type: Boolean,
			description: "Generate postman collection and expose api docs to open in browser."
		},
		{
			name: 'session-data-only',
			alias: 'o',
			type: Boolean,
			description: "Kill the process when the session data is saved."
		},
		{
			name: 'skip-save-postman-collection',
			type: Boolean,
			description: "Don't save the postman collection."
		},
		{
			name: 'headful',
			type: Boolean,
			description: "Show the browser window on your machine."
		},
		{
			name: 'headful',
			type: Boolean,
			description: "Pre authenticate documentation site [High security risk]."
		},
		{
			name: 'stats',
			type: Boolean,
			description: "Exposes API swagger-statistics."
		},
		{
			name: 'pre-auth-docs',
			type: Boolean,
			description: "Grab config options from the environment variables."
		},
		{
			name: 'no-kill-on-logout',
			type: Boolean,
			description: "Keeps the process alive when host account logs out of session. default is false"
		},
		{
			name: 'license-key',
			alias: 'l',
			type: String,
			typeLabel: '{yellowBright {underline B2BJ4JFB-2UN2J3ND-2J5I.....}}',
			description: "The license key you want to use for this server. License keys are used to unlock features. Learn more here https://github.com/open-wa/wa-automate-nodejs#license-key"
		},
		{
			name: 'help',
			description: 'Print this usage guide.'
		}
	]
},
{
	header: "Session config flags",
	optionList: [
		...configWithCases.map(c=>{
			let type;
			if(c.type==='boolean') type = Boolean;
			if(c.type==='string') type = String;
			if(c.type==='number') type = Number;
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

const cli = meow(helptext, {
	flags: {
		port: {
			type: 'number',
			alias: 'p',
			default: 8002
		},
		ev: {
			type: 'string',
			alias: 'e'
		},
		ef: {
			type: 'string',
			default: ["qr","STARTUP"],
			isMultiple: true
		},
		allowSessionDataWh: {
			type: 'boolean',
			alias: 'x',
			default: false
		},
		host: {
			type: 'string',
			alias: 'h',
			default: 'localhost'
		},
		apiHost: {
			type: 'string',
		},
		webhook: {
			type: 'string',
			alias: 'w'
		},
		key: {
			type: 'string',
			alias: 'k'
		},
		config: {
			type: 'string',
			alias: 'c'
		},
		session: {
			type: 'string',
			alias: 's'
		},
		noApi: {
			type: 'boolean',
			alias: 'n',
			default: false
		},
		licenseKey: {
			type: 'string',
			alias: 'l'
		},
		keepAlive: {
			type: 'boolean',
			alias: 'a'
		},
		useSessionIdInPath: {
			type: 'boolean',
			alias: 'i'
		},
		generateApiDocs: {
			type: 'boolean',
			alias: 'd',
			default: true
		},
		sessionDataOnly: {
			type: 'boolean',
			alias: 'o',
			default: false
		},
		inDocker: {
			type: 'boolean',
			default: false
		},
		skipSavePostmanCollection: {
			type: 'boolean',
			default: false
		},
		...extraFlags,
		popup: { 
			type: 'boolean',
			default: false
		},
		headful: { 
			type: 'boolean',
			default: false
		},
		preAuthDocs: { 
			type: 'boolean',
			default: false
		},
		stats: { 
			type: 'boolean',
			default: false
		},
		noKillOnLogout: { 
			type: 'boolean',
			default: false
		},
		popupPort: {
		type: 'number',
		}
	},
	booleanDefault: undefined
});

app.use(express.json({ limit: '200mb' })) //add the limit option so we can send base64 data through the api
/**
 * Parse CLI flags from process.env
 */
const envArgs = {};
Object.entries(process.env).filter(([k,v])=>k.includes('WA')).map(([k,v])=>envArgs[changeCase.camelCase(k.replace('WA_',''))]=(v=='false' || v=='FALSE')?false:(v=='true' ||v=='TRUE')?true:Number(v)||v);

//open config file:
let configFile = {};
const conf = cli.flags.config || process.env.WA_CLI_CONFIG
if (conf) {
	if(isBase64(conf)) {
		configFile = JSON.parse(Buffer.from(conf, 'base64').toString('ascii'))
	} else {
		configFile = tryOpenFileAsObject(conf || `cli.config.json`);
		if(!configFile) console.error(`Unable to read config file json: ${conf}`)
	}
} else {
	configFile = tryOpenFileAsObject(`cli.config.json`);
}

const c = {
	autoRefresh: true,
	...cli.flags,
	...configFile || {},
	...envArgs
};
const PORT = c.port;
let config = {
	...c
};

if (c && c.session) {
	c.sessionData = c.session;
}

if (c && (c.licenseKey || c.l)) {
	config = {
		...config,
		licenseKey: c.licenseKey || c.l
	}
}

if(c && c.popup) {
	config = {
		...config,
		popup: PORT
	}
}

if (!(c.key == null) && c.key == "") {
	//generate the key
	c.key = uuidAPIKey.create().apiKey;
}

if(c.viewport && c.viewport.split && c.viewport.split('x').length && c.viewport.split('x').length==2 && c.viewport.split('x').map(Number).map(n=>!!n?n:null).filter(n=>n).length==2){
	const [width, height] = c.viewport.split('x').map(Number).map(n=>!!n?n:null).filter(n=>n);
	config.viewport = {width, height}
}

if(c.resizable){
	config.defaultViewport= null // <= set this to have viewport emulation off
}

if(c.sessionDataOnly){
	ev.on(`sessionData.**`, async (sessionData, sessionId) =>{
		fs.writeFile(`${sessionId}.data.json`, JSON.stringify(sessionData), (err) => {
			if (err) { console.error(err); return; }
			else 
			console.log(`Session data saved: ${sessionId}.data.json\nClosing.`);
			process.exit();
		  });
	  })
}

if(c.webhook || c.webhook == '') {
	if(isUrl(c.webhook) || Array.isArray(c.webhook)) {
		console.log('webhooks set already')
	} else {
		if(c.webhook == '') c.webhook = 'webhooks.json';
		c.webhook = tryOpenFileAsObject(c.webhook, true);
		if(!isUrl(c.webhook)) {
			c.webhook = undefined
		}
	}
}

if(c.apiHost) {
	c.apiHost = c.apiHost.replace(/\/$/, '')
}

async function start(){
    try {
        const {status, data} = await axios.post(`http://localhost:${PORT}/getConnectionState`);
        if(status===200 && data.response==="CONNECTED"){
            const {data: {response: {sessionId, port, webhook, apiHost}}} = await axios.post(`http://localhost:${PORT}/getConfig`);
            if(config && config.sessionId == sessionId && config.port === port && config.webhook===webhook && config.apiHost===apiHost){
				console.log('removing popup flag')
                if(config.popup) {
                    delete config.popup;
                }
            }
        }
    } catch (error) {
        if(error.code==="ECONNREFUSED") console.log('fresh run')
	}
	config.headless= c.headful != undefined ? !c.headful : c.headless
	if(c.ev || c.ev == "") {
		//prepare ef
		if(c && c.ef){
			if(!Array.isArray(c.ef)) c.ef = [c.ef] 
			c.ef = c.ef.flatMap(s=>s.split(','))
		}
		if(!isUrl(c.ev)) console.log("--ev/-e expecting URL - invalid URL.")
		else ev.on('**', async (data,sessionId,namespace) => {
			if(c && c.ef){
					if(!c.ef.includes(namespace)) return;
			}
			if(!c.allowSessionDataWebhook && (namespace=="sessionData" || namespace=="sessionDataBase64")) return;
			await axios({
				method: 'post',
				url: c.ev,
				data: {
				ts: Date.now(),
				data,
				sessionId,
				namespace
				}
			}).catch(err=>console.error(`WEBHOOK ERROR: `, c.ev ,err.message));
		})
	}
return await create({ ...config })
.then(async (client) => {
	let swCol = null;
	let pmCol = null;

	client.onLogout(async ()=>{
		console.error('!!!! CLIENT LOGGED OUT. Process closing !!!!')
		if(c && !c.noKillOnLogout) {
			console.error("Shutting down.")
			process.exit();
		}
	})

	app.use(robots({ UserAgent: '*', Disallow: '/' }))
	if (c && c.webhook) {
		if(Array.isArray(c.webhook)) {
			await Promise.all(c.webhook.map(webhook=>{
				if(webhook.url && webhook.events) return client.registerWebhook(webhook.url,webhook.events, webhook.requestConfig || {})
			}))
		} else await client.registerWebhook(c.webhook,"all")
	}

	if(c && c.keepAlive) client.onStateChanged(async state=>{
		if(state==="CONFLICT" || state==="UNLAUNCHED") await client.forceRefocus();
    });

	if (!(c && c.noApi)) {
		if(c && c.key) {
			console.log(`Please use the following api key for requests as a header:\napi_key: ${c.key}`)
			app.use((req, res, next) => {
				if(req.path==='/' && req.method==='GET') return res.redirect('/api-docs/');
				if(req.path.startsWith('/api-docs') || req.path.startsWith('/swagger-stats')) {
					return next();
				}
				const apiKey = req.get('key') || req.get('api_key')
				if (!apiKey || apiKey !== c.key) {
				  res.status(401).json({error: 'unauthorised'})
				} else {
				  next()
				}
			  })
		}

		if(!c.sessionId) c.sessionId = 'session';

		if(c && (c.generateApiDocs || c.stats)) {
			console.log('Generating Swagger Spec');
			pmCol = await generatePostmanJson({
				...c,
				...config
			});
			console.log(`Postman collection generated: open-wa-${c.sessionId}.postman_collection.json`);
			swCol = p2s.default(pmCol);
			/**
			 * Fix swagger docs by removing the content type as a required paramater
			 */
			Object.keys(swCol.paths).forEach(p => {
				let path = swCol.paths[p].post;
				if(c.key) swCol.paths[p].post.security = [
					{
						"api_key": []
					}
				]
				swCol.paths[p].post.externalDocs= {
					"description": "Documentation",
					"url": swCol.paths[p].post.documentationUrl
				  }
				  swCol.paths[p].post.requestBody = {
					  "description": path.summary,
					  "content": {
						"application/json": {
							"schema": {
								"type": "object"
							},
							example:  path.parameters[1].example
						}
					  }
				  };
				  delete path.parameters
			});
			delete swCol.swagger
			swCol.openapi="3.0.3"
			swCol.externalDocs = {
				"description": "Find more info here",
				"url": "https://http://openwa.dev/"
			  }
			  if(c.key) {
				swCol.components = {
				  "securitySchemes": {
					  "api_key": {
						"type": "apiKey",
						"name": "api_key",
						"in": "header"
					  }
				  }
				}
			  swCol.security = [
				  {
					  "api_key": []
				  }
			  ]
			  }
			  //Sort alphabetically
			var x = {}; Object.keys(swCol.paths).sort().map(k=>x[k]=swCol.paths[k]);swCol.paths=x;
			fs.writeFileSync("./open-wa-" + c.sessionId + ".sw_col.json", JSON.stringify(swCol));
			app.get('/postman.json', (req,res)=>res.send(pmCol))
			app.get('/swagger.json', (req,res)=>res.send(swCol))
		}

		if(c && c.generateApiDocs && swCol) {
			console.log('Setting Up API Explorer');
			const swOptions = {
				customCss: '.opblock-description { white-space: pre-line }'
			}
			if(c.key && c.preAuthDocs) {
				swOptions.swaggerOptions = {
					authAction: {
						api_key: {
							name: "api_key",
							schema: {type: "apiKey", in: "header", name: "Authorization", description: ""},
							value: c.key
						}
					}
				}
			}
			app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swCol, swOptions));
		}

		if(c && c.stats && swCol) {
			const swStats = require('swagger-stats'); 
			console.log('Setting Up API Stats');
			app.use(swStats.getMiddleware({
			  elasticsearch:process.env.elastic_url,
			  elasticsearchUsername:process.env.elastic_un,
			  elasticsearchPassword:process.env.elastic_pw,
			  swaggerSpec:swCol,
			  authentication: !!c.key,
			  swaggerOnly: true,
			  onResponseFinish: function(req,res,rrr){
				['file', 'base64', 'image', 'webpBase64', 'base64', 'durl', 'thumbnail'].forEach(key => {
					if(req.body.args[key])
					req.body.args[key] = rrr.http.request.body.args[key] = req.body.args[key].slice(0,25) || 'EMPTY'
				});
				if(rrr.http.response.code!==200 && rrr.http.response.code!==404) {
				  rrr.http.response.phrase = res.statusMessage
				}
			  },
			  onAuthenticate: function(req,username,password){
				return((username==="admin") && (password===c.key));
			  }
			}));
		}
		
		app.use(client.middleware((c && c.useSessionIdInPath)));
		if(process.send){
			process.send('ready');
			process.send('ready');
			process.send('ready');
		}
		console.log(`Checking if port ${PORT} is free`);
		await tcpPortUsed.waitUntilFree(PORT, 200, 20000)
		console.log(`Port ${PORT} is now free.`);
		app.listen(PORT, () => {
			console.log(`\n• Listening on port ${PORT}!`);
			if(process.send){
				process.send('ready');
				process.send('ready');
				process.send('ready');
			}
		});
		const apiDocsUrl = c.apiHost ? `${c.apiHost}/api-docs/ `: `${c.host.includes('http') ? '' : 'http://'}${c.host}:${PORT}/api-docs/ `;
		const link = terminalLink('API Explorer', apiDocsUrl);
		if(c && c.generateApiDocs)  console.log(`\n\t${link}`)

		if(c && c.generateApiDocs && c.stats) {
			const swaggerStatsUrl = c.apiHost ? `${c.apiHost}/swagger-stats/ui `: `${c.host.includes('http') ? '' : 'http://'}${c.host}:${PORT}/swagger-stats/ui `;
			const statsLink = terminalLink('API Stats', swaggerStatsUrl);
			console.log(`\n\t${statsLink}`)
		}

	}
})
.catch(e => console.log('Error', e.message, e));
}

start();