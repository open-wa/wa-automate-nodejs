import { generatePostmanJson, Spin } from "..";
import p2s from 'postman-2-swagger';
import { writeJsonSync } from 'fs-extra'
import {
    getTypeScriptReader,
    getOpenApiWriter,
    makeConverter,
  } from 'typeconv'
import * as fs from 'fs'
import glob = require('tiny-glob');
import * as path from 'path';



export const collections = {}

export const generateCollections : any = async (config: { [x: string]: any; sessionId?: any; key?: any; },spinner: Spin) => {
    let swCol = null;
    let pmCol = null;
    const _types = await getTypeSchemas()
    spinner.info('Generating Swagger Spec');
    pmCol = await generatePostmanJson(config);
    spinner.succeed(`Postman collection generated: open-wa-${config.sessionId}.postman_collection.json`);
    swCol = p2s(pmCol);
    /**
     * Fix swagger docs by removing the content type as a required paramater
     */
    Object.keys(swCol.paths).forEach(p => {
        const path = swCol.paths[p].post;
        if (config.key) swCol.paths[p].post.security = [
            {
                "api_key": []
            }
        ]
        swCol.paths[p].nickname = p.replace("/", "")
        swCol.paths[p].post.externalDocs = {
            "description": "Documentation",
            "url": swCol.paths[p].post.documentationUrl
        }
        swCol.paths[p].post.responses['200'].schema =  {
            "$ref": "#/components/schemas/EasyApiResponse"
        }
        swCol.paths[p].post.requestBody = {
            "description": path.summary,
            "content": {
                "application/json": {
                    "schema": {
                        "type": "object"
                    },
                    example: path.parameters[1].example
                }
            }
        };
        delete path.parameters
    });
    delete swCol.swagger
    swCol.openapi = "3.0.3";
    swCol.components = {};
    swCol.components.schemas = _types
    swCol.externalDocs = {
        "description": "Find more info here",
        "url": "https://openwa.dev/"
    }
    if (config.key) {
        swCol.components = {
            ...swCol.components,
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
    const x = {};
    Object.keys(swCol.paths).sort().map(k => x[k] = swCol.paths[k]); swCol.paths = x;
    writeJsonSync("./open-wa-" + config.sessionId + ".sw_col.json", swCol);
    collections['postman'] = pmCol;
    collections['swagger'] = swCol;
    spinner.succeed('API collections (swagger + postman) generated successfully');
    return;
}

export const getTypeSchemas : any = async () => {
  const reader = getTypeScriptReader(  );
  const writer = getOpenApiWriter( { format: 'json', title: 'My API', version: 'v3.0.3' } );
  const { convert } = makeConverter( reader, writer, {
      simplify: true
  });
  const s = (await Promise.all([...(await glob(path.resolve(__dirname,'../**/*.d.ts'))),...(await glob(path.resolve(__dirname,'../**/message.js'))), ...(await glob(path.resolve(__dirname,'../**/chat.js')))])).filter(f=>!f.includes('node_modules'))
  const res = {};
  await Promise.all(s.map(async x=>{
      const {data} =  await convert({ data: fs.readFileSync(x, 'utf8') } );
      const schemas = JSON.parse(data)?.components?.schemas;
      Object.keys(schemas).forEach(k => {
          res[k] = schemas[k];
      })
  }))
  return res;
}