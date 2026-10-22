# Authentication and Provider Integration Plan

## Current state
No Firebase Authentication, provider API, backend, secrets, or paid services are configured. UI is a static prototype only. All adapters fail closed.

## Next implementation gates
1. Choose isolated Firebase project and configure allowed origins, Auth and workspace policies.
2. Implement server-side ID token verification and deny-by-default authorization.
3. Store provider keys in a server-side secret store; never ship keys in GitHub Pages.
4. Implement per-provider adapters with input/output validation, timeouts, audit logs, rate limiting and per-workspace budgets.
5. Enable a single provider in staging after explicit authorization and cost controls are tested.
6. Add image generation and agent tool execution only after approval and sandbox design.

Budget target: THB 500 per month. The target is not a provider-enforced billing cap.
