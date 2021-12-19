import { Client, ev, SimpleListener, ChatId, Message, Contact } from '../..';
import { app, cliFlags } from '../server';
import { Request, Response } from "express";
import { default as axios } from 'axios'
import { default as FormData } from 'form-data'
import mime from 'mime-types';

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
            if (attachments?.length > 0) {
                //has attachments
                const [firstAttachment, ...restAttachments] = attachments;
                const sendAttachment = async (attachment: any, c?: string) => client.sendImage(to,attachment.data_url, attachment.data_url.substring(attachment.data_url.lastIndexOf('/') + 1), c || '',null,true)
                //send the text as the caption with the first message only
                promises.push(sendAttachment(firstAttachment, content))
                restAttachments.map(sendAttachment).map(promises.push)
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
                    promises.push(client.sendText(to, content));
                }
            }
            return await Promise.all(promises)
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
    const u = cliConfig.chatwootUrl as string //e.g `"localhost:3000/api/v1/accounts/3"
    const api_access_token = cliConfig.chatwootApiAccessToken as string
    const _u = new URL(u)
    const origin = _u.origin;
    const port = _u.port || 80;
    const [accountId, inboxId] = u.match(/\/(app|(api\/v1))\/accounts\/\d*\/inbox\/\d*/g)[0].split('/').filter(Number)
    // const accountId = u.match(/accounts\/\d*/g) && u.match(/accounts\/\d*/g)[0].replace('accounts/', '')
    const resolvedInbox = inboxId || u.match(/inboxes\/\d*/g) && u.match(/inboxes\/\d*/g)[0].replace('inboxes/', '')
    const cwReq = (path, method, data?: any, _headers ?: any) => {
        const url = `${origin}/api/v1/accounts/${accountId}/${path}`.replace('app.bentonow.com','chat.bentonow.com')
        // console.log(url,method,data)
        return axios({
        method,
        data,
        url,
        headers: {
            api_access_token,
            ..._headers
        }
    })
}
    const contactReg = {
        //WID : chatwoot contact ID
        "example@c.us": "1"
    };
    const convoReg = {
        //WID : chatwoot conversation ID
        "example@c.us": "1"
    }

    const { data: get_inbox } = await cwReq(`inboxes/${resolvedInbox}`, 'get')
    // const inboxId = `openwa_${sessionId}`
    /**
     * Get the inbox and test it.
     */
    if(!(get_inbox?.webhook_url || "").includes("/chatwoot")) console.log("Please set the chatwoot inbox webhook to this sessions URL with path /chatwoot")
    /**
     * Get Contacts and conversations
     */
    const searchContact = async (number: string) => {
        try {
            const n = number.replace('@c.us', '')
            const { data } = await cwReq(`contacts/search?q=${n}&sort=phone_number`, 'get')
            if (data.payload.length) {
                return data.payload.find(x => (x.phone_number || "").includes(n)) || false
            } else false
        } catch (error) {
            return;
        }
    }

    const getContactConversation = async (number: string) => {
        try {
            const { data } = await cwReq(`contacts/${contactReg[number]}/conversations`, 'get');
            return data.payload.sort((a,b)=>a.id-b.id)[0];
        } catch (error) {
            return;
        }
    }

    const createConversation = async (contact_id: number) => {
        try {
            const { data } = await cwReq(`conversations`, 'post', {
                contact_id,
                "inbox_id": resolvedInbox
            });
            return data;
        } catch (error) {
            return;
        }
    }

    const createContact = async (contact: Contact) => {
        try {
            const { data } = await cwReq(`contacts`, 'post', {
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

    const sendConversationMessage = async (content, contactId, message) => {
        try {
            const { data } = await cwReq(`conversations/${convoReg[contactId]}/messages`, 'post', {
                content,
                "message_type": 0,
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
        let formData = new FormData();
        formData.append('attachments[]', Buffer.from(file.split(',')[1], 'base64'), {
            knownLength: 1,
            filename: `${message.t}.${mime.extension(message.mimetype)}`,
            contentType: (file.match(/[^:\s*]\w+\/[\w-+\d.]+(?=[;| ])/) || ["application/octet-stream"])[0]
          });
        formData.append('content', content)
        formData.append('message_type', 'incoming')
        try {
            const { data } = await cwReq(`conversations/${convoReg[contactId]}/messages`, 'post', formData, formData.getHeaders());
            return data;
        } catch (error) {
            return;
        }
    }



    // const inboxId = s.match(/conversations\/\d*/g) && s.match(/conversations\/\d*/g)[0].replace('conversations/','')
    /**
     * Update the chatwoot contact and conversation registries
     */
    client.onMessage(async message => {
        if (message.from.includes('g')) {
            //chatwoot integration does not support group chats
            return;
        }
        /**
         * Does the contact exist in chatwoot?
         */
        if (!contactReg[message.from]) {
            const contact = await searchContact(message.from)
            if (contact) {
                contactReg[message.from] = contact.id
            } else {
                //create the contact
                contactReg[message.from] = (await createContact(message.sender)).id
            }
        }

        if (!convoReg[message.from]) {
            const conversation = await getContactConversation(message.from);
            if (conversation) {
                convoReg[message.from] = conversation.id
            } else {
                //create the conversation
                convoReg[message.from] = (await createConversation(contactReg[message.from])).id
            }
        }
        /**
         * Does the conversation exist in 
         */
        let text = message.body;
        let hasAttachments = false;
        switch (message.type) {
            case 'location':
                text = `${message.lat},${message.lng}`;
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
                text = message.body || "__UNHANDLED__";
                break;
        }
        if(hasAttachments) await sendAttachmentMessage(text, message.from, message)
        else await sendConversationMessage(text, message.from, message)
    })
}