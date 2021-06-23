import { ChatId, ContactId, MessageId } from "./aliases";

export interface CustomProduct {
    /**
     * The main title of the product. E.g:
     * `BAVARIA — 35 SPORTS CRUISER (2006)`
     */
    name: string;
    /**
     * The description of the product. This shows right under the price so it is useful for subscriptions/rentals. E.g:
     * 
     * `(per day)\n\nCome and have a fantastic sailing adventure aboard our boat. \nShe is a Bavaria 35 sports cruiser and is powered by 2 economical Volvo D6’s with Bravo 2 outdrives as well as a bow thruster. This Makes maneuvering very easy. She can accommodate up to 8 people for day charters and for overnight charters she can accommodate 4 in comfort in 2 cabins.`
     */
    description: string;
    /**
     * The price amount multiplied by 1000. For example, for something costing `825` units of currency:
     * `825000`
     */
    priceAmount1000: number;
    /**
     * The [**ISO 4217**](https://en.wikipedia.org/wiki/ISO_4217) 3 letter currency code. E.g (Swedish krona)
     * `SEK`
     */
    currency: string;
    /**
     * The URL of the product.
     * 
     * NOTE: At the moment, the URL DOES NOT WORK. It shows up for the recipient but they will not be able to click it. As a rememdy, it is added as a reply to the product message.
     */
    url?: string
}

export interface CartItem {
    /**
     * Product ID
     */
     id: string,
     /**
      * Product name
      */
     name: string,
     /**
      * Amount of this item in the cart
      */
     qty: number,
     thumbnailId: string,
     /**
      * URL to .enc file of the thumbnail. Just change the filetype to .jpg to view the thumbnail
      */
     thumbnailUrl: string,

}

export interface Order {
    /**
     * Order ID
     */
    id: string,
    /**
     * epoch ts divided by 1000
     */
    createdAt: number,
    /**
     * The [**ISO 4217**](https://en.wikipedia.org/wiki/ISO_4217) 3 letter currency code. E.g (Swedish krona)
     * `SEK`
     */
    currency: string,
    /**
     * An array of items in the cart
     */
    products: CartItem[],
    sellerJid: string,
    subtotal: `${number}`,
    total:  `${number}`
}


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