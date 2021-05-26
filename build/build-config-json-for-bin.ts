import { getConfigWithCase } from '../src/utils/configSchema'
import { writeJsonSync } from 'fs-extra';

const configWithCases = getConfigWithCase({
	path: "../src/api/model/config.ts",
	tsconfig: "../tsconfig.json",
	type: "ConfigObject",
});

writeJsonSync('../bin/config-schema.json', configWithCases);