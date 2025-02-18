import siteConfig from '@generated/docusaurus.config';
import Tracker from '@openreplay/tracker';

const OPENREPLAY_SESSION_COOKIE = 'openReplaySessionHash';
const OPENREPLAY_INGEST_POINT = siteConfig.customFields.openReplayIngestPoint as string;
const OPENREPLAY_PROJECT_KEY = siteConfig.customFields.openReplayProjectKey as string;

let tracker: Tracker | null = null;

export const initOpenReplay = async () => {
    const { default: Tracker } = await import('@openreplay/tracker');
    tracker = new Tracker({
        projectKey: OPENREPLAY_PROJECT_KEY,
        ingestPoint: OPENREPLAY_INGEST_POINT,
        __DISABLE_SECURE_MODE: true,
    });
};

export const startOpenReplayTracking = (userId?: string) => {
    if (tracker) {
        const cookies = document.cookie.split('; ');
        const cookie = cookies.find(c => c.startsWith(`${OPENREPLAY_SESSION_COOKIE}=`));
        const existingSessionHash = cookie ? cookie.split('=')[1] : null;

        if (existingSessionHash) {
            // Resume existing session
            tracker.start({ sessionHash: existingSessionHash });
        } else {
            // Start a new session
            tracker.start();
            const newSessionHash = tracker.getSessionToken();
            if (newSessionHash) {
                document.cookie = `${OPENREPLAY_SESSION_COOKIE}=${newSessionHash};`;
            }
        }

        // Set the user ID in both cases
        tracker.setUserID(userId);
    } else {
        console.warn('OpenReplay tracker is not initialized');
    }
};

export const optOutOpenReplayTracking = () => {
    if (tracker) {
        tracker.stop();
    }
}   