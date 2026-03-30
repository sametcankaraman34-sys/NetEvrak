# Faz 1 - Teknik Temel Baseline

Bu dokuman Faz 1 teknik temelinin uygulanan kararlarini sabitler.

## Kararlar

- Mimari: monorepo yapisi (`apps/*`, `packages/*`)
- Frontend + Backend: Next.js App Router + API routes
- ORM: Prisma
- Queue: `QUEUE_PROVIDER=in_memory` (MVP local)
- Storage: `STORAGE_PROVIDER=local` (MVP local)
- Monitoring: `ERROR_MONITOR_PROVIDER=console` (MVP local)

## Local Calisma

- `pnpm install`
- `pnpm dev`
- Web: `http://localhost:3000`

## Faz 1 Kriter Durumu

- Proje ayaga kalkiyor: tamam
- DB semasi var: tamam
- Upload pipeline hazir: tamam
- Async job yapisi hazir: tamam (in-memory)
- Env yapisi: tamam
- Lint/format standard dosyalari: tamam (`.editorconfig`, `.prettierrc.json`)

## Sonraki Gelistirme Notu

- Redis/BullMQ ve harici monitoring provider entegrasyonu Faz 2+ planinda ele alinacak.
