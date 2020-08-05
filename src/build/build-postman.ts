var fs = require('fs');
import {TypescriptParser} from "typescript-parser"
var parser = new TypescriptParser();
import {noCase} from "change-case";
const path = require("path");

var aliasExamples = {
    "ChatId": "00000000000@c.us or 00000000000-111111111@g.us",
    "GroupChatId": "00000000000-111111111@g.us",
    "Content": 'Hello World!',
    "DataURL": 'data:[<mediatype>][;base64],<data>',
    "Base64": "Learn more here: https://developer.mozilla.org/en-US/docs/Glossary/Base64",
    "MessageId": "false_447123456789@c.us_9C4D0965EA5C09D591334AB6BDB07FEB",
    "ContactId": "00000000000@c.us"
};

var paramNameExamples = {
    "ChatId": "00000000000@c.us  or 00000000000-111111111@g.us",
};
var primatives = [
    'number',
    'string',
    'boolean'
];
export const generatePostmanJson = async function (setup : any = {}) {
    const data = fs.readFileSync(path.resolve(__dirname,'../api/_client_ts'), 'utf8');
    const parsed = await parser.parseSource(data);
    //@ts-ignore
    let x = parsed.declarations.find(({name})=>name==='Client').methods.filter(({visibility})=>visibility==2).filter(({name})=>!name.startsWith('on'));
    let postmanGen = postmanRequestGeneratorGenerator(setup);
    let pm = x.map(postmanGen);
    let d = JSON.stringify(x);
    let postmanWrap = postmanWrapGen(setup);
    let res = postmanWrap(pm);
    fs.writeFileSync('./open-wa.postman_collection.json', JSON.stringify(res));
    return res;
};

function escape(key, val) {
    if (typeof (val) != "string")
        return val;
    return val
        .replace(/[\"]/g, '\\"')
        .replace(/[\\]/g, '\\\\')
        .replace(/[\/]/g, '\\/')
        .replace(/[\b]/g, '\\b')
        .replace(/[\f]/g, '\\f')
        .replace(/[\n]/g, '\\n')
        .replace(/[\r]/g, '\\r')
        .replace(/[\t]/g, '\\t');
}


const postmanRequestGeneratorGenerator = function (setup) { return function (method) {
    var args = {};
    method.parameters.forEach(function (param) {
        args[param.name] = aliasExamples[param.type] ? aliasExamples[param.type] : paramNameExamples[param.name] ? paramNameExamples[param.name] : primatives.includes(param.type) ? param.type : 'Check documentation in description';
    });
    const url = {
        "raw": (setup === null || setup === void 0 ? void 0 : setup.useSessionIdInPath) ? "{{address}}:{{port}}/{{sessionId}}/" + method.name : "{{address}}:{{port}}/" + method.name,
        "host": [
            "{{address}}"
        ],
        "port": "{{port}}",
        "path": (setup === null || setup === void 0 ? void 0 : setup.useSessionIdInPath) ? [
            "{{sessionId}}",
            "" + method.name
        ] : ["" + method.name]
    };
    const name =  noCase(method.name).replace(/\b[a-z]|['_][a-z]|\B[A-Z]/g, function (x) { return x[0] === "'" || x[0] === "_" ? x : String.fromCharCode(x.charCodeAt(0) ^ 32); });
    var request = {
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
        "description": "https://open-wa.github.io/wa-automate-nodejs/classes/client.html#" + method.name.toLocaleLowerCase()
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
};
};


var postmanWrapGen = function (setup) { return function (item) {
    return {
        "info": {
            "_postman_id": "0df31aa3-b3ce-4f20-b042-0882db0fd3a2",
            "name": "open-wa",
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
    };
}; };