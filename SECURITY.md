# Security and deployment boundaries

CHINGU 0.1 is a single-operator engineering preview. Bind only to loopback. Never expose its HTTP server to the internet or share its token. The local host and database are trusted; other OS users with file access can inspect SQLite data. Use OS file permissions and disk encryption. Run one process per database. Do not put sensitive information in prompts or notes. Model providers receive prompt context; local inference is recommended.

Controls: bearer token, Host and Origin checks, no CORS, bounded request/response sizes, constrained tool arguments, no shell or browser execution, explicit note-write approval, SQLite transactions, finite agent step budget. Model output is untrusted; UI uses text nodes, not injected HTML. Tool result instructions are treated as untrusted but prompt injection remains possible. Human approval is not a complete defense.

Not implemented: TLS termination, multi-tenant authentication, encrypted database, per-user authorization, distributed queue, automated deletion, rate limiting for public access, integration credential vault, external-action sandbox, independent security audit. These are prerequisites for a public SaaS offering.

Report issues privately to the repository owner using a private vulnerability report if enabled; do not publish secrets in issues.
