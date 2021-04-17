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
  OW_KEY?: string;
  INSTANCE_ID?: string;
}

export interface HealthCheck {
  /**
   * The number of messages queued up in the browser. Messages can start being queued up due to the web app awaiting a connection with the host device.
   * 
   * Healthy: 0
   */
  queuedMessages?: number;
  /**
   * The state of the web app.
   * 
   * Healthy: 'CONNECTED'
   */
  state?: STATE;
  /**
   * Whether or not the "Phone is disconnected" message is showing within the web app.
   * 
   * Healthy: `false`
   */
  isPhoneDisconnected?: boolean;
  /**
   * Returns `true` if "Use Here" button is not detected
   * 
   * Healthy: `true`
   */
  isHere?: boolean;
  /**
   * Returns `true` if the `WAPI` object is detected.
   * 
   * Healthy: `true`
   */
  wapiInjected?: boolean;
  /**
   * Result of `window.navigator.onLine`
   * 
   * Healthy: `true`
   */
  online?: boolean;
  /**
   * Returns `true` if "trying to reach phone" dialog is detected
   * 
   * Healthy: `false`
   */
  tryingToReachPhone?: boolean;
  /**
   * Returns the number of seconds the "Retrying in ..." dialog is indicating. If the dialog is not showing, it will return `0`.
   * 
   * Healthy: `0`
   */
  retryingIn?: number;
  /**
   * Returns `true` if "Phone battery low" message is detected
   * 
   * Healthy: `false`
   */
   batteryLow ?: boolean;
}
