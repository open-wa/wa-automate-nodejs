
const tsj = require("ts-json-schema-generator");
import {paramCase, constantCase} from "change-case";
 
const defaultConfig = {
	path: "../api/model/config.ts",
	tsconfig: "../../tsconfig.json",
	type: "ConfigObject", 
};

export const getConfigWithCase = (config ?: {
    path: string,
    tsconfig: string,
    type: string,
}) => {
    if(!config) config = defaultConfig;
    const schema = tsj.createGenerator(config).createSchema(config.type);
    const ignoredConfigs = [
        'browserRevision',
        'useStealth',
        'chromiumArgs',
        'browserWSEndpoint',
        'executablePath',
        'skipBrokenMethodsCheck',
        'inDocker',
        'bypassCSP',
        'throwErrorOnTosBlock',
        'killProcessOnBrowserClose'
    ]
    //only convert simple types
    const configs = Object.keys(schema.definitions.ConfigObject.properties).map(key=>({...schema.definitions.ConfigObject.properties[key],key})).filter(({type,key})=>type&&!ignoredConfigs.includes(key));
    const configWithCases = configs.map(o=>({env:`WA_${constantCase(o.key)}`,p:paramCase(o.key),...o}))
    return configWithCases;
}

export const getConfigFromProcessEnv = (config ?: {
    path: string,
    tsconfig: string,
    type: string,
}) => {
    let output = {};
    Object.keys(getConfigWithCase(config)).forEach(_env=>{
        if(process.env[_env]) output[_env] = process.env[_env];
    });
    return output;
}