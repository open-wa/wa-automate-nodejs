#! /usr/bin/env node
require("ts-node").register({
	"ignore": [/\.js/],
	//"typeRoots": ["./node_modules/@types"],
	...require("./tsconfig.json")	
});

require('./index.ts');