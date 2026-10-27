# Cloudflare Worker gateway scaffold

This folder is a **non-deployed, deny-by-default** template. Do not deploy or add public routes until authentication, rate limits, provider allowlisting, spending limits and monitoring have been reviewed.

- POST /api/ai returns 503 GATEWAY_DISABLED.
- All other routes return 404; other methods on /api/ai return 405.
- No upstream requests, provider credentials, Firebase access, persistent data or billable AI calls.
- workers_dev=false deliberately prevents accidental public workers.dev deployment.
- A future phase must require verified auth and explicit opt-in before any provider call.
