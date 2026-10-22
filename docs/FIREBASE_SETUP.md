# Isolated Firebase setup (not executed)

1. Create a new Firebase project for AI Virtual Office; do not reuse Land-KM, LawLand or LandRight projects.
2. Do not enable billing or paid features. Confirm service availability under Spark before proceeding.
3. Register a Web app and copy only public Firebase web config values into local .env.
4. Add authorized domains only when required; keep GitHub Pages deployment disabled for now.
5. Plan Google sign-in and a strict allowlist. Do not enable sign-in until authorization rules and logout tests are implemented.
6. Never trust frontend role flags; backend must verify ID tokens and workspace access.
7. AI provider credentials belong in a separate server-side secret store, never Firebase web config or Vite variables.

Current scaffold does not authenticate users. It intentionally fails closed.
