# AI gateway rollout (no paid calls yet)

The static GitHub Pages app must never store AI provider keys or call paid provider APIs directly.

## Stage 1 — local mock (this PR)
- Versioned request/response contract and seven simulated agent roles.
- Deterministic local response, no network requests, no secrets, zero cost.
- Unit tests for input validation and response shape.

## Stage 2 — secure Cloudflare Worker (future, separately reviewed)
- Implement POST /api/ai with server-side provider credentials stored as Worker secrets.
- Require verified authentication and enforce allowlist/CORS, per-user rate limits, body-size limits and a server-side spend ceiling.
- Reject requests by default until authorization and quotas are configured.
- Use no production Firebase writes without separate authorization.

## Stage 3 — opt-in live provider (future)
- Start with one provider, a small explicit spending cap, usage logs excluding sensitive prompts, and a manual enable/disable switch.
- Verify failure handling, timeouts, abuse protection and no secret leakage before any live paid request.
