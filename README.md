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

## GitHub Pages preview (manual release gate)

The `GitHub Pages Preview (manual)` workflow can be started from GitHub Actions only after reviewing the changes. It runs tests and builds before publishing `dist`. GitHub Pages must be configured to use **GitHub Actions** as the deployment source. The preview uses Vite base `/ai-virtual-office/`.

The workflow intentionally supplies **no** Firebase environment variables or AI keys. Consequently Google sign-in remains disabled in this public preview, and no backend or paid AI service is contacted. To test real Google login later, first review the public Firebase browser configuration, authorize the Pages domain in Firebase Authentication, and approve a separate deployment change. Do not place provider API keys or Admin SDK credentials in Actions variables prefixed with `VITE_`.

## CI-gated GitHub Pages release

After this workflow is merged, each successful **push-to-main** Foundation CI run can trigger the `GitHub Pages (CI-gated)` workflow. The release job checks out the exact verified commit SHA, reruns tests and the Vite build, and deploys the static artifact. Failed CI, PR runs and forked runs cannot deploy. The existing manual preview workflow remains available; both deployments share a concurrency group.

**Repository prerequisite:** Settings → Pages → Build and deployment → Source = **GitHub Actions**. GitHub Actions must have permission to publish Pages and the `github-pages` environment must permit the workflow. If this setting is missing, the deployment fails safely without changing Firebase.

**Expected preview URL (only after a successful Pages deployment):** https://lnwlawyer.github.io/ai-virtual-office/

**Release acceptance:** confirm Pages workflow success and opening the URL, navigate all modules, create an in-memory task/output/knowledge entry, export and restore JSON with confirmation, refresh to verify ephemeral data disappears, and verify no Google login, AI API or Firebase data write is enabled in this preview. The presence of CI alone does not prove the public site is deployed.
