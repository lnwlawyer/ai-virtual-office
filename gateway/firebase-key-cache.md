# Firebase certificate retrieval (not integrated)

The cache scaffold fetches Firebase Secure Token **X.509 certificates** from a hard-coded Google endpoint and respects a bounded Cache-Control max-age. No request-supplied key URL is accepted. Failures return null.

**Important:** These certificates are not JWKs and cannot be passed directly into `verifyFirebaseIdToken`. Certificate-to-CryptoKey conversion, signature verification integration, key rotation concurrency, authorization and revocation checks are still required. The Worker remains disabled and does not invoke this module. Do not deploy or enable AI execution based on this scaffold.
