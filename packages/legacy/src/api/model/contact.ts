import { ContactId } from './aliases';
import { Id } from './id';
import { Message } from './message';

export interface NumberCheck {
    id: Id,
    status: 200 | 404,
    isBusiness: boolean,
    canReceiveMessage: boolean,
    numberExists: boolean
}

export interface BizCategory {
  id: string
  localized_display_name: string
}

export interface BizProfileOptions {
  commerceExperience: "catalog" | "none" | "shop"
  cartEnabled: boolean
}

export interface BusinessHours {
  config: {
    [day in "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"]: {
      mode: "specific_hours" | "open_24h" | "appointment_only"
      hours: number[][]
    }
  }
  timezone: string
}

export interface BusinessProfile {
  /**
   * The Contact ID of the business
   */
  id: ContactId
  /**
   * Some special string that identifies the business (?)
   */
  tag: string
  /**
   * The business description
   */
  description: string
  /**
   * The business' categories
   */
  categories: BizCategory[]
  /**
   * The business' profile options
   */
  profileOptions: BizProfileOptions
  /**
   * The business' email address
   */
  email: string
  /**
   * Array of strings that represent the business' websites
   */
  website: string[]
  /**
   * The operating hours of the business
   */
  businessHours: BusinessHours
  /**
   * The status of the business' catalog
   */
  catalogStatus: "catalog_exists" | string
  /**
   * The address of the business
   */
  address: string
  /**
   * The facebook page of the business
   */
  fbPage: any
  /**
   * The instagram profile of the business
   */
  igProfessional: any
  isProfileLinked: boolean
  coverPhoto: {
    /**
     * The id of the cover photo
     */
    id: string
    /**
     * The URL of the cover photo. It might download as an .enc but just change the extension to .jpg
     */
    url: string
  }
  /**
   * The latitude of the business location if set
   */
  latitude: number,
  /**
   * The longitude of the business location if set
   */
  longitude: number
}

export interface Contact {
  formattedName: string;
  id: ContactId;
  isBusiness: boolean;
  /**
   * Most likely true when the account has a green tick. See `verifiedLevel` also.
   */
  isEnterprise: boolean;
  isMe: boolean;
  isMyContact: boolean;
  isPSA: boolean;
  isUser: boolean;
  isWAContact: boolean;
  labels: string[];
  msgs: Message[];
  name: string;
  plaintextDisabled: boolean;
  profilePicThumbObj: {
    eurl: string;
    id: Id;
    img: string;
    imgFull: string;
    raw: string;
    tag: string;
  };
  pushname: string;
  shortName: string;
  statusMute: boolean;
  type: string;
  /**
   * 0 = not verified
   * 2 = verified (most likely represents a blue tick)
   */
  verifiedLevel: number;
  /**
   * The business account name verified by WA.
   */
  verifiedName: string;
  isOnline?: boolean;
  lastSeen?: number;
  /**
   * If the contact is a business, the business information will be added to the contact object.
   * 
   * In some circumstances this will be out of date or lacking certain fields. In those cases you have to use `client.getBusinessProfile` 
   */
  businessProfile?: BusinessProfile;
}
