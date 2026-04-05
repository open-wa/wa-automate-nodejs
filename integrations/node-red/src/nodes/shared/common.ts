/**
 * Shared types that don't require external dependencies.
 * Used by both the editor (browser) and runtime (Node.js) builds.
 */

export const CLIENT_STORE = "waClients"

export interface EasyAPIServer {
    /**
     * The URL of the EASY API instance
     */
    url: string,
    /**
     * The API Key for the instance
     */
    key: string
  }
  

  export interface ServerSubscriber {
    server: string
  }
