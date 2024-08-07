import uuidAPIKey from 'uuid-apikey';
import { Client, ev, ChatId, Message, Contact, log } from '../..';
import { cliFlags } from '../server';
import { Request, Response } from "express";
import { default as axios } from 'axios'
import { default as FormData } from 'form-data'
import mime from 'mime-types';
import { timeout } from '../../utils/tools'

const contactReg = {
    //WID : chatwoot contact ID
    "example@c.us": "1"
};
const convoReg = {
    //WID : chatwoot conversation ID
    "example@c.us": "1"
}
const ignoreMap = {
    "example_message_id": true
}

let chatwootClient: ChatwootClient;

export const chatwoot_webhook_check_event_name = "cli.integrations.chatwoot.check"

export type expressMiddleware = (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>

function parseIdAndScore(input) {
    const regex = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}):([1-5])$/;
    const match = regex.exec(input);
    if (match) {
      return {
        id: match[1],
        score: parseInt(match[2], 10)
      };
    } else {
      return null;
    }
  }

export const chatwootMiddleware: (cliConfig: cliFlags, client: Client) => expressMiddleware = (cliConfig: cliFlags, client: Client) => {
    return async (req: Request, res: Response): Promise<Response<any, Record<string, any>>> => {
        const processMesssage = async () => {
            const promises = [];
            const { body } = req
            if(body.source_id) return;
            if (!body) return;
            if (body.event == "conversation_status_changed" && body.status == "resolved") {
                log.info("Trying to send CSAT")
                /**
                 * CSAT requested
                 */
                let basicCsatMsgData = body.messages?.find(m => m?.content_type === "input_csat");
                if(!basicCsatMsgData) {
                    /**
                     * CSAT Missing from this webhook. Try to find it by getting all messages and filtering by csat and with a ts of more than the webhook event - 5s (just in case the csat was somehow sent before the convo was "resolved")
                     */
                    const msgs : any[] = await chatwootClient.getAllInboxMessages(body.id)
                    basicCsatMsgData = msgs.find(m=>m.content_type==='input_csat' && m.created_at > (body.timestamp-5))
                }
                if(!basicCsatMsgData) return;
                const _to : ChatId = `${(body?.custom_attributes?.wanumber || (body.meta?.sender?.phone_number || "").replace('+','')).replace('@c.us','')}@c.us`
                if(_to) promises.push(chatwootClient.sendCSAT(basicCsatMsgData, _to))
            }
            if (!body.conversation) return;
            const contact = (body.conversation.meta.sender.phone_number || "").replace('+', '')
            const to = `${contact}@c.us` as ChatId;
            const m = body.conversation.messages[0];
            if (
                body.message_type === "incoming" ||
                body.private ||
                body.event !== "message_created" ||
                !m ||
                !contact
            ) return;
            const { attachments, content } = m
            if (!convoReg[to]) convoReg[to] = body.conversation.id;
            if (attachments?.length > 0) {
                //has attachments
                const [firstAttachment, ...restAttachments] = attachments;
                const sendAttachment = async (attachment: any, c?: string) => attachment && client.sendImage(to, attachment.data_url, attachment.data_url.substring(attachment.data_url.lastIndexOf('/') + 1), c || '', null, true)
                //send the text as the caption with the first message only
                promises.push(sendAttachment(firstAttachment, content));
                ((restAttachments || []).map(attachment => sendAttachment(attachment)) || []).map(p => promises.push(p))
            } else {
                //no attachments
                if (!content) return;
                /**
                 * Check if this is a location message
                 */
                const locationMatcher = /@(\-*\d*\.*\d*\,\-*\d*\.*\d*)/g
                const [possLoc, ...restMessage] = content.split(' ')
                const locArr = possLoc.match(locationMatcher)
                if (locArr) {
                    const [lat, lng] = locArr[0].split(',')
                    //grab the location message
                    const loc = restMessage.join(' ') || '';
                    promises.push(client.sendLocation(to, lat, lng, loc))
                } else {
                    //not a location message
                    /**
                     * Check for url
                     */
                    const urlregex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g
                    if (content.match(urlregex) && content.match(urlregex)[0]) {
                        promises.push(client.sendLinkWithAutoPreview(to, content.match(urlregex)[0], content))
                    } else
                        promises.push(client.sendText(to, content));
                }
            }
            const outgoingMessageIds = await Promise.all(promises)
            log.info(`Outgoing message IDs: ${JSON.stringify(outgoingMessageIds)}`)
            /**
             * Add these message IDs to the ignore map
             */
            outgoingMessageIds.map(id => ignoreMap[`${id}`] = true)
            return outgoingMessageIds
        }
        try {
            const processAndSendResult = await processMesssage();
            res.status(200).send(processAndSendResult);
        } catch (error) {
            res.status(400).send(error);
        }
        return;
    }
}

