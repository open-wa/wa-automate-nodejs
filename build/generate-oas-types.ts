import * as fs from 'fs'
import glob = require('tiny-glob');
import * as path from 'path';

import {
    getTypeScriptReader,
    getOpenApiWriter,
    makeConverter,
  } from 'typeconv'
import { writeJsonSync } from 'fs-extra';

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
    writeJsonSync('../bin/oas-type-schemas.json', res);
    return res;
  }

getTypeSchemas();