# Tabungan Feature - File Reference

> ⚠️ **FEATURE STATUS: DISABLED VIA FEATURE FLAG**
> 
> This feature is controlled by environment variable:
> ```
> NEXT_PUBLIC_FEATURE_TABUNGAN=true   # Enable feature
> NEXT_PUBLIC_FEATURE_TABUNGAN=false  # Disable feature (or don't set)
> ```
> 
> To enable: Add `NEXT_PUBLIC_FEATURE_TABUNGAN=true` in Vercel Environment Variables

---

## 📁 Core Files (Tabungan-Specific)

These files are **exclusively** for the tabungan feature:

### Pages
| File | Purpose |
|------|---------|
| `app/tabungan/page.tsx` | Main tabungan page route |

### Components
| File | Purpose |
|------|---------|
| `components/tabungan/tabungan-page.tsx` | Main tabungan page component |
| `components/tabungan/tabungan-rekap-table.tsx` | Rekap/summary table |
| `components/tabungan/tabungan-transaksi-table.tsx` | Transaction history table |
| `components/tabungan/tabungan-transaksi-modal.tsx` | Add transaction modal |
| `components/tabungan/tabungan-filter.tsx` | Filter controls |
| `components/tabungan/tabungan-analytic-cards.tsx` | Analytics/stats cards |

### API Routes
| File | Purpose |
|------|---------|
| `app/api/tabungan/route.ts` | GET/POST tabungan rekap data |
| `app/api/tabungan-transaksi/route.ts` | GET/POST tabungan transactions |

### Hooks
| File | Purpose |
|------|---------|
| `hooks/swr-use-tabungan.ts` | SWR hook for fetching tabungan data |
| `hooks/swr-use-tabungan-transaksi.ts` | SWR hook for fetching transactions |

---

## 📁 Shared Files (Contains Tabungan References)

These files contain tabungan code but are **shared with other features**. Be careful when editing:

### Database/Types
| File | What it contains |
|------|------------------|
| `prisma/schema.prisma` | `tabungan` and `tabungan_transaksi` table definitions |
| `types/models.ts` | `Tabungan` and `TabunganTransaksi` TypeScript types |
| `db.sql` | SQL for creating tabungan tables |

### Subscription & Navigation
| File | What it contains |
|------|------------------|
| `hooks/use-supabase-subscription.ts` | Realtime subscriptions for `tabungan` and `tabungan_transaksi` tables |
| `components/layout/navbar.tsx` | Navigation link to `/tabungan` |

### Student Feature (Cascade Relationship)
| File | What it contains |
|------|------------------|
| `app/api/students/route.ts` | May reference tabungan for cascade operations |
| `app/api/students/[id]/route.ts` | May reference tabungan for cascade delete |
| `components/students/student-management.tsx` | May show tabungan summary |

---

## 📁 Directory Structure

```
iuran-asysyarif/
├── app/
│   ├── tabungan/                      # ← TABUNGAN PAGE
│   │   └── page.tsx
│   └── api/
│       ├── tabungan/                  # ← TABUNGAN API
│       │   └── route.ts
│       └── tabungan-transaksi/        # ← TRANSAKSI API
│           └── route.ts
├── components/
│   └── tabungan/                      # ← ALL TABUNGAN COMPONENTS
│       ├── tabungan-page.tsx
│       ├── tabungan-rekap-table.tsx
│       ├── tabungan-transaksi-table.tsx
│       ├── tabungan-transaksi-modal.tsx
│       ├── tabungan-filter.tsx
│       └── tabungan-analytic-cards.tsx
├── hooks/
│   ├── swr-use-tabungan.ts            # ← TABUNGAN HOOK
│   ├── swr-use-tabungan-transaksi.ts  # ← TRANSAKSI HOOK
│   └── use-supabase-subscription.ts   # (shared, has tabungan code)
├── prisma/
│   └── schema.prisma                  # (shared, has tabungan tables)
└── types/
    └── models.ts                      # (shared, has tabungan types)
```

---

## 🔗 Database Relations

```
students (1) ─────┬───── (N) tabungan
                  │
                  └───── (N) tabungan_transaksi
```

Both `tabungan` and `tabungan_transaksi` have `ON DELETE CASCADE` from `students`.

---

*Last updated: 2026-02-01*
