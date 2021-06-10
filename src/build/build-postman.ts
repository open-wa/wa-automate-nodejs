import * as fs from 'fs';
import * as path from 'path';
import parseUrl from 'parse-url';
let noCase;

const format = (s:string) => s?.replace(/[[/g,'').replace(/]]/g,'').replace(/@param/g,'Parameter:')

const ignoredMethods = [
    'pup',
    'loaded',
    'createMessageCollector',
    "logger"
]

const aliasExamples = {
    "ChatId": "00000000000@c.us or 00000000000-111111111@g.us",
    "GroupChatId": "00000000000-111111111@g.us",
    "Content": 'Hello World!',
    "DataURL": 'data:[<mediatype>][;base64],<data>',
    "Base64": "Learn more here: https://developer.mozilla.org/en-US/docs/Glossary/Base64",
    "MessageId": "false_447123456789@c.us_9C4D0965EA5C09D591334AB6BDB07FEB",
    "ContactId": "00000000000@c.us"
};

const paramNameExamples = {
    "ChatId": "00000000000@c.us  or 00000000000-111111111@g.us",
};

const primatives = [
    'number',
    'string',
    'boolean'
];

async function getMethodsWithDocs(){
    const {Project} = await import("ts-morph");
    const project = new Project({
        compilerOptions: {
            target: 99,
        },
    });
    const res = [];
    const fp = fs.existsSync(path.resolve(__dirname,'../api/Client.d.ts')) ? '../api/Client.d.ts' : '../api/Client.ts'
    const sourceFile = project.addSourceFileAtPath(path.resolve(__dirname,fp));
    for (const method of sourceFile.getClass('Client').getMethods()){
        if(!method.hasModifier(120)) {
        res.push({
            name: method.getName(),
            parameters: method.getParameters().map(param=> {
                return {
                    name: param.getName(),
                    type: param.getTypeNode()?.getText() || (param.getType()?.getAliasSymbol() || param.getType()?.getSymbol())?.getEscapedName(),
                    isOptional: param.isOptional(),
                }
            }),
            text: format(method.getJsDocs()[0]?.getInnerText())
        })
        }
    }
    return res;
}

export const generatePostmanJson = async (setup : any = {}) : Promise<any>  => {
    if(!noCase) noCase = (await import("change-case")).noCase;

    if(setup?.apiHost) {
        if(setup.apiHost.includes(setup.sessionId)){
        const parsed = parseUrl(setup.apiHost);
        setup.host = parsed.resource
        setup.port = parsed.port;
        }
    }
    const s = await getMethodsWithDocs();
    const x = s.filter(({visibility})=>visibility==2 || visibility==undefined).filter(({name})=>!name.startsWith('on')).filter(({name})=>!ignoredMethods.includes(name)).map(method=>({
        text: s[method.name] || '',
        ...method
    }));
    const postmanGen = postmanRequestGeneratorGenerator(setup);
    const pm = x.map(postmanGen);
    const postmanWrap = postmanWrapGen(setup);
    const res = postmanWrap(pm);
    if(!(setup?.skipSavePostmanCollection)) fs.writeFileSync(`./open-wa-${setup.sessionId}.postman_collection.json`, JSON.stringify(res));
    return res as any;
};

