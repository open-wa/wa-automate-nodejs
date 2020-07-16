const tsj = require("ts-json-schema-generator");
import {paramCase} from "change-case";
// const config = {
//     path: "./src/api/model/index.ts",
//     tsconfig: "./tsconfig.json",
//     type: "ConfigObject", // Or <type-name> if you want to generate schema for that one type only
// };
 
const config = {
    path: "./src/api/model/config.ts",
    tsconfig: "./tsconfig.json",
    type: "ConfigObject", // Or <type-name> if you want to generate schema for that one type only
};

const schema = tsj.createGenerator(config).createSchema(config.type);
const schemaString  = JSON.stringify(schema, null, 2);
// console.log("schemaString", schema.definitions.ConfigObject.properties)

//only convert simple types
const arr = Object.keys(schema.definitions.ConfigObject.properties).map(key=>({...schema.definitions.ConfigObject.properties[key],key})).filter(({type})=>type).map(o=>({p:paramCase(o.key),...o}))
console.log("arr", arr)