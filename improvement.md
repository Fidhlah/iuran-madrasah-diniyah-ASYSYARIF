# Improvement Checklist

Senior programmer recommendations, sorted by priority.

---

## 🔴 HIGH PRIORITY

- [ ] **Error Handling** — Add user-friendly error toasts to all API calls
  - Files: `student-management.tsx`, `finances-page.tsx`, `payment-table.tsx`
  - Pattern: `catch (err) { toast({ title: "Gagal", variant: "destructive" }) }`

- [ ] **Loading States** — Disable buttons during API calls to prevent double-submission
  - Files: `finances-form-modal.tsx`, `payment-table.tsx`

---

## 🟡 MEDIUM PRIORITY

- [ ] **Form Validation** — Validate inputs before submit (empty names, negative amounts)
  - Consider using `zod` + `react-hook-form`
  - Files: All form modals

- [ ] **Magic Numbers** — Move default fee `50000` to settings only
  - Currently hardcoded in multiple places
  - Should only come from `settings.monthly_fee`

- [ ] **Consistent Barrel Exports** — Add `index.ts` to all component folders
  - Missing: `components/dashboard/index.ts`, `components/students/index.ts`
  - Existing: `components/finances/index.ts`

---

## 🟢 LOW PRIORITY

- [ ] **Unit Tests** — Add tests for utility functions
  - Create `__tests__/` folder
  - Start with: `utils/export-excel.ts`, `utils/months.ts`

- [ ] **Constants File** — Create `constants.ts` for app-wide defaults
  - Toast duration, default fee, year ranges, etc.

---

## Summary

| Priority | Item | Impact |
|----------|------|--------|
| 🔴 HIGH | Error handling | User experience |
| 🔴 HIGH | Loading states | Prevents bugs |
| 🟡 MEDIUM | Form validation | Data quality |
| 🟡 MEDIUM | Magic numbers | Maintainability |
| 🟡 MEDIUM | Barrel exports | Code organization |
| 🟢 LOW | Unit tests | Long-term stability |
| 🟢 LOW | Constants file | Maintainability |