export const setupChatwootOutgoingMessageHandler: (cliConfig: cliFlags, client: Client) => Promise<void> = async (cliConfig: cliFlags, client: Client) => {
    chatwootClient = new ChatwootClient(cliConfig as ChatwootConfig,client);
    await chatwootClient.init()
    return;
}

export type ChatwootConfig = {
    /**
     * The URL of the chatwoot inbox. If you want this integration to create & manage the inbox for you, you can omit the inbox part.
     */
    chatwootUrl: string,
    /**
     * The API access token which you can get from your account menu.
     */
    chatwootApiAccessToken: string,
    /**
     * The API host which will be used as the webhook address in the Chatwoot inbox.
     */
    apiHost: string,
    /**
     * Similar to apiHost
     */
    host: string,
    /**
     * Whether or not to use https for the webhook address
     */
    https?: boolean,
    /**
     * The certificate for https
     */
    cert: string,
    /**
     * The private key for https
     */
    privkey: string,
    /**
     * The API key used to secure the instance webhook address
     */
    key?: string,
    /**
     * Whether or not to update the webhook address in the Chatwoot inbox on launch
     */
    forceUpdateCwWebhook?: boolean,
    /**
     * port
     */
    port: number
}

class ChatwootClient {
    api_access_token: string;
    u: string;
    accountId: string;
    inboxId: string;
    expectedSelfWebhookUrl: string;
    origin: string;
    accountNumber: string;
    port: number;
    forceUpdateCwWebhook?: boolean;
    key: string;
    client: Client

    constructor(cliConfig: ChatwootConfig, client: Client) {
        const u = cliConfig.chatwootUrl as string //e.g `"localhost:3000/api/v1/accounts/3"
        this.api_access_token = cliConfig.chatwootApiAccessToken as string
        const _u = new URL(u)
        this.origin = _u.origin;
        this.port = Number(_u.port || 80);
        this.client = client;
        this.expectedSelfWebhookUrl = cliConfig.apiHost ? `${cliConfig.apiHost}/chatwoot ` : `${(cliConfig.host as string).includes('http') ? '' : `http${cliConfig.https || (cliConfig.cert && cliConfig.privkey) ? 's' : ''}://`}${cliConfig.host}:${cliConfig.port}/chatwoot `;
        this.expectedSelfWebhookUrl = this.expectedSelfWebhookUrl.trim()
        this.key = cliConfig.key
        if (cliConfig.key) this.expectedSelfWebhookUrl = `${this.expectedSelfWebhookUrl}?api_key=${cliConfig.key}`
        const [accountId, inboxId] = (u.match(/\/(app|(api\/v1))\/accounts\/\d*(\/(inbox|inboxes)\/\d*)?/g) || [''])[0].split('/').filter(Number)
        this.inboxId = inboxId || u.match(/inboxes\/\d*/g) && u.match(/inboxes\/\d*/g)[0].replace('inboxes/', '')
        this.accountId = accountId;
        this.forceUpdateCwWebhook = cliConfig.forceUpdateCwWebhook
    }

    public async cwReq(method, path, data?: any, _headers?: any) {
        const { origin, accountId, api_access_token } = this;
        const url = `${origin}/api/v1/accounts/${accountId}/${path}`.replace('app.bentonow.com', 'chat.bentonow.com')
        const response = await axios({
            method,
            data,
            url,
            headers: {
                api_access_token,
                ..._headers
            }
        }).catch(error => {
            log.error(`CW REQ ERROR: ${error?.response?.status} ${error?.response?.message}`, error?.toJSON())
            throw error
        })
        log.info(`CW REQUEST: ${response.status} ${method} ${url} ${JSON.stringify(data)}`)
        return response
    }