function escape(key, val) {
    if (typeof (val) != "string")
        return val;
    return val
        .replace(/["]/g, '\\"')
        .replace(/[\\]/g, '\\\\')
        .replace(/[/]/g, '\\/')
        .replace(/[\b]/g, '\\b')
        .replace(/[\f]/g, '\\f')
        .replace(/[\n]/g, '\\n')
        .replace(/[\r]/g, '\\r')
        .replace(/[\t]/g, '\\t');
}


const postmanRequestGeneratorGenerator = setup => method => {
    // if(!noCase) noCase = await import("change-case");
    const args = {};
    method.parameters.forEach(function (param) {
        args[param.name] = aliasExamples[param.type] ? aliasExamples[param.type] : paramNameExamples[param.name] ? paramNameExamples[param.name] : primatives.includes(param.type) ? param.type : 'Check documentation in description';
    });
    const hostpath = setup.apiHost ?  parseUrl(setup.apiHost).pathname.substring(1) : false;
    const url = {
        "raw": setup.apiHost ? `{{address}}:{{port}}${hostpath ? `/${hostpath}`: ''}/${method.name}` : (setup === null || setup === void 0 ? void 0 : setup.useSessionIdInPath) ? "{{address}}:{{port}}/{{sessionId}}/" + method.name : "{{address}}:{{port}}/" + method.name,
        "host": [
            "{{address}}"
        ],
        "port": "{{port}}",
        "path": setup?.apiHost ? [
            parseUrl(setup.apiHost).pathname.substring(1),
            "" + method.name
        ].filter(x=>x) : (setup === null || setup === void 0 ? void 0 : setup.useSessionIdInPath) ? [
            "{{sessionId}}",
            "" + method.name
        ] : ["" + method.name]
    };

    const name =  noCase(method.name).replace(/\b[a-z]|['_][a-z]|\B[A-Z]/g, function (x) { return x[0] === "'" || x[0] === "_" ? x : String.fromCharCode(x.charCodeAt(0) ^ 32); });
    const request = {
        "auth": {
            "type": "apikey",
            "apikey": [
                {
                    "key": "value",
                    "value": setup === null || setup === void 0 ? void 0 : setup.key,
                    "type": "string"
                },
                {
                    "key": "key",
                    "value": "key",
                    "type": "string"
                }
            ]
        },
        "method": "POST",
        "header": [
            {
                "key": "Content-Type",
                "name": "Content-Type",
                "type": "text",
                "value": "application/json"
            }
        ],
        "body": {
            "mode": "raw",
            "raw": JSON.stringify({ args: args }, escape, 4),
            "options": {
                "raw": {
                    "language": "json"
                }
            }
        },
        url,
        "documentationUrl": `https://docs.openwa.dev/classes/api_client.client.html#${method.name.toLocaleLowerCase()}`,
        "description": `${method.text}\n[External Documentation](https://docs.openwa.dev/classes/api_client.client.html#${method.name.toLocaleLowerCase()})`
    };
    if (!(setup === null || setup === void 0 ? void 0 : setup.key))
        delete request.auth;
    if (method.parameters.length === 0){
        request.body.raw="{}";
        // delete request.body;
    }
        const resp = {
            name,
            "originalRequest": request,
            "code": 200,
            "_postman_previewlanguage": "json",
            "header": request.header,
            "cookie": [],
            "body": "{\n    \"success\": true\n}"
        }
    return {
        name,
        request,
        "response": [resp]
    };
}

const postmanWrapGen = setup => item => (
    {
        "info": {
            "_postman_id": "0df31aa3-b3ce-4f20-b042-0882db0fd3a2",
            "name": `@open-wa - ${setup.sessionId}`,
            "description": "Requests for use with open-wa",
            "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
        },
        item,
        "event": [
            {
                "listen": "prerequest",
                "script": {
                    "id": "d1f29ae1-7df9-46d0-8f67-4f53f562ad7e",
                    "type": "text/javascript",
                    "exec": [
                        ""
                    ]
                }
            },
            {
                "listen": "test",
                "script": {
                    "id": "370a2b6c-41d3-418f-ad9b-0404865429ce",
                    "type": "text/javascript",
                    "exec": [
                        ""
                    ]
                }
            }
        ],
        "variable": [
            {
                "id": "43c133cc-7b9f-4dbe-a513-8832b664adb4",
                "key": "address",
                "value": (setup === null || setup === void 0 ? void 0 : setup.host) || "localhost"
            },
            {
                "id": "fda078e5-712a-41bf-9da0-468fe3586d18",
                "key": "port",
                "value": (setup === null || setup === void 0 ? void 0 : setup.port) || "8008"
            },
            {
                "id": "c1573a97-c016-4cf4-8b29-938c45146d04",
                "key": "sessionId",
                "value": (setup === null || setup === void 0 ? void 0 : setup.sessionId) || "session"
            }
        ],
        "protocolProfileBehavior": {}
    }
)