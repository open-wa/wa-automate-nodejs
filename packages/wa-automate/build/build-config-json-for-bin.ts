import { writeJsonSync } from 'fs-extra';
import { createGenerator } from "ts-json-schema-generator";
import {paramCase, constantCase} from "change-case";
 
const defaultConfig = {
	path: "../api/model/config.ts",
	tsconfig: "../../tsconfig.json",
	type: "ConfigObject", 
};

const getConfigWithCase = (config ?: {
    path: string,
    tsconfig: string,
    type: string,
}) : unknown => {
    if(!config) config = defaultConfig;
    const schema = createGenerator(config).createSchema(config.type);
    const ignoredConfigs = [
        'useStealth',
        'chromiumArgs',
        'executablePath',
        'skipBrokenMethodsCheck',
        'inDocker',
        'autoRefresh',
        'bypassCSP',
        'throwErrorOnTosBlock',
        'killProcessOnBrowserClose',
        'cloudUploadOptions',
        'qrRefreshS'
    ]
    //only convert simple types
    // const configs = Object.keys(schema.definitions.ConfigObject.properties).map(key=>({...schema.definitions.ConfigObject.properties[key],key})).filter(({type,key})=>type&&!ignoredConfigs.includes(key));
    const configs = Object.entries((schema.definitions.ConfigObject as any).properties).map(([key,entry] : any)=>{
        if(key==='sessionData') {
            entry.type = 'string';
            entry.description = 'The base64 encoded sessionData used to restore a session.'
            delete entry.anyOf;
        }
        if(key==='licenseKey') {
            entry.type = 'string';
            entry.description = 'The license key to use with the session.'
            delete entry.anyOf;
        }
        return {...entry,key}
    }).filter(({type,key})=>type&&!ignoredConfigs.includes(key));
    const configWithCases = configs.map(o=>({env:`WA_${constantCase(o.key)}`,p:paramCase(o.key),...o}))
    return configWithCases;
}

const configWithCases = getConfigWithCase({
	path: "../src/api/model/config.ts",
	tsconfig: "../tsconfig.json",
	type: "ConfigObject",
});

writeJsonSync('../bin/config-schema.json', configWithCases);