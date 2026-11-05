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

## Local Agent Bridge foundation (PR #109)

This is an **opt-in, localhost-only, data-only prototype**, not a remote terminal or an AI connection. It does not execute commands, open a shell, access files, or connect to Claude/Gemini/ChatGPT. The public GitHub Pages preview remains simulated.

On a trusted local computer, set a unique secret of at least 32 characters in the `LOCAL_BRIDGE_TOKEN` environment variable, then run `node local-bridge/server.js`. The server binds only to `127.0.0.1:8765` by default. Do not publish this port, expose it through a tunnel, or put the token in browser code, a GitHub secret exposed to the frontend, or a public `VITE_` variable.

The protocol requires `Authorization: Bearer <token>` and rejects cross-origin browser requests. `GET /v1/health` reports readiness; `POST /v1/jobs` queues a validated `{version:1,agentRole,prompt}` request; `GET /v1/jobs` lists status; `GET /v1/jobs/:id` reads a job; `POST /v1/jobs/:id/result` manually records `{status:"completed"|"failed",content}`. All state is ephemeral, held in memory, with a maximum queue of 100 jobs. A process restart clears it. The API is deliberately not wired into the public web chat until a secure, user-authorized local pairing and approval design is implemented and reviewed.

Run `npm test` and `npm run build` to validate the bridge alongside the existing application.

## Local bridge approval/operator (PR #110)

Jobs now start as `awaiting_approval`. They cannot be completed until an explicit `POST /v1/jobs/:id/decision` with `{"decision":"approve"}`. A rejected job is terminal. The same endpoint accepts `{"decision":"reject"}`; duplicate decisions and result submissions are rejected.

On the **same trusted computer** as the bridge, start the server with `LOCAL_BRIDGE_TOKEN` set to a unique 32+ character value. Run `node local-bridge/operator.js` in another terminal with the same environment variable. The operator displays queued prompts, asks for approval, and lets you paste a manually obtained text result. It never starts processes, executes user prompts as shell commands, or invokes AI providers. No token is printed. Never expose the bridge port or token publicly. The operator and bridge are intended only for a trusted local user; do not run with untrusted local accounts.

The public GitHub Pages chat remains a **simulation**; local pairing, per-agent credentials, persistent audit logs and real terminal integration are not yet implemented.

## Persistent local bridge state (PR #111)

Set `LOCAL_BRIDGE_STORAGE_PATH` to a private local JSON file path to enable opt-in persistence across restarts. Without it, jobs remain in memory as before. The bridge stores a maximum of 100 jobs using atomic replacement and restrictive file permissions where supported. An invalid/corrupt state file prevents startup instead of silently discarding pending approvals. Keep the state file outside web roots, synced public folders, and the Git repository; it contains prompts and results. Back it up and protect it as sensitive data. This is a state snapshot, **not** a tamper-evident audit log. Concurrent bridge processes must not share a storage path. Local operator approval is still required, and no shell commands are executed.

## Local bridge status overview (PR #112)

The authenticated local-only `GET /v1/status` endpoint reports queue totals, per-role job counts and recent job metadata. It deliberately excludes prompts, results and the bridge token. `connectedDevices: 0`, `connection: "not_connected"` and `execution: "manual_only"` accurately reflect the current implementation: no remote agent, Windows terminal, Mac mini or public web dashboard is connected yet. The existing local operator still performs manual approvals. Use this endpoint only on the trusted loopback host with the private bearer token. Future device presence and remote pairing require a separate security review.

## Agent Control Room: bridge status report (PR #113)

The public frontend displays a **read-only, manually pasted** JSON report from the authenticated local `GET /v1/status` endpoint. The page validates and sanitizes the report before rendering counts, per-agent queues and recent job IDs. No token, prompts or results should be pasted. This is a snapshot, **not** live presence or machine pairing. Windows 11 and Mac mini remain disconnected. The browser does not call localhost, store the bearer token, or execute commands. Obtain the report using a trusted local client that keeps the token private; never share the token or full job payload.
