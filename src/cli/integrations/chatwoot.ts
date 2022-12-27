import uuidAPIKey from 'uuid-apikey';
import { Client, ev, ChatId, Message, Contact, log } from '../..';
import { cliFlags } from '../server';
import { Request, Response } from "express";
import { default as axios } from 'axios'
import { default as FormData } from 'form-data'
import mime from 'mime-types';

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

export const chatwoot_webhook_check_event_name = "cli.integrations.chatwoot.check"

export type expressMiddleware = (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>

export const chatwootMiddleware: (cliConfig: cliFlags, client: Client) => expressMiddleware = (cliConfig: cliFlags, client: Client) => {
    return async (req: Request, res: Response): Promise<Response<any, Record<string, any>>> => {
        const processMesssage = async () => {
            const promises = [];
            const { body } = req
            if(!body) return;
            if(!body.conversation) return;
            const m = body.conversation.messages[0];
            const contact = (body.conversation.meta.sender.phone_number || "").replace('+', '')
            if (
                body.message_type === "incoming" ||
                body.private ||
                body.event !== "message_created" ||
                !m ||
                !contact
            ) return;
            const { attachments, content } = m
            const to = `${contact}@c.us` as ChatId;
            if(!convoReg[to]) convoReg[to] = body.conversation.id;
            if (attachments?.length > 0) {
                //has attachments
                const [firstAttachment, ...restAttachments] = attachments;
                const sendAttachment = async (attachment: any, c?: string) => attachment && client.sendImage(to,attachment.data_url, attachment.data_url.substring(attachment.data_url.lastIndexOf('/') + 1), c || '',null,true)
                //send the text as the caption with the first message only
                promises.push(sendAttachment(firstAttachment, content));
                ((restAttachments || []).map(attachment=>sendAttachment(attachment)) || []).map(p=>promises.push(p))
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
                    if(content.match(urlregex) && content.match(urlregex)[0]) {
                        promises.push(client.sendLinkWithAutoPreview(to,content.match(urlregex)[0], content))
                    } else
                    promises.push(client.sendText(to, content));
                }
            }
            const outgoingMessageIds = await Promise.all(promises)
            log.info(`Outgoing message IDs: ${JSON.stringify(outgoingMessageIds)}`)
            /**
             * Add these message IDs to the ignore map
             */
            outgoingMessageIds.map(id=>ignoreMap[`${id}`]=true)
            return outgoingMessageIds
        }
        try {
            const processAndSendResult = await processMesssage();
            res.status(200).send(processAndSendResult);
        } catch (error) {
            console.log("🚀 ~ file: chatwoot.ts ~ line 62 ~ return ~ error", error)
            res.status(400).send(error);
        }
        return;
    }
}

