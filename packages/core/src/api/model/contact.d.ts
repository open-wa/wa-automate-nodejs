import { ContactId } from './aliases';
import { Id } from './id';
import { Message } from './message';
export interface NumberCheck {
    id: Id;
    status: 200 | 404;
    isBusiness: boolean;
    canReceiveMessage: boolean;
    numberExists: boolean;
}
export interface BizCategory {
    id: string;
    localized_display_name: string;
}
export interface BizProfileOptions {
    commerceExperience: "catalog" | "none" | "shop";
    cartEnabled: boolean;
}
export interface BusinessHours {
    config: {
        [day in "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"]: {
            mode: "specific_hours" | "open_24h" | "appointment_only";
            hours: number[][];
        };
    };
    timezone: string;
}
export interface BusinessProfile {
    id: ContactId;
    tag: string;
    description: string;
    categories: BizCategory[];
    profileOptions: BizProfileOptions;
    email: string;
    website: string[];
    businessHours: BusinessHours;
    catalogStatus: "catalog_exists" | string;
    address: string;
    fbPage: any;
    igProfessional: any;
    isProfileLinked: boolean;
    coverPhoto: {
        id: string;
        url: string;
    };
    latitude: number;
    longitude: number;
}
export interface Contact {
    formattedName: string;
    id: ContactId;
    isBusiness: boolean;
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
    verifiedLevel: number;
    verifiedName: string;
    isOnline?: boolean;
    lastSeen?: number;
    businessProfile?: BusinessProfile;
}
//# sourceMappingURL=contact.d.ts.map