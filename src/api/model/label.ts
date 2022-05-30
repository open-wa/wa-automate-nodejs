import { ContactId, ChatId, MessageId } from "./aliases";

export interface Label {
    /**
     * The internal ID of the label. Usually a number represented as a string e.g "1"
     */
        id: string,
        /**
         * The text contents of the label
         */
        name: string,
        /**
         * The items that are tagged with this label
         */
        items: {
            /**
             * Labels can be applied to chats, contacts or individual messages. This represents the type of object the label is attached to.
             */
          type: "Chat" | "Contact" | "Message",
          /**
           * The ID of the object that the label is atteched to.
           */
          id: ContactId | ChatId | MessageId
        }[]
}