    /**
     * Ensures the chatwoot integration is setup properly.
     */
    public async init() {
        log.info(`Setting up chatwoot integration: ${this.u}`)
        const accountNumber = this.accountNumber =  await this.client.getHostNumber();
        const { api_access_token, origin } = this;
        let { inboxId, accountId } = this;
        const proms = [];
        // const accountId = u.match(/accounts\/\d*/g) && u.match(/accounts\/\d*/g)[0].replace('accounts/', '')
        /**
         * Is the inbox and or account id undefined??
         */
        if (!accountId) {
            log.info(`CHATWOOT INTEGRATION: account ID missing. Attempting to infer from access token....`)
            /**
             * If the account ID is undefined then get the account ID from the access_token
             */
            accountId = (await axios.get(`${origin}/api/v1/profile`, { headers: { api_access_token } })).data.account_id
            log.info(`CHATWOOT INTEGRATION: Got account ID: ${accountId}`)
            this.accountId = accountId;
        }
        if (!inboxId) {
            log.info(`CHATWOOT INTEGRATION: inbox ID missing. Attempting to find correct inbox....`)
            /**
             * Find the inbox with the correct setup.
             */
            const inboxArray = (await axios.get(`${origin}/api/v1/accounts/${accountId}/inboxes`, { headers: { api_access_token } })).data.payload
            const possibleInbox = inboxArray.find(inbox => inbox?.additional_attributes?.hostAccountNumber === accountNumber)
            if (possibleInbox) {
                log.info(`CHATWOOT INTEGRATION: found inbox: ${JSON.stringify(possibleInbox)}`)
                log.info(`CHATWOOT INTEGRATION: found inbox id: ${possibleInbox.id}`)
                inboxId = possibleInbox.id
                this.inboxId = inboxId;
            } else {
                log.info(`CHATWOOT INTEGRATION: inbox not found. Attempting to create inbox....`)
                /**
                 * Create inbox
                 */
                const { data: new_inbox } = (await axios.post(`${origin}/api/v1/accounts/${accountId}/inboxes`, {
                    "name": `open-wa-${accountNumber}`,
                    "channel": {
                        "phone_number": `${accountNumber}`,
                        "type": "api",
                        "webhook_url": this.expectedSelfWebhookUrl,
                        "additional_attributes": {
                            "sessionId": this.client.getSessionId(),
                            "hostAccountNumber": `${accountNumber}`
                        }
                    }
                }, { headers: { api_access_token } }))
                inboxId = new_inbox.id;
                log.info(`CHATWOOT INTEGRATION: inbox created. id: ${inboxId}`)
                this.inboxId = inboxId;
            }
        }


        let { data: get_inbox } = await this.cwReq('get', `inboxes/${inboxId}`)

        /**
         * Update the webhook
         */
        const updatePayload = {
            "channel": {
                "additional_attributes": {
                    "sessionId": this.client.getSessionId(),
                    "hostAccountNumber": `${this.accountNumber}`,
                    "instanceId": `${this.client.getInstanceId()}`
                }
            }
        }
        if (this.forceUpdateCwWebhook) updatePayload.channel['webhook_url'] = this.expectedSelfWebhookUrl
        const updateInboxPromise = this.cwReq('patch', `inboxes/${this.inboxId}`, updatePayload)
        if (this.forceUpdateCwWebhook) get_inbox = (await updateInboxPromise).data;
        else proms.push(updateInboxPromise)

        /**
         * Get the inbox and test it.
         */
        if (!(get_inbox?.webhook_url || "").includes("/chatwoot")) console.log("Please set the chatwoot inbox webhook to this sessions URL with path /chatwoot")
        /**
         * Check the webhook URL
         */
        const chatwootWebhookCheck = async () => {
            let checkCodePromise;
            const cancelCheckProm = () => (checkCodePromise.cancel && typeof checkCodePromise.cancel === "function") && checkCodePromise.cancel()
            try {
                const wUrl = get_inbox.webhook_url.split('?')[0].replace(/\/+$/, "").trim()
                const checkWhURL = `${wUrl}${wUrl.endsWith("/") ? '' : `/`}checkWebhook${this.key ? `?api_key=${this.key}` : ''}`
                log.info(`Verifying webhook url: ${checkWhURL}`)
                const checkCode = uuidAPIKey.create().apiKey //random generated string
                await new Promise(async (resolve, reject) => {
                    checkCodePromise = ev.waitFor(chatwoot_webhook_check_event_name, 5000).catch(reject)
                    await axios.post(checkWhURL, {
                        checkCode
                    }, { headers: { api_key: this.key || '' } }).catch(reject)
                    const checkCodeResponse = await checkCodePromise;
                    if (checkCodeResponse && checkCodeResponse[0]?.checkCode == checkCode) resolve(true); else reject(`Webhook check code is incorrect. Expected ${checkCode} - incoming ${((checkCodeResponse || [])[0] || {}).checkCode}`)
                })
                log.info('Chatwoot webhook verification successful')
            } catch (error) {
                cancelCheckProm()
                const e = `Unable to verify the chatwoot webhook URL on this inbox: ${error.message}`;
                console.error(e)
                log.error(e)
            } finally {
                cancelCheckProm()
            }
        }

        proms.push(chatwootWebhookCheck())

        const setOnMessageProm = this.client.onMessage(this.processWAMessage.bind(this))
        const setOnAckProm = this.client.onAck(async ackEvent => {
            if (ignoreMap[ackEvent.id] && typeof ignoreMap[ackEvent.id] === 'number' && ackEvent.ack > ignoreMap[ackEvent.id]) {
                // delete ignoreMap[ackEvent.id]
                return;
            }
            if (ackEvent.ack >= 1 && ackEvent.isNewMsg && ackEvent.self === "in") {
                if (ignoreMap[ackEvent.id]) return;
                ignoreMap[ackEvent.id] = ackEvent.ack
                const _message = await this.client.getMessageById(ackEvent.id)
                return await this.processWAMessage(_message)
            }
            return;
        })
        proms.push(setOnMessageProm)
        proms.push(setOnAckProm)
        await Promise.all(proms);
        this.inboxId = inboxId
        this.accountId = accountId
    }

