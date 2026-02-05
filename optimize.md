# Optimization Recommendations

Sorted by priority (highest first).

---

## 1. ✅ COMPLETED: Remove Duplicate `use-toast.ts`

**Status:** ✅ Done (2026-02-02)

**What was done:**
- Deleted `components/ui/use-toast.ts`
- Verified all imports already used `@/hooks/use-toast`
- Only one `use-toast.ts` now exists at `hooks/use-toast.ts`

**Files deleted:**
- `components/ui/use-toast.ts`

---

## 2. ✅ COMPLETED: Extract Reusable `<AnalyticCard>` Component

**Status:** ✅ Done (2026-02-02)

**What was done:**
- Created `components/ui/analytic-card.tsx` with color variants (slate, emerald, rose, blue, amber)
- Supports loading state with skeleton, currency formatting, custom value colors
- Refactored `components/finances/finances-analytic-cards.tsx` (reduced from 93 → 65 lines)

**Files created:**
- `components/ui/analytic-card.tsx`

**Files refactored:**
- `components/finances/finances-analytic-cards.tsx`

---

## 3. ✅ COMPLETED: Extract `<DeleteConfirmDialog>` Component

**Status:** ✅ Done (2026-02-02)

**What was done:**
- Created `components/ui/delete-confirm-dialog.tsx` with loading state and customizable text
- Refactored `components/finances/finances-page.tsx` to use the new component

**Files created:**
- `components/ui/delete-confirm-dialog.tsx`

**Files refactored:**
- `components/finances/finances-page.tsx`

---

## 4. LOW: Create Date Helper Utilities

**Issue:** Repeated `new Date().getMonth() + 1` and `new Date().getFullYear()` calls.

**Fix:** Create `utils/date-helpers.ts`:
```ts
export const getCurrentMonth = () => new Date().getMonth() + 1
export const getCurrentYear = () => new Date().getFullYear()
export const formatDateID = (date: Date) => date.toLocaleDateString("id-ID")
```

---

## 5. LOW: Extract `<FilterModal>` Component

**Files affected:**
- `components/finances/finances-page.tsx`
- `components/dashboard/payment-table.tsx`

**Issue:** Both have similar year/month filter dropdowns pattern.

**Fix:** Create reusable filter modal with year and month range selectors.

---

## 6. LOW: Extract `<ExportButtonGroup>` Component

**Files affected:**
- `components/finances/finances-page.tsx`
- `components/dashboard/payment-table.tsx`

**Issue:** Both have "Export Semua" and "Export Filter" button patterns.

**Fix:** Create component that accepts export handlers as props.

---

## Summary

| Priority | Item | Status |
|----------|------|--------|
| ✅ HIGH | Remove duplicate use-toast | ✅ Done |
| ✅ MEDIUM | AnalyticCard component | ✅ Done |
| ✅ MEDIUM | DeleteConfirmDialog | ✅ Done |
| 🔵 LOW | Date helpers | Pending |
| 🔵 LOW | FilterModal | Pending |
| 🔵 LOW | ExportButtonGroup | Pending |

