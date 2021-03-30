/**
 * The suffix used to identify a non-group chat id
 */
export declare type ChatServer = 'c.us';
/**
 * The suffix used to identify a group chat id
 */
export declare type GroupChatServer = 'g.us';
/**
 * A type alias for all available "servers"
 */
export declare type WaServers = ChatServer | GroupChatServer;
/**
 * Type alias representing all available country codes
 */
export declare type CountryCode = 1 | 7 | 20 | 27 | 30 | 31 | 32 | 33 | 34 | 36 | 39 | 40 | 41 | 43 | 44 | 45 | 46 | 47 | 48 | 49 | 51 | 52 | 53 | 54 | 55 | 56 | 57 | 58 | 60 | 61 | 62 | 63 | 64 | 65 | 66 | 81 | 82 | 84 | 86 | 90 | 91 | 92 | 93 | 94 | 95 | 98 | 211 | 212 | 213 | 216 | 218 | 220 | 221 | 222 | 223 | 224 | 225 | 226 | 227 | 228 | 229 | 230 | 231 | 232 | 233 | 234 | 235 | 236 | 237 | 238 | 239 | 240 | 241 | 242 | 243 | 244 | 245 | 246 | 248 | 249 | 250 | 251 | 252 | 253 | 254 | 255 | 256 | 257 | 258 | 260 | 261 | 262 | 263 | 264 | 265 | 266 | 267 | 268 | 269 | 290 | 291 | 297 | 298 | 299 | 350 | 351 | 352 | 353 | 354 | 355 | 356 | 357 | 358 | 359 | 370 | 371 | 372 | 373 | 374 | 375 | 376 | 377 | 378 | 380 | 381 | 382 | 383 | 385 | 386 | 387 | 389 | 420 | 421 | 423 | 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 509 | 590 | 591 | 592 | 593 | 594 | 595 | 596 | 597 | 598 | 599 | 670 | 672 | 673 | 674 | 675 | 676 | 677 | 678 | 679 | 680 | 681 | 682 | 683 | 685 | 686 | 687 | 688 | 689 | 690 | 691 | 692 | 850 | 852 | 853 | 855 | 856 | 880 | 886 | 960 | 961 | 962 | 963 | 964 | 965 | 966 | 967 | 968 | 970 | 971 | 972 | 973 | 974 | 975 | 976 | 977 | 992 | 993 | 994 | 995 | 996 | 998;
/**
 * The account number. It is made up of a country code and then the local number without the preceeding 0. For example, if a UK (+44) wa account is linked to the number 07123456789 then the account number will be 447123456789.
 */
export declare type AccountNumber = `${number}`;
/**
 * A group chat ends with `@g.us` and usually has two parts, the timestamp of when it was created, and the user id of the number that created the group. For example `[creator number]-[timestamp]@g.us`
 *
 * Example:
 *
 * `"447123456789-1445627445@g.us"`
 */
export declare type GroupChatId = `${AccountNumber}-${number}@${GroupChatServer}`;
/**
 * A contact id ends with `@c.us` and only contains the number of the contact. For example, if the country code of a contact is `44` and their number is `7123456789` then the contact id would be `447123456789@c.us`
 *
 * Example:
 *
 * `"447123456789@c.us"`
 */
export declare type ContactId = `${AccountNumber}@${ChatServer}`;
/**
 * A chat id ends with `@c.us` or `@g.us` for group chats.
 *
 * Example:
 *
 * A group chat: `"447123456789-1445627445@g.us"`
 * A group chat: `"447123456789@g.us"`
 *
 */
export declare type ChatId = ContactId | GroupChatId;
/**
 * The id of a message. The format is `[boolean]_[ChatId]_[random character string]`
 *
 * Example:
 *
 * `"false_447123456789@c.us_9C4D0965EA5C09D591334AB6BDB07FEB"`
 */
export declare type MessageId = `${boolean}_${ChatId}_${string}`;
/**
 * This is a generic type alias for the content of a message
 *
 * Example:
 *
 * `"hello!"`
 */
export declare type Content = string;
export declare type NonSerializedId = {
    server: WaServers;
    user: AccountNumber;
    _serialized: ContactId;
};
/**
 *
 * Data URLs, URLs prefixed with the data: scheme, allow content creators to embed small files inline in documents. They were formerly known as "data URIs" until that name was retired by the WHATWG.
 *
 *
 * Data URLs are composed of four parts: a prefix (data:), a MIME type indicating the type of data, an optional base64 token if non-textual, and the data itself:
 *
 * Example:
 * `"data:[<mediatype>][;base64],<data>"`
 *
 * Learn more here: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
 */
export declare type DataURL = string;
/**
 * Base64 is basically a file encoded as a string.
 *
 * Base64 is a group of similar binary-to-text encoding schemes that represent binary data in an ASCII string format by translating it into a radix-64 representation. The term Base64 originates from a specific MIME content transfer encoding.
 *
 * Learn more here: https://developer.mozilla.org/en-US/docs/Glossary/Base64
 */
export declare type Base64 = string;
/**
 * The relative or absolute path of a file
 *
 * Learn more here: https://www.w3schools.com/html/html_filepaths.asp
 */
export declare type FilePath = string;
