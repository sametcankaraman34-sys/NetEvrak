# NetEvrak MVP

NetEvrak, belge yukleme -> siniflandirma -> extraction -> checklist -> rapor/export akislarini yoneten bir web MVP projesidir.

## Su Ana Kadar Tamamlanan Fazlar

- Faz 0: Muhasebe belge matrisi ve checklist kurallari tanimlandi.
- Faz 1: Monorepo/Next.js/Prisma tabani, storage/queue/monitoring iskeleti kuruldu.
- Faz 2: Dosya yukleme, dosya dogrulama, otomatik siniflandirma ve belge onizleme eklendi.
- Faz 3: OCR stub extraction, confidence, ham cikti saklama ve manuel alan duzeltme eklendi.
- Faz 4: Profil bazli eksik belge motoru ve deterministik checklist degerlendirme eklendi.
- Faz 5: Dogrulama kurallari (format/tarih/tutarlilik), FAIL/REVIEW ayrimi eklendi.
- Faz 6: Sonuc ekrani, rapor API, Excel/PDF export ve islem gecmisi eklendi.

## Teknik Yapi

- Frontend + Backend: `Next.js App Router` (`apps/web`)
- Veritabani: `Supabase Postgres + Prisma`
- Dogrulama: `Zod`
- Queue: `in_memory` (MVP stub)
- Storage: `Supabase Storage` (varsayilan), `local` (opsiyonel fallback)
- Monitoring: `console` (MVP stub)

## Mevcut API Uclari

- `POST /api/upload`
- `GET /api/checklist/templates/accounting-basic`
- `GET /api/cases/:caseId/checklist`
- `GET /api/cases/:caseId/documents`
- `GET /api/documents/:documentId/preview`
- `GET /api/documents/:documentId/fields`
- `PATCH /api/documents/:documentId/fields`
- `GET /api/cases/:caseId/report`
- `GET /api/cases/:caseId/export/excel`
- `GET /api/cases/:caseId/export/pdf`

## Lokal Calistirma

```bash
pnpm install
pnpm dev
```

Build:

```bash
pnpm build
```

## Environment Degiskenleri

`.env.example` dosyasina gore:

- `DATABASE_URL`
- `STORAGE_PROVIDER`
- `UPLOAD_DIR`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET`
- `QUEUE_PROVIDER`
- `REDIS_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `ERROR_MONITOR_PROVIDER`
- `SENTRY_DSN`

## Backend Tarafinda Neler Lazim (Supabase Altyapisi)

- Supabase proje ayarlari:
  - RLS policyleri, service role gizli yonetimi, storage bucket policy
- Gercek queue:
  - `BullMQ + Redis` ile retry/dlq ve job izleme (Supabase tek basina queue degil)
- Auth/Yetkilendirme:
  - Supabase Auth veya NextAuth ile organization/case bazli yetki
- OCR provider:
  - Gercek provider entegrasyonu (Document AI/Textract/Form Recognizer)
- Validation hardening:
  - Belge tipine gore daha kapsamli is kurallari (regex, tarih, esitlik, capraz alan)
- Audit & log:
  - Kritik aksiyonlarin tam audit trail'i ve maskeleme
- Monitoring:
  - Sentry benzeri hata takibi + temel metrikler
- Test:
  - Upload/checklist/export entegrasyon testleri + fixture dosyalari
- Guvenlik:
  - Rate limit, dosya tarama (antivirus), MIME spoof kontrolu, boyut/sayfa policy
- Operasyon:
  - CI pipeline, migration strategy, backup/restore, ortam ayrimi (dev/stage/prod)

## Kisa Yol Haritasi (Sonraki)

- Faz 7: Pilot test, hata analizi, performans/maliyet optimizasyonu ve production sertlestirme.