    public async getAllInboxMessages(convoIdOrContactId : string) {
        /**
         * Check if it's a contact by traversing the convo reg.
         */
        const convoId = convoReg[convoIdOrContactId] || convoIdOrContactId;
        const { data } = await this.cwReq('get', `conversations/${convoId}/messages`)
        const messages = data.payload;
        return messages;
    }

    /**
     * Get the original chatwoot message object. Useful for getting CSAT full message details.
     * 
     * @param convoIdOrContactId the owa contact ID or the convo ID. Better if you use convo ID.
     * @param messageId 
     * @returns 
     */
    public async getMessageObject(convoIdOrContactId : number | string, messageId : number | string) {
        const msgs = await this.getAllInboxMessages(`${convoIdOrContactId}`);
        const foundMsg = msgs.find(x=>x.id==messageId)
        return foundMsg
    }

    /**
     * Get Contacts and conversations
     */
    public async searchContact (number: string) {
        try {
            const n = number.replace('@c.us', '')
            const { data } = await this.cwReq('get', `contacts/search?q=${n}&sort=phone_number`)
            if (data.payload.length) {
                return data.payload.find(x => (x.phone_number || "").includes(n)) || false
            } else false
        } catch (error) {
            log.error(`CW SEARCH CONTACT ERROR: ${error.message}`)
            return;
        }
    }

    public async getContactConversation (number: string) {
        try {
            const { data } = await this.cwReq('get', `contacts/${contactReg[number]}/conversations`);
            const allContactConversations = data.payload.filter(c => `${c.inbox_id}` == `${this.inboxId}`).sort((a, b) => a.id - b.id)
            const [opened, notOpen] = [allContactConversations.filter(c => c.status === 'open'), allContactConversations.filter(c => c.status != 'open')]
            const hasOpenConvo = opened[0] ? true : false;
            const resolvedConversation = opened[0] || notOpen[0];
            if (!hasOpenConvo) {
                //reopen convo
                await this.openConversation(resolvedConversation.id)
            }
            return resolvedConversation;
        } catch (error) {
            log.error(`CW GET CONVERSATION ERROR: ${error.message}`)
            return;
        }
    }

