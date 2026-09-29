import packageMetadata from '../package.json' with { type: 'json' };

/** Version of the API package running the Easy API server. */
export const API_VERSION = packageMetadata.version;
