# Architecture and operational notes

HTTP dashboard/API -> SQLite queue -> single worker -> configured chat completion endpoint -> strict JSON tool policy -> result or approval -> persisted task record.

The agent selects tools by producing a strict JSON action. The worker checks the tool and argument schema, runs only allowed reads, and pauses note writes until explicit approval. Approved writes and task requeue are atomic. Task history survives restart; interrupted running tasks fail rather than replay. One process per SQLite file is required.

Model response errors fail the task without exposing raw provider errors. This initial implementation uses non-streaming inference and no external actions. SQLite stores user content in plaintext. For hosted production, replace the single-host trust model with tenant-aware access control and isolated job execution.

Free default: local Ollama, Python standard library, SQLite, browser UI, GitHub Actions subject to GitHub quotas. No cloud account or API key required. Hardware and electricity are operator costs. Model licenses vary.
