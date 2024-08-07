import { generatePostmanJson, Spin } from "..";
import p2s from 'postman-2-swagger';
import * as path from 'path';
import { writeJsonSync, readJsonSync } from 'fs-extra'

export const collections = {}

export const generateCollections: any = async (config: { [x: string]: any; sessionId?: any; key?: any; }, spinner: Spin) => {
    let swCol = null;
    let pmCol = null;
    //TODO GENERATE TYPE SCHEMAS ON BUILD. AXIOS GET FROM GITHUB!
    const _types = readJsonSync(path.resolve(__dirname, '../../bin/oas-type-schemas.json')) || {}
    spinner.info('Generating Swagger Spec');
    pmCol = await generatePostmanJson(config);
    spinner.succeed(`Postman collection generated: open-wa-${config.sessionId}.postman_collection.json`);
    swCol = p2s(pmCol);
    swCol.tags = [
        {
            "name": "default",
            "description": "All methods from the Client",
            "externalDocs": {
                "description": "Find out more",
                "url": "https://docs.openwa.dev/docs/reference/api/Client/classes/Client"
            }
        },
        {
            "name": "meta",
            "description": "Operations related to generating SDKs for this specific API"
        },
        {
            "name": "media",
            "description": "Access files in the /media folder when messagePreProcessor is set to AUTO_DECRYPT_SAVE"
        }
    ]
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
        swCol.paths[p].operationId = swCol.paths[p].nickname = p.replace("/", "")
        swCol.paths[p].post.externalDocs = {
            "description": "Documentation",
            "url": swCol.paths[p].post.documentationUrl
        }
        swCol.paths[p].post.responses['200'].schema = {
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
    const metaPaths = {
        "/media/{fileName}": {
            "get": {
                "summary": "Get a file from the /media folder",
                "description": "Make sure to set messagePreProcessor to AUTO_DECRYPT_SAVE in order to decrypt and save media within the /media folder",
                tags: ["media"],
                "produces": [
                    "application/pdf",
                    "image/jpeg",
                    "image/jpg",
                    "image/png",
                    "image/webp",
                    "audio/mpeg",
                    "audio/ogg",
                    "audio/vorbis",
                    "video/mp4",
                ],
                "parameters": [
                    {
                        "name": "fileName",
                        "in": "path",
                        "description": "The filename, e.g: 2B8A12C1DAF21D8CA34105560D5B1864.jpeg",
                        "required": true,
                        "type": "string",
                    }
                ],
                "responses": {
                    "200": {
                      "description": "Downloaded file"
                    },
                    "404": {
                      "description": "File not found"
                    },
                }
            }
        },
        "/meta/swagger.json": {
            "get": {
                "description": "Get a swagger/OAS collection json",
                tags: ["meta"],
                "produces": [
                    "application/json",
                ],
                "responses": {
                  "200": {
                    "description": "successful request"
                  },
                }
            }
        },
        "/meta/postman.json": {
            "get": {
                "description": "Get a postman collection json",
                tags: ["meta"],
                "produces": [
                    "application/json",
                ],
                "responses": {
                  "200": {
                    "description": "successful request"
                  },
                }
            }
        },
        "/meta/basic/commands": {
            get: {
                "description": "Get a list of possible client methods/commands",
                tags: ["meta"],
                "produces": [
                    "application/json",
                ],
                "responses": {
                  "200": {
                    "description": "successful request"
                  },
                }
            }
        },
        "/meta/basic/listeners": {
            get: {
                "description": "Get a list of possible listeners",
                tags: ["meta"],
                "produces": [
                    "application/json",
                ],
                "responses": {
                  "200": {
                    "description": "successful request"
                  },
                }
            }
        },
        "/meta/codegen/{language}": {
            post: {
                "summary": "Generate SDK",
                "description": "Generate a SDK for this specific API - see https://codegen.openwa.dev/api/gen/clients for list of possible languages",
                tags: ["meta"],
                "parameters": [
                    {
                        "name": "language",
                        "in": "path",
                        "description": "The language to generate the SDK for. ",
                        "required": true,
                        "type": "string",
                    }
                ],
                "responses": {
                  "200": {
                    "description": "successful request"
                  },
                }
            }
        }
    }
    swCol.paths = {
        ...swCol.paths,
        ...metaPaths
    }
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
    if (!(config?.skipSavePostmanCollection)) writeJsonSync("./open-wa-" + config.sessionId + ".sw_col.json", swCol);
    collections['postman'] = pmCol;
    collections['swagger'] = swCol;
    spinner.succeed('API collections (swagger + postman) generated successfully');
    return;
}