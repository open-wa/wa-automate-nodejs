import { STATE } from '.';
export interface SessionInfo {
    WA_VERSION: string;
    PAGE_UA: string;
    WA_AUTOMATE_VERSION: string;
    BROWSER_VERSION: string;
    LAUNCH_TIME_MS?: number;
    NUM?: string;
    OS?: string;
    START_TS?: number;
    PHONE_VERSION?: string;
    NUM_HASH?: string;
    PATCH_HASH?: string;
    OW_KEY?: string;
    INSTANCE_ID?: string;
    RAM_INFO?: string;
    PPTR_VERSION?: string;
    LATEST_VERSION?: boolean;
    CLI?: boolean;
    ACC_TYPE?: 'PERSONAL' | 'BUSINESS';
}
export interface HealthCheck {
    queuedMessages?: number;
    state?: STATE;
    isPhoneDisconnected?: boolean;
    isHere?: boolean;
    wapiInjected?: boolean;
    online?: boolean;
    tryingToReachPhone?: boolean;
    retryingIn?: number;
    batteryLow?: boolean;
}
//# sourceMappingURL=sessionInfo.d.ts.map