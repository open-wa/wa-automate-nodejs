/**
 * Configuration for the Chatwoot integration plugin.
 */
export interface ChatwootConfig {
  /**
   * The URL of the Chatwoot instance (e.g., "https://app.chatwoot.com/api/v1/accounts/123").
   * If inbox ID is included, that inbox will be used. Otherwise, one will be created/found.
   */
  chatwootUrl: string;

  /**
   * The API access token from your Chatwoot account settings.
   */
  chatwootApiAccessToken: string;

  /**
   * The public API host URL that Chatwoot will use to send webhooks.
   * If not provided, will be constructed from host + port.
   */
  apiHost?: string;

  /**
   * The host address for webhook callbacks.
   */
  host?: string;

  /**
   * Whether to use HTTPS for webhook callbacks.
   */
  https?: boolean;

  /**
   * The port for webhook callbacks.
   */
  port?: number;

  /**
   * API key for securing webhook endpoints.
   */
  apiKey?: string;

  /**
   * Whether to force update the Chatwoot inbox webhook URL on initialization.
   */
  forceUpdateCwWebhook?: boolean;
}