export const setupChatwootOutgoingMessageHandler: (cliConfig: cliFlags, client: Client) => Promise<void> = async (cliConfig: cliFlags, client: Client) => {
    log.info(`Setting up chatwoot integration: ${cliConfig.chatwootUrl}`)
    const u = cliConfig.chatwootUrl as string //e.g `"localhost:3000/api/v1/accounts/3"
    const api_access_token = cliConfig.chatwootApiAccessToken as string
    const _u = new URL(u)
    const origin = _u.origin;
    const port = _u.port || 80;
    const accountNumber = await client.getHostNumber()
    const proms = [];
    let expectedSelfWebhookUrl = cliConfig.apiHost ? `${cliConfig.apiHost}/chatwoot ` : `${(cliConfig.host as string).includes('http') ? '' : `http${cliConfig.https || (cliConfig.cert && cliConfig.privkey) ? 's' : ''}://`}${cliConfig.host}:${cliConfig.port}/chatwoot `;
    expectedSelfWebhookUrl = expectedSelfWebhookUrl.trim()
    if(cliConfig.key) expectedSelfWebhookUrl = `${expectedSelfWebhookUrl}?api_key=${cliConfig.key}`
    let [accountId, inboxId] = (u.match(/\/(app|(api\/v1))\/accounts\/\d*\/(inbox|inboxes)\/\d*/g) || [''])[0].split('/').filter(Number)
    inboxId = inboxId || u.match(/inboxes\/\d*/g) && u.match(/inboxes\/\d*/g)[0].replace('inboxes/', '')
    // const accountId = u.match(/accounts\/\d*/g) && u.match(/accounts\/\d*/g)[0].replace('accounts/', '')
    /**
     * Is the inbox and or account id undefined??
     */
    if(!accountId) {
        log.info(`CHATWOOT INTEGRATION: account ID missing. Attempting to infer from access token....`)
        /**
         * If the account ID is undefined then get the account ID from the access_token
         */
         accountId = (await axios.get(`${origin}/api/v1/profile`, {headers: {api_access_token}})).data.account_id
         log.info(`CHATWOOT INTEGRATION: Got account ID: ${accountId}`)
    }
    if(!inboxId) {
        log.info(`CHATWOOT INTEGRATION: inbox ID missing. Attempting to find correct inbox....`)
        /**
         * Find the inbox with the correct setup.
         */
        const inboxArray = (await axios.get(`${origin}/api/v1/accounts/${accountId}/inboxes`, {headers: {api_access_token}})).data.payload
        const possibleInbox = inboxArray.find(inbox=>inbox?.additional_attributes?.hostAccountNumber === accountNumber)
        if(possibleInbox) {
            log.info(`CHATWOOT INTEGRATION: found inbox: ${JSON.stringify(possibleInbox)}`)
            log.info(`CHATWOOT INTEGRATION: found inbox id: ${possibleInbox.channel_id}`)
            inboxId = possibleInbox.channel_id
        }
        else {
            log.info(`CHATWOOT INTEGRATION: inbox not found. Attempting to create inbox....`)
            /**
             * Create inbox
             */
            const {data: new_inbox} = (await axios.post(`${origin}/api/v1/accounts/${accountId}/inboxes`, {
                "name": `open-wa-${accountNumber}`,
                "channel": {
                  "phone_number": `${accountNumber}`,
                  "type": "api",
                  "webhook_url": expectedSelfWebhookUrl,
                  "additional_attributes": {
                      "sessionId": client.getSessionId(),
                      "hostAccountNumber": `${accountNumber}`
                  }
                }
              }, {headers: {api_access_token}}))
              inboxId = new_inbox.id;
              log.info(`CHATWOOT INTEGRATION: inbox created. id: ${inboxId}`)
        }
    }
    
    const cwReq = async (method, path, data?: any, _headers ?: any) => {
        const url = `${origin}/api/v1/accounts/${accountId}/${path}`.replace('app.bentonow.com','chat.bentonow.com')
        // console.log(url,method,data)
        const response = await axios({
        method,
        data,
        url,
        headers: {
            api_access_token,
            ..._headers
        }
    }).catch(error=>{
        log.error(`CW REQ ERROR: ${error?.response?.status} ${error?.response?.message}`, error?.toJSON())
        throw error
    })
    log.info(`CW REQUEST: ${response.status} ${method} ${url} ${JSON.stringify(data)}`)
    return response
}

    let { data: get_inbox } = await cwReq('get', `inboxes/${inboxId}`)

    /**
     * Update the webhook
     */
     const updatePayload = {
        "channel": {
          "additional_attributes": {
              "sessionId": client.getSessionId(),
              "hostAccountNumber": `${accountNumber}`,
              "instanceId": `${client.getInstanceId()}`
          }
        }
      }
    if(cliConfig.forceUpdateCwWebhook) updatePayload.channel['webhook_url'] = expectedSelfWebhookUrl
     const updateInboxPromise = cwReq('patch',`inboxes/${inboxId}`, updatePayload)
     if(cliConfig.forceUpdateCwWebhook) get_inbox = (await updateInboxPromise).data;
    else proms.push(updateInboxPromise)

    /**
     * Get the inbox and test it.
     */
    if(!(get_inbox?.webhook_url || "").includes("/chatwoot")) console.log("Please set the chatwoot inbox webhook to this sessions URL with path /chatwoot")
    /**
     * Check the webhook URL
     */
     const chatwootWebhookCheck = async () => {
        let checkCodePromise;
        const cancelCheckProm = () => (checkCodePromise.cancel && typeof checkCodePromise.cancel === "function") && checkCodePromise.cancel()
        try {
        const wUrl = get_inbox.webhook_url.split('?')[0].replace(/\/+$/, "").trim()
        const checkWhURL = `${wUrl}${wUrl.endsWith("/")?'':`/`}checkWebhook${cliConfig.key ? `?api_key=${cliConfig.key}` : ''}`
        log.info(`Verifying webhook url: ${checkWhURL}`)
        const checkCode = uuidAPIKey.create().apiKey //random generated string
        await new Promise(async (resolve, reject) => {
            checkCodePromise = ev.waitFor(chatwoot_webhook_check_event_name, 5000).catch(reject)
            await axios.post(checkWhURL,{
                checkCode
            }, {headers:{api_key: cliConfig.key || ''}}).catch(reject)
            const checkCodeResponse = await checkCodePromise;
            if(checkCodeResponse && checkCodeResponse[0]?.checkCode==checkCode) resolve(true); else reject(`Webhook check code is incorrect. Expected ${checkCode} - incoming ${((checkCodeResponse || [])[0] || {}).checkCode}`)
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



    /**
     * Get Contacts and conversations
     */
    const searchContact = async (number: string) => {
        try {
            const n = number.replace('@c.us', '')
            const { data } = await cwReq('get',`contacts/search?q=${n}&sort=phone_number`)
            if (data.payload.length) {
                return data.payload.find(x => (x.phone_number || "").includes(n)) || false
            } else false
        } catch (error) {
            return;
        }
    }

    const getContactConversation = async (number: string) => {
        try {
            const { data } = await cwReq('get',`contacts/${contactReg[number]}/conversations`);
            const allContactConversations = data.payload.filter(c=>c.inbox_id===inboxId).sort((a,b)=>a.id-b.id)
            const [opened, notOpen] = [allContactConversations.filter(c=>c.status==='open'), allContactConversations.filter(c=>c.status!='open')]
            const hasOpenConvo = opened[0] ? true : false;
            const resolvedConversation = opened[0] || notOpen[0];
            if(!hasOpenConvo) {
                //reopen convo
                await openConversation(resolvedConversation.id)
            }
            return resolvedConversation;
        } catch (error) {
            return;
        }
    }

    const createConversation = async (contact_id: number) => {
        try {
            const { data } = await cwReq('post', `conversations`,  {
                contact_id,
                "inbox_id": inboxId
            });
            return data;
        } catch (error) {
            return;
        }
    }

    const createContact = async (contact: Contact) => {
        try {
            const { data } = await cwReq('post', `contacts`, {
                "identifier": contact.id,
                "name": contact.formattedName || contact.id,
                "phone_number": `+${contact.id.replace('@c.us', '')}`,
                "avatar_url": contact.profilePicThumbObj.eurl
            })
            return data.payload.contact
        } catch (error) {
            return;
        }
    }

    const openConversation = async (conversationId, status = "opened") => {
        try {
            const { data } = await cwReq( 'post',`conversations/${conversationId}/messages`, {
                status
            });
            return data;
        } catch (error) {
            return;
        }
    }

    const sendConversationMessage = async (content, contactId, message: Message) => {
        log.info(`INCOMING MESSAGE ${contactId}: ${content} ${message.id}`)
        try {
            const { data } = await cwReq( 'post',`conversations/${convoReg[contactId]}/messages`, {
                content,
                "message_type": message.fromMe ? "outgoing" : "incoming",
                "private": false
            });
            return data;
        } catch (error) {
            return;
        }
    }

    const sendAttachmentMessage = async (content, contactId, message : Message) => {
        // decrypt message
        const file = await client.decryptMedia(message)
        log.info(`INCOMING MESSAGE ATTACHMENT ${contactId}: ${content} ${message.id}`)
        let formData = new FormData();
        formData.append('attachments[]', Buffer.from(file.split(',')[1], 'base64'), {
            knownLength: 1,
            filename: `${message.t}.${mime.extension(message.mimetype)}`,
            contentType: (file.match(/[^:\s*]\w+\/[\w-+\d.]+(?=[;| ])/) || ["application/octet-stream"])[0]
          });
        formData.append('content', content)
        formData.append('message_type', 'incoming')
        try {
            const { data } = await cwReq('post',`conversations/${convoReg[contactId]}/messages`,  formData, formData.getHeaders());
            return data;
        } catch (error) {
            return;
        }
    }

    const processWAMessage = async (message : Message) => {
        if (message.chatId.includes('g')) {
            //chatwoot integration does not support group chats
            return;
        }
        /**
         * Does the contact exist in chatwoot?
         */
        if (!contactReg[message.chatId]) {
            const contact = await searchContact(message.chatId)
            if (contact) {
                contactReg[message.chatId] = contact.id
            } else {
                //create the contact
                contactReg[message.chatId] = (await createContact(message.sender)).id
            }
        }

        if (!convoReg[message.chatId]) {
            const conversation = await getContactConversation(message.chatId);
            if (conversation) {
                convoReg[message.chatId] = conversation.id
            } else {
                //create the conversation
                convoReg[message.chatId] = (await createConversation(contactReg[message.chatId])).id
            }
        }
        /**
         * Does the conversation exist in 
         */
        let text = message.body;
        let hasAttachments = false;
        switch (message.type) {
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
        if(hasAttachments) await sendAttachmentMessage(text, message.chatId, message)
        else await sendConversationMessage(text, message.chatId, message)
    }
    // const inboxId = s.match(/conversations\/\d*/g) && s.match(/conversations\/\d*/g)[0].replace('conversations/','')
    /**
     * Update the chatwoot contact and conversation registries
     */
    const setOnMessageProm = client.onMessage(processWAMessage)
    const setOnAckProm = client.onAck(async ackEvent =>{
        if(ackEvent.ack == 1 && ackEvent.isNewMsg && ackEvent.self==="in") {
            if(ignoreMap[ackEvent.id]) {
                delete ignoreMap[ackEvent.id]
                return;
            }
            const _message = await client.getMessageById(ackEvent.id)
            return await processWAMessage(_message)
        }
        return;
    })
    proms.push(setOnMessageProm)
    proms.push(setOnAckProm)
    await Promise.all(proms);
    return;
}