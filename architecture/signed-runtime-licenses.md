# Signed OpenWA runtime licenses

New uppercase `OWA_XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX` keys use the v1 signed
runtime protocol at `https://api.openwa.cloud/api/license-runtime`. Existing
Gumroad keys continue to use `https://funcs.openwa.dev/license-check`.

The production endpoint is a deployment target; this change does not deploy the
server or publish an SDK release. Its pinned Ed25519 public identity is
`4cJOW9G-NQBFMPfmP-bWcRKmiNSzlqpvv5h_6nAOTk0`. No private key or readable private
browser implementation is included in this public repository.

The SDK authorizes after recovering the authenticated phone identity. It verifies
the signed payload's trust identity, audience, environment, credential digest,
exact phone, session, nonce and bounded expiry before downloading anything. All
required content hashes and byte lengths must match before injection. An `OWA_`
request never falls back to Gumroad or local metadata when authorization fails.
The existing metadata-only status is used only for the pre-authentication pending
step; checking that pending artifact before recovering the phone is a failure.

Installation preserves common patches → licensed artifacts → deferred init/freeze.
Every catalogued method must be installed by the prepared sequence, rather than
merely present from an earlier runtime. New or replaced WAPI functions check the
lease and exact host on each invocation. The SDK renews online at most once a
minute, disables licensed calls on failure, and clears its timer during shutdown.
The five-minute lease is the maximum authorization window if the Node host stops
renewing. Changed capabilities or release selection require restarting the session;
this does not implement live code replacement or migrate existing Gumroad keys.
Context recovery requests fresh authorization before licensed reinstallation and
the deferred init phase.

For local development, configure `runtimeLicense.url` to
`http://localhost:8890/api/license-runtime` and `runtimeLicense.environment` to
`development`. A different deployment's public SPKI identity must be pinned by
the operator through `runtimeLicense.publicKey`; server-returned trust keys are
never adopted. Core callers use the same settings at `licenseConfig.runtime`.

The counterpart is `smashah/open-wa-backoffice` PR #23. Source implementation,
private preparation, SDK publication, actual WhatsApp installation and production
acceptance are separate outcomes. No tests, builds or live WhatsApp sessions were
run for this source change.
