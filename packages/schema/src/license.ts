import { Schema } from 'effect';

/** Licence access selected by the server, distinct from WhatsApp feature flags. */
export const LicenseFeaturesSchema = Schema.Struct({
  status: Schema.Literals(['valid', 'missing', 'invalid', 'expired', 'metadata_only']),
  keyType: Schema.NullOr(Schema.String),
  expiresAt: Schema.NullOr(Schema.Number),
  features: Schema.Record(Schema.String, Schema.Boolean),
});
export type LicenseFeatures = typeof LicenseFeaturesSchema.Type;
