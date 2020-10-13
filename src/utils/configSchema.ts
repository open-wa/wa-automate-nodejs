
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
        'executablePath',
        'skipBrokenMethodsCheck',
        'inDocker',
        'bypassCSP',
        'throwErrorOnTosBlock',
        'killProcessOnBrowserClose'
    ]
    //only convert simple types
    // const configs = Object.keys(schema.definitions.ConfigObject.properties).map(key=>({...schema.definitions.ConfigObject.properties[key],key})).filter(({type,key})=>type&&!ignoredConfigs.includes(key));
    const configs = Object.entries(schema.definitions.ConfigObject.properties).map(([key,entry] : any)=>{
        if(key==='sessionData') {
            entry.type = 'string';
            entry.description = 'The base64 encoded sessionData used to restore a session.'
            delete entry.anyOf;
        }
        return {...entry,key}
    }).filter(({type,key})=>type&&!ignoredConfigs.includes(key));
    const configWithCases = configs.map(o=>({env:`WA_${constantCase(o.key)}`,p:paramCase(o.key),...o}))
    return configWithCases;
}