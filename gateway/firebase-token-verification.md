# Offline Firebase ID token verification helper

`firebase-id-token.js` exports `verifyFirebaseIdToken(token,{projectId,publicKeys,now})`.
It checks an RS256 signature using a **trusted, caller-supplied** RSA JWK, the Firebase issuer/audience, subject and time claims. It returns only a minimal verified user snapshot or null.

**Not yet connected to the Worker route.** The gateway remains disabled (503) regardless of token. No JWKS fetching, key rotation, cache validation, Firebase Admin SDK, user revocation checks, per-user quotas, or deployment are implemented. Before integration, fetch public keys from a fixed trusted Firebase/Google endpoint, enforce key refresh/expiry and validate any additional authorization rules. Never accept JWKs, key URLs, issuer or project ID from untrusted request input.
