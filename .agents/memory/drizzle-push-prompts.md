---
name: Drizzle schema push prompts
description: Handle Drizzle PostgreSQL schema pushes that stop for interactive prompts in non-TTY workspace commands.
---

`drizzle-kit push --force` may still stop for a TTY when it encounters a named-schema conflict. Do not assume the schema was applied just because the database connection succeeded; verify the development schema before continuing. Production schema changes must go through Publish, not direct SQL or startup migrations.

**Why:** In this workspace, both the regular push and `push-force` stopped at an interactive schema-conflict prompt in the non-interactive shell.

**How to apply:** If a future development push stops this way, inspect the reported conflict and verify intended table/column state before choosing a development-only recovery. Never apply this workaround to production.
