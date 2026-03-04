---
description: Initialize agent context — read all essential project files to understand the codebase
---

# /init — Project Onboarding

Run this workflow at the start of every new conversation so the agent fully understands the codebase before making any changes.

## Steps

1. **Read project context**
   - Read `PROJECT_CONTEXT.md` for overview, tech stack, folder structure, DB schema, and key patterns.

2. **Read database schema**
   - Read `db.sql` for the full Supabase PostgreSQL schema (tables, RLS policies, functions, triggers, realtime config).

3. **Read Prisma schema**
   - Read `prisma/schema.prisma` for the ORM model definitions and relations.

4. **Read environment config**
   - Read `.env` to understand required env vars: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, feature flags like `NEXT_PUBLIC_FEATURE_TABUNGAN`.

5. **Read improvement checklist**
   - Read `improvement.md` for known issues and priorities (error handling, loading states, form validation, etc).

6. **Read optimization notes**
   - Read `optimize.md` for completed and pending refactoring tasks.

7. **Scan folder structure**
   - List root directory, `app/`, `components/`, `hooks/`, `lib/`, `utils/`, and `types/` to understand the full layout.

8. **Read package.json**
   - Review dependencies and scripts (`dev`, `build`, `lint`, `postinstall`).

9. **Confirm ready**
   - Summarize what was learned and confirm readiness to the user. Mention any issues found (e.g. missing files, outdated info).

## Notes

- UI language is **Bahasa Indonesia**.
- Always match existing patterns when adding features (SWR hooks, API routes, component structure).
- Mobile-first responsive design is a priority.
- DRY & modular code is expected.
