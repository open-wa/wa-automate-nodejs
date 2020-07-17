import { getConfigWithCase } from '../src'

const fs = require('fs');

const configWithCases = getConfigWithCase({
	path: "../src/api/model/config.ts",
	tsconfig: "../tsconfig.json",
	type: "ConfigObject",
});

fs.writeFileSync('../bin/config-schema.json', JSON.stringify(configWithCases));