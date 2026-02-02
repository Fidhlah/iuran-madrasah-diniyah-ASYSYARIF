# Sistem Iuran Madrasah Diniyah As-Syarif

## Overview
Web app untuk manajemen keuangan Madrasah Diniyah (sekolah agama), mencakup:
- **Iuran** — Tracking pembayaran iuran bulanan santri
- **Tabungan** — Sistem tabungan santri dengan debit/kredit
- **Keuangan** — Laporan keuangan manual + sinkronisasi dari pembayaran

## Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: Supabase PostgreSQL + Realtime subscriptions
- **Data Fetching**: SWR with real-time sync

## Project Structure
```
app/
├── api/
│   ├── students/route.ts    # Student CRUD
│   ├── payments/route.ts    # Payment tracking
│   ├── tabungan/route.ts    # Tabungan balance
│   ├── tabungan-transaksi/route.ts  # Tabungan transactions
│   ├── finances/route.ts    # Finance entries
│   └── settings/route.ts    # App settings (monthly fee)
├── page.tsx                 # Dashboard (iuran)
├── students/page.tsx        # Student management
├── tabungan/page.tsx        # Tabungan feature
└── finances/page.tsx        # Finance feature

components/
├── dashboard/               # Payment table, analytics cards
├── students/                # Student management, detail view
├── tabungan/                # Tabungan page, forms, tables
├── finances/                # Finance page, forms, tables
├── layout/                  # Navbar, main layout
└── ui/                      # shadcn/ui components

hooks/
├── swr-use-students.ts      # SWR hook for students
├── swr-use-payments.ts      # SWR hook for payments
├── swr-use-tabungan.ts      # SWR hook for tabungan balances
├── swr-use-tabungan-transaksi.ts  # SWR hook for transactions
├── swr-use-finances.ts      # SWR hook for finances
├── swr-use-settings.ts      # SWR hook for settings
└── use-supabase-subscription.ts   # Realtime subscriptions

utils/
├── export-excel.ts          # Excel export utilities
├── months.ts                # Month constants
└── class-order.ts           # Class ordering (PAUD, TK, 1, 2)
```

## Database Schema (Prisma)
```
students        — id, name, class, year_enrolled, status, has_tabungan
payments        — id, student_id, month, year, amount, is_paid, paid_at
tabungan        — id, student_id, balance
tabungan_transaksi — id, tabungan_id, type (debit/kredit), amount, description, date
finances        — id, date, type (income/expense), amount, description, payment_id (nullable)
settings        — id, monthly_fee
```

## Key Patterns
1. **SWR + Realtime**: Each hook fetches data via SWR, and `use-supabase-subscription.ts` listens to table changes and calls `mutate()` to revalidate
2. **Fetcher**: Uses shared `lib/fetcher.ts` for consistent error handling
3. **Mobile-first**: Components have mobile filter modals + desktop inline filters
4. **Export Excel**: Reusable functions in `utils/export-excel.ts`

## User Preferences
- Language: Bahasa Indonesia for UI text
- DRY & modular code
- Match existing patterns when adding features
- Mobile responsive is important
