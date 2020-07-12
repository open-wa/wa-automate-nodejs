/**
 * A chat id ends with `@cus` or `@g.us` for group chats.
 */
export type ChatId = string;
/**
 * A group chat ends with `@g.us` and usually has two parts, the timestamp of when it was created, and the user id of the number that created the group. For example `00000000000-1111111111@g.us`
 */
export type GroupChatId = string;
/**
 * A contact id ends with `@c.us` and only contains the number of the contact. For example, if the country code of a contact is `44` and their number is `7123456789` then the contact id would be `447123456789@c.us`
 */
export type ContactId = string;
export type MessageId = string;
export type Content = string;
export type DataURI = string;
export type Base64 = string;
