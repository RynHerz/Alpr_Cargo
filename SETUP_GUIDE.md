# Panduan Setup ALPR Cargo AI — Monorepo (Frontend + Backend)

Struktur ini menghubungkan frontend Next.js kamu (yang sudah ada) dengan
backend baru, dalam satu repo Git.

## Struktur Folder

```
alpr-cargo-ai/
├── apps/
│   ├── web/              <- pindahkan isi project Next.js kamu ke sini
│   └── api/               <- backend Express + Prisma (sudah disiapkan)
├── packages/
│   └── shared-types/      <- types.ts sudah disalin ke sini
├── .github/workflows/
│   └── ci.yml              <- CI/CD otomatis
├── package.json
└── pnpm-workspace.yaml
```

## Langkah 1 — Pindahkan Frontend

1. Copy seluruh isi folder `DeteksiPlatKendaraan/` (KECUALI `node_modules` dan
   `tsconfig.tsbuildinfo`) ke `alpr-cargo-ai/apps/web/`.
2. Rename `"name"` di `apps/web/package.json` jadi `"web"`.
3. Hapus `src/lib/alpr/types.ts` di frontend, lalu ganti semua
   `import { DetectionResult, WhitelistRule } from '../lib/alpr/types'`
   menjadi `import { DetectionResult, WhitelistRule } from '@alpr/shared-types'`.
4. Tambahkan `"@alpr/shared-types": "workspace:*"` ke dependencies
   `apps/web/package.json`.

## Langkah 2 — Install pnpm (kalau belum ada)

```bash
npm install -g pnpm
```

## Langkah 3 — Install Semua Dependency Sekaligus

Dari root `alpr-cargo-ai/`:

```bash
pnpm install
```

Ini otomatis install dependency frontend + backend + shared-types sekaligus,
dan otomatis nge-link `@alpr/shared-types` antar keduanya.

## Langkah 4 — Setup Database Backend

```bash
cd apps/api
cp .env.example .env
pnpm prisma:migrate   # bikin database SQLite lokal + tabel
pnpm prisma:generate
```

## Langkah 5 — Jalankan Dev Server (2 terminal)

Terminal 1 (backend):
```bash
pnpm dev:api
# jalan di http://localhost:4000
```

Terminal 2 (frontend):
```bash
pnpm dev:web
# jalan di http://localhost:3001
```

## Langkah 6 — Ganti localStorage ke API di Frontend

Di `apps/web/src/app/page.tsx`, ganti bagian yang pakai `localStorage`:

**Sebelum:**
```ts
localStorage.setItem('alpr_history', JSON.stringify(newHistory));
```

**Sesudah:**
```ts
await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/detections`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(result),
});
```

Tambahkan `apps/web/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Lakukan hal yang sama untuk `alpr_whitelist` -> endpoint `/api/whitelist`.

## Langkah 7 — Push ke GitHub

```bash
cd alpr-cargo-ai
git init
git add .
git commit -m "chore: setup monorepo frontend + backend"
git remote add origin <url-repo-github-kamu>
git push -u origin main
```

Setelah push, CI/CD di `.github/workflows/ci.yml` otomatis jalan:
lint & build frontend, generate Prisma client, build backend.

## Langkah 8 — Deploy

- **Frontend** -> Vercel, set root directory ke `apps/web`
- **Backend** -> Railway / Render, set root directory ke `apps/api`,
  ganti `DATABASE_URL` ke PostgreSQL (bukan SQLite lagi) untuk production
- Update `NEXT_PUBLIC_API_URL` di Vercel env ke URL backend production

## Tentang RAG dan Graph Knowledge Base

Struktur ini **tidak** memakai RAG atau graph knowledge base ("Repo C") karena:
- Hanya 1 repo (monorepo) — hubungan frontend-backend sudah otomatis lewat
  `packages/shared-types`, tidak perlu graph terpisah untuk melacaknya.
- Tidak ada fitur tanya-jawab berbasis dokumen — RAG baru relevan kalau nanti
  ditambah fitur semacam "chat untuk cari riwayat kendaraan pakai bahasa natural".

Kalau nanti project berkembang jadi banyak service terpisah (misal backend AI
terpisah dari backend data, ditambah mobile app, dsb), baru pola "knowledge
master" relevan dipakai untuk memetakan dependency antar repo.
