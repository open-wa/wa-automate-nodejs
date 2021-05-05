import { getConfigWithCase } from '../src/utils/configSchema'
import { writeFileSync } from 'fs';

const configWithCases = getConfigWithCase({
	path: "../src/api/model/config.ts",
	tsconfig: "../tsconfig.json",
	type: "ConfigObject",
});

writeFileSync('../bin/config-schema.json', JSON.stringify(configWithCases));