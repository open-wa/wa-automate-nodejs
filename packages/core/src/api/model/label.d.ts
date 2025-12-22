import { ContactId, ChatId, MessageId } from "./aliases";
export interface Label {
    id: string;
    name: string;
    items: {
        type: "Chat" | "Contact" | "Message";
        id: ContactId | ChatId | MessageId;
    }[];
}
//# sourceMappingURL=label.d.ts.map