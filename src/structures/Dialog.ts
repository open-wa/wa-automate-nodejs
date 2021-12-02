import { ChatId, Client, Message } from "..";

export interface CurrentDialogProps {
    [k : string] : any
}

export interface DialogState {
    currentStep: number;
    currentProps: any;
    lastInput: any;
    isComplete: boolean;
    isError: boolean;
    errorMessage: string;
}

export interface DialogTemplate {
    "dialogId": string,
    "privateOnly": boolean,
    "identifier": string,
    "successMessage": string,
    "startMessage": string,
    "properties": {
        [key: string]: DialogProperty
    }
}

export type CheckFunction = (lastReceivedMessage: Message, currentProps: CurrentDialogProps) => boolean

export interface DialogProperty {
    "order": number,
    "key": string,
    "prompt": string,
    "type": string,
    "skipCondition" ?: CheckFunction,
    "options" ?: DialogButtons[] | DialogListMessageSection[],
    "validation": DialogValidation[]
}

export interface DialogButtons {
    label: string,
    value: string,
}

export interface DialogListMessageSection {
        title: string,
        rows: DialogListMessageRow[]
}

export interface DialogListMessageRow {
    title: string,
    description: string,
    value: string
}

export interface DialogValidation {
    "type": ValidationType,
    "value": string | CheckFunction,
    "errorMessage": string
}

export enum ValidationType {
    REGEX = "regex",
    LENGTH = "length",
    CHECK = "check"
}

// async function processDialog(dialog: DialogTemplate, chatId: ChatId, client: Client){
//     if(dialog.privateOnly && chatId.includes('g')) return;
//     const requiredProperties = Object.keys(dialog.properties);
//     const requiredPropertiesInOrder = requiredProperties.map(prop=>dialog.properties[prop]).sort((a, b) => a.order - b.order);
//     /**
//      * Send start dialog message
//      */
//     await client.sendText(chatId, dialog.startMessage);
//     requiredPropertiesInOrder.map((diaProp: DialogProperty) => {
//         diaProp.type
//     })
// }