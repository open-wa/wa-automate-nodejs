import { Client } from "../api/Client";
import { Message } from "../api/model/message";
export type MessagePreProcessor = (message: Message, client?: Client, alreadyProcessed?: boolean, source?: 'onMessage' | 'onAnyMessage') => Promise<Message>;
export declare const MessagePreprocessors: {
    [processorName: string]: MessagePreProcessor;
};
export declare enum PREPROCESSORS {
    SCRUB = "SCRUB",
    BODY_ONLY = "BODY_ONLY",
    AUTO_DECRYPT = "AUTO_DECRYPT",
    AUTO_DECRYPT_SAVE = "AUTO_DECRYPT_SAVE",
    UPLOAD_CLOUD = "UPLOAD_CLOUD"
}
export type MPConfigType = PREPROCESSORS | MessagePreProcessor | (PREPROCESSORS | MessagePreProcessor)[];
//# sourceMappingURL=preProcessors.d.ts.map