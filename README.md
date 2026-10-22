# AI Virtual Office

Secure multi-provider AI workspace foundation. Initial prototype only; no paid APIs or production deployment enabled.

## Development

Run `npm install`, `npm test`, and `npm run build`.

Budget target: THB 500/month. No billing is configured.

## Optional Google sign-in setup (no paid services)

1. Use the dedicated Firebase project `ai-virtual-office-96157`. Enable Google under Authentication > Sign-in method.
2. Add the exact GitHub Pages host `lnwlawyer.github.io` under Authentication > Settings > Authorized domains.
3. Configure only browser-safe `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID` for the build. Do not commit personal keys or secrets. Never put AI provider keys in `VITE_` variables.
4. After an authorized deployment, verify Google login, logout, unverified-account handling, and project isolation manually. CI tests validate only the session-policy contract, not a real Google login.

The frontend login state is informational. Admin actions, document writes, and AI requests must remain disabled until an authenticated backend validates Firebase ID tokens and enforces authorization. No Firestore access, production writes, paid AI gateway, or billing is configured.
