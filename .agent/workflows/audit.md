---
description: Audit the codebase for quality issues, security risks, and improvement opportunities
---

# /audit — Codebase Audit

Run this workflow to perform a comprehensive audit of the project. The output is a prioritized report of findings.

## Steps

1. **Run /init first**
   - If not already done in this session, run the `/init` workflow to load full project context.

2. **Check for hardcoded values**
   - Search for magic numbers (e.g. `50000`, hardcoded fee amounts) that should come from `settings.monthly_fee`.
   - Search for hardcoded strings that should be constants.

3. **Audit error handling**
   - Review all API route handlers (`app/api/*/route.ts`) for proper try-catch and error responses.
   - Review all client-side fetch calls for missing `.catch()` or error toast notifications.
   - Cross-reference with `improvement.md` HIGH priority items.

4. **Audit loading & submission states**
   - Check forms and buttons for missing `disabled` states during API calls.
   - Look for potential double-submission issues.

5. **Audit form validation**
   - Check if forms validate inputs before submit (empty names, negative amounts, invalid dates).
   - Note whether `zod` + `react-hook-form` are used consistently.

6. **Audit security**
   - Review `.env` for any accidentally committed secrets (note: `.env` should be in `.gitignore`).
   - Check RLS policies in `db.sql` for gaps (e.g. tables missing policies).
   - Check API routes for proper auth checks if applicable.

7. **Audit code organization**
   - Check for missing barrel exports (`index.ts`) in component folders.
   - Look for duplicate code that should be extracted into shared components/utilities.
   - Cross-reference with `optimize.md` pending items.

8. **Audit TypeScript quality**
   - Search for `any` types that should be properly typed.
   - Check for missing type definitions in `types/`.

9. **Audit database consistency**
   - Compare `db.sql` with `prisma/schema.prisma` for drift.
   - Check for missing indexes on frequently queried columns.

10. **Generate audit report**
    - Create/update `audit-report.md` in the project root with findings.
    - Organize by priority: 🔴 Critical → 🟡 Medium → 🟢 Low.
    - Include file paths and specific line numbers for each finding.
    - Suggest fixes for each issue.

## Report Format

```markdown
# Audit Report — [DATE]

## 🔴 Critical
- [ ] **[Issue Title]** — `file.tsx:L42` — Description and fix suggestion

## 🟡 Medium
- [ ] **[Issue Title]** — `file.tsx:L42` — Description and fix suggestion

## 🟢 Low
- [ ] **[Issue Title]** — `file.tsx:L42` — Description and fix suggestion

## Summary Table
| Priority | Count | Category |
|----------|-------|----------|
| 🔴 | N | ... |
| 🟡 | N | ... |
| 🟢 | N | ... |
```
