#! /usr/bin/env node

require('ts-node').register();
require('./index.ts');

// const meow = createRequire(import.meta.url)('meow');
// const open = createRequire(import.meta.url)('open');


// const cli = meow(`
// 	Usage
// 	  $ @open-wa/wa-automate <input>

// 	Options
//       --no-api, -n don't expose the api. This may be useful if you just want to set the webhooks
//       --webhook, -w webhook to use for the listeners
//       --key, k specify an api key
//       --config, -c the relative json file that contains the config. By default the system will look for config.json which will override any config variables set. Default: './config.json'
//       --session, -s the relative path of the session.data.json file Default: './session.data.json'

// 	Examples
// 	  $ @open-wa/wa-automate unicorns --rainbow
// 	  🌈 unicorns 🌈
// `, {
// 	flags: {
// 		rainbow: {
// 			type: 'boolean',
// 			alias: 'r'
// 		}
// 	}
// });


// console.log(cli.input[0], cli.flags);

// open('./test.html', {app: ['google chrome', '--incognito']});