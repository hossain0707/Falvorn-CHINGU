# Roadmap

## 0.1 — Local agent foundation
- Six specialist profiles and one bounded worker.
- Real local model adapter, tool validation, note-write approvals and persistent audit events.
- Responsive dashboard, reproducible CI tests.

## 0.2 — Agent execution
- Evaluate Nod upstream at an immutable revision; document license and security implications before adopting.
- Add opt-in isolated browser, read-only connectors and MCP with strict capability scopes.
- Durable schedules, retries, cancellation, idempotency, and integration tests with real models.

## 0.3 — Hosted private beta
- Tenant isolation, proper authentication and authorization, secure secrets management.
- PostgreSQL, durable worker queue, TLS, budgets, rate limits, data retention and export.
- Threat modeling, independent security review, load testing, restore drills.
- No dependency on paid APIs by default; hosted infrastructure still has operating costs.

## 1.0 — Production release
- Publish only after release gates pass. Enterprise SSO, audited policy controls and managed hosting are separate workstreams.