    public async createConversation (contact_id: number) {
        try {
            const { data } = await this.cwReq('post', `conversations`, {
                contact_id,
                "inbox_id": this.inboxId
            });
            return data;
        } catch (error) {
            log.error(`CW CREATE CONVERSATION ERROR: ${error.message}`)
            return;
        }
    }

    public async createContact (contact: Contact) {
        try {
            const { data } = await this.cwReq('post', `contacts`, {
                "identifier": contact.id,
                "name": contact.formattedName || contact.name || contact.shortName || contact.id,
                "phone_number": `+${contact.id.replace('@c.us', '')}`,
                "avatar_url": contact.profilePicThumbObj.eurl,
                "custom_attributes": {
                    "wa:number": `${contact.id.replace('@c.us', '')}`,
                    ...contact
                }
            })
            return data.payload.contact
        } catch (error) {
            log.error(`CW CREATE CONTACT ERROR: ${error.message}`)
            return;
        }
    }

    public async openConversation (conversationId, status = "opened"){
        try {
            const { data } = await this.cwReq('post', `conversations/${conversationId}/messages`, {
                status
            });
            return data;
        } catch (error) {
            log.error(`CW OPEN CONVERSATION ERROR: ${error.message}`)
            return;
        }
    }

    public async sendConversationMessage (content, contactId, message: Message) {
        log.info(`WA=>CW ${contactId}: ${content} ${message.id}`)
        try {
            const { data } = await this.cwReq('post', `conversations/${convoReg[contactId]}/messages`, {
                content,
                "message_type": message.fromMe ? "outgoing" : "incoming",
                "private": false,
                echo_id: message.id,
                source_id: message.id,
                "content_attributes": message
            });
            return data;
        } catch (error) {
            log.error(`CW SEND CONVERSATION MESSAGE ERROR: ${error.message}`)
            return;
        }
    }

    public async sendAttachmentMessage(content, contactId, message: Message) {
        // decrypt message
        const file = await this.client.decryptMedia(message)
        log.info(`INCOMING MESSAGE ATTACHMENT ${contactId}: ${content} ${message.id}`)
        const formData = new FormData();
        formData.append('attachments[]', Buffer.from(file.split(',')[1], 'base64'), {
            filename: `${message.t}.${mime.extension(message.mimetype)}`,
            contentType: (file.match(/[^:\s*]\w+\/[\w-+\d.]+(?=[;| ])/) || ["application/octet-stream"])[0]
        });
        formData.append('content', content || "")
        formData.append('message_type', 'incoming')
        try {
            const { data } = await this.cwReq('post', `conversations/${convoReg[contactId]}/messages`, formData, formData.getHeaders());
            return data;
        } catch (error) {
            log.error(`CW SEND ATTACHMENT MESSAGE ERROR: ${error.message}`)
            return;
        }
    }

    async processWAMessage (message: Message) {
        try {
            let isNewConversation = false;
            if (message.chatId.includes('g')) {
                //chatwoot integration does not support group chats
                return;
            }
            if(message.chatId.includes('broadcast')){
                //chatwoot integration does not support broadcast or story messages
                return;
            }
            /**
             * Does the contact exist in chatwoot?
             */
            if (!contactReg[message.chatId]) {
                const contact = await this.searchContact(message.chatId)
                if (contact) {
                    contactReg[message.chatId] = contact.id
                } else {
                    //create the contact (have to use chat.contact because it may be triggered by an agent doing an outgoing message)
                    contactReg[message.chatId] = (await this.createContact(message.chat.contact)).id
                }
            }
    
            if (!convoReg[message.chatId]) {
                const conversation = await this.getContactConversation(message.chatId);
                if (conversation) {
                    convoReg[message.chatId] = conversation.id
                } else {
                    //create the conversation
                    /**
                     * TODO: Handle create conversation error
                     */
                    convoReg[message.chatId] = (await this.createConversation(contactReg[message.chatId])).id
                    isNewConversation = convoReg[message.chatId]
                }
            }
            /**
             * Does the conversation exist in 
             */
            let text = message.body;
            let hasAttachments = false;
            switch (message.type) {
                case 'list_response':
                    /**
                     * Possible CSAT response:
                     */
                    await this.processCSATResponse(message)
                    break;
                case 'location':
                    text = `Location Message:\n\n${message.loc}\n\nhttps://www.google.com/maps?q=${message.lat},${message.lng}`;
                    break;
                case 'buttons_response':
                    text = message.selectedButtonId;
                    break;
                case 'document':
                case 'image':
                case 'audio':
                case 'ptt':
                case 'video':
                    if (message.cloudUrl) {
                        text = `FILE:\t${message.cloudUrl}\n\nMESSAGE:\t${message.text}`;
                    } else {
                        text = message.text;
                        hasAttachments = true;
                    }
                    break;
                default:
                    text = message?.ctwaContext?.sourceUrl ? `${message.body}\n\n${message.ctwaContext.sourceUrl}` : message.body || "__UNHANDLED__";
                    break;
            }
            const newCWMessage = hasAttachments ? await this.sendAttachmentMessage(text, message.chatId, message) : await this.sendConversationMessage(text, message.chatId, message)
            if(isNewConversation!==false) {
                /**
                 * Wait 3 seconds before trying to check for an automated message
                */
                await timeout(3000)
                /**
                 * Check the messages to see if a message_type: 3 comes through after the initial message;
                 */
                const msgs = await this.getAllInboxMessages(`${isNewConversation}`)
                if(!msgs) return;
                /**
                 * Message IDs are numbers (for now)
                 */
                const possibleWelcomeMessage = msgs.filter(m => m.id>newCWMessage.id).find(m => m.message_type === 3 && m.content_type !== 'input_csat')
                if(!possibleWelcomeMessage) return;
                /**
                 * Ok reply with the welcome message now
                 */
                await this.client.sendText(message.chatId, possibleWelcomeMessage.content || "...")
            }
        } catch (error) {
            console.error(`Something went wrong processing this message: ${message.id}`, error)
        }
    }

    public async processCSATResponse(message: Message){
        const csatResponse = parseIdAndScore(message.listResponse.rowId)
        if(!csatResponse) return;
        if(csatResponse.id && csatResponse.score) {
            log.info(`CW:CSAT RESPONSE: ${csatResponse.id} ${csatResponse.score}`)
            /**
             * PUT request to report CSAT response
             */
            await axios.put(`https://app.chatwoot.com/public/api/v1/csat_survey/${csatResponse.id}`, {
                    "message": {
                        "submitted_values":{
                            "csat_survey_response":{
                                "rating": csatResponse.score
                            }
                        }
                    }
                }).catch(e=>{})
        }
    }

    public async sendCSAT(incomlpeteCsatMessage: {
        id: number,
        conversation_id: number,
        content ?: string
    }, to: ChatId) {
        const extractCsatLink = str => (str.match(/(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])/gi) || [])[0]
        /**
         * First check if the given csat message object has the link, if not, get the whole csat object
         */
        let csatMessage;
        if(!extractCsatLink(incomlpeteCsatMessage?.content)) {
            csatMessage = await chatwootClient.getMessageObject(incomlpeteCsatMessage.conversation_id, incomlpeteCsatMessage.id)
        } else {
            csatMessage = incomlpeteCsatMessage
        }
        if(!csatMessage) return;
        const lic = false//this.client.getLicenseType()
        const link = extractCsatLink(csatMessage.content)
        const u = new URL(link)
        const csatID = u.pathname.replace('/survey/responses/','')
        log.info(`SENDING CSAT ${to} ${csatMessage.content}`)
        if(!lic) {
            /**
             * Send as a normal text message with the link
             */
            await this.client.sendLinkWithAutoPreview(to, link, csatMessage.content)
        } else {
            await this.client.sendListMessage(to, [
                {
                    title: "Please rate from 1 - 5",
                    rows: [
                        {
                            "title" : "😞",
                            "description": "1",
                            rowId: `${csatID}:1`
                        },
                        {
                            "title" : "😑",
                            "description": "2",
                            rowId: `${csatID}:2`
                        },
                        {
                            "title" : "😐",
                            "description": "3",
                            rowId: `${csatID}:3`
                        },
                        {
                            "title" : "😀",
                            "description": "4",
                            rowId: `${csatID}:4`
                        },
                        {
                            "title" : "😍",
                            "description": "5",
                            rowId: `${csatID}:5`
                        }
                    ]
                }
            ], "Customer Survey" , "Please rate this conversation", 'Help Us Improve')
        }
    }


}