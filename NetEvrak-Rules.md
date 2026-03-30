# Dikey Belge Kontrol Projesi

## 1. Proje Tanımı

**Amaç:** Kullanıcının yüklediği belge setinde eksik evrakları otomatik tespit etmek, alanları çıkarmak ve checklist üzerinden doğrulamak.

**Hedef sektörler (MVP):**

* Muhasebeci
* Hukuk
* Operasyon / backoffice belge kontrol ekipleri

**MVP ana değer önerisi:**

* Dosya yükleme
* Belge türü tespiti
* Alan çıkarma
* Eksik belge uyarısı
* Checklist doğrulama
* PDF / Excel export

---

## 2. Yol Haritası

## Faz 0 — Kapsam Kilidi

**Amaç:** Projeyi büyütmeden MVP sınırlarını netleştirmek.

### Çıktılar

* Tek sektör seçimi
* Desteklenen belge türleri listesi
* Zorunlu alan listesi
* Eksik belge kuralları
* Başarı kriterleri

### Yapılacaklar

1. İlk dikeyi seç: `muhasebe` veya `hukuk`
2. İlk 5–10 belge tipini sabitle
3. Her belge tipi için:

   * belge adı
   * zorunlu alanlar
   * opsiyonel alanlar
   * doğrulama kuralları
   * eksik sayılma koşulu
4. “Eksik evrak” mantığını yazılı hale getir
5. Demo veri seti hazırla

### Faz çıkış kriteri

* Belge matrisi tamamlandı
* Kural listesi onaylandı
* MVP kapsamı dondu

---

## Faz 1 — Teknik Temel

**Amaç:** Cursor ile hızlı geliştirilebilir temiz iskelet kurmak.

### Teknoloji önerisi

* **Frontend:** Next.js
* **Backend:** Next.js API Routes veya NestJS
* **DB:** PostgreSQL
* **ORM:** Prisma
* **Queue:** BullMQ / Redis
* **Storage:** S3 uyumlu storage
* **OCR / Extraction:** Google Document AI, AWS Textract veya Azure Form Recognizer
* **Auth:** NextAuth / Clerk
* **UI:** Tailwind + shadcn/ui
* **Export:** ExcelJS + PDF kit / server-side PDF

### Yapılacaklar

1. Monorepo veya tek repo kararını ver
2. Temel proje kurulumu
3. Lint / format / commit standartları
4. Env yapısı
5. DB şeması
6. Storage bağlantısı
7. Job queue kurulumu
8. Log sistemi
9. Hata izleme

### Faz çıkış kriteri

* Proje ayağa kalkıyor
* DB migration çalışıyor
* Dosya upload pipeline hazır
* Async job yapısı hazır

---

## Faz 2 — Belge Yükleme ve Sınıflandırma

**Amaç:** Kullanıcı dosya yükleyebilsin, sistem belgeyi işleme kuyruğuna alsın.

### Yapılacaklar

1. Tekli / çoklu dosya yükleme
2. Dosya validasyonu

   * pdf, jpg, jpeg, png
   * boyut limiti
   * sayfa limiti
3. Upload sonrası kayıt oluştur
4. İşleme job’ı tetikle
5. Belge türü sınıflandırma
6. Belge önizleme ekranı

### Faz çıkış kriteri

* Kullanıcı dosya yükleyebiliyor
* Her dosya işleme durumuna sahip
* Belge türü tahmini yapılabiliyor

---

## Faz 3 — OCR ve Alan Çıkarma

**Amaç:** Belgeden gerekli alanları çıkar.

### Yapılacaklar

1. OCR entegrasyonu
2. Alan mapping katmanı oluştur
3. Her belge tipi için extractor yaz
4. Confidence score sakla
5. Manuel düzeltme alanı ekle
6. Ham OCR çıktısını audit için sakla

### Faz çıkış kriteri

* Seçili belge tiplerinde temel alanlar çıkıyor
* Confidence düşükse işaretleniyor
* Kullanıcı alanları düzeltebiliyor

---

## Faz 4 — Eksik Belge Motoru

**Amaç:** Yüklenen sete göre eksik belgeleri bul.

### Yapılacaklar

1. Checklist şablon sistemi
2. Sektöre göre zorunlu belge kuralları
3. Başvuru / dosya tipi bazlı kural seti
4. Eksik belge hesaplama servisi
5. UI üzerinde durum gösterimi:

   * tamamlandı
   * eksik
   * doğrulama gerekli

### Faz çıkış kriteri

* Sistem eksik belgeyi otomatik listeliyor
* Checklist sonucu deterministik çalışıyor

---

## Faz 5 — Doğrulama Kuralları

**Amaç:** Sadece belge var mı değil, belge doğru mu kontrol edilsin.

### Yapılacaklar

1. Zorunlu alan boş mu
2. Tarih geçerli mi
3. Vergi no / TCKN formatı doğru mu
4. İsim eşleşmesi var mı
5. Belge tarihi güncel mi
6. Belge tipi ile alan uyumu var mı

### Faz çıkış kriteri

* Kırmızı / sarı / yeşil doğrulama yapısı hazır
* Hatalı ama mevcut belgeler ayrıştırılıyor

---

## Faz 6 — Sonuç Ekranı ve Export

**Amaç:** Kullanıcı sonucu hızlıca dışa alabilsin.

### Yapılacaklar

1. Özet panel
2. Eksik belge listesi
3. Alan sonuç tablosu
4. Excel export
5. PDF export
6. İşlem geçmişi

### Faz çıkış kriteri

* Kullanıcı raporu indirebiliyor
* Export içeriği iş kurallarına uyuyor

---

## Faz 7 — Pilot ve İyileştirme

**Amaç:** Gerçek kullanıcıyla test edip hataları kapat.

### Yapılacaklar

1. 3–5 pilot müşteriyle test
2. Yanlış sınıflandırma logları
3. OCR hata analizi
4. Eksik belge motoru iyileştirme
5. Performans optimizasyonu
6. Birim maliyet hesabı

### Faz çıkış kriteri

* Pilotta tekrar eden hata seti kapanmış
* Kullanıcı başı işlem süresi düşmüş
* Demo satış için hazır hale gelmiş

---

## 3. Geliştirme Sırası

1. Kapsam ve belge matrisi
2. Repo ve altyapı
3. Auth ve kullanıcı yapısı
4. Dosya upload
5. OCR pipeline
6. Belge sınıflandırma
7. Alan extraction
8. Checklist motoru
9. Doğrulama kuralları
10. Dashboard
11. Export
12. Loglama / audit
13. Test
14. Pilot

---

## 4. Klasör Yapısı

```txt
vertical-doc-control/
├─ apps/
│  ├─ web/
│  │  ├─ src/
│  │  │  ├─ app/
│  │  │  │  ├─ (auth)/
│  │  │  │  ├─ dashboard/
│  │  │  │  ├─ cases/
│  │  │  │  │  ├─ [caseId]/
│  │  │  │  │  │  ├─ documents/
│  │  │  │  │  │  ├─ checklist/
│  │  │  │  │  │  ├─ export/
│  │  │  │  ├─ api/
│  │  │  │  │  ├─ upload/
│  │  │  │  │  ├─ webhook/
│  │  │  │  │  ├─ cases/
│  │  │  │  │  ├─ documents/
│  │  │  │  │  ├─ checklist/
│  │  │  │  │  ├─ export/
│  │  │  ├─ components/
│  │  │  │  ├─ ui/
│  │  │  │  ├─ dashboard/
│  │  │  │  ├─ upload/
│  │  │  │  ├─ documents/
│  │  │  │  ├─ checklist/
│  │  │  ├─ features/
│  │  │  │  ├─ auth/
│  │  │  │  ├─ cases/
│  │  │  │  ├─ documents/
│  │  │  │  ├─ extraction/
│  │  │  │  ├─ checklist/
│  │  │  │  ├─ export/
│  │  │  ├─ lib/
│  │  │  │  ├─ db/
│  │  │  │  ├─ storage/
│  │  │  │  ├─ queue/
│  │  │  │  ├─ logger/
│  │  │  │  ├─ validators/
│  │  │  ├─ hooks/
│  │  │  ├─ types/
│  │  │  └─ config/
│  │  ├─ public/
│  │  └─ tests/
│  └─ worker/
│     ├─ src/
│     │  ├─ jobs/
│     │  ├─ processors/
│     │  ├─ services/
│     │  ├─ integrations/
│     │  └─ utils/
├─ packages/
│  ├─ ui/
│  ├─ config/
│  ├─ database/
│  ├─ shared/
│  ├─ rules/
│  └─ sdk/
├─ prisma/
│  ├─ schema.prisma
│  └─ migrations/
├─ docs/
│  ├─ product/
│  ├─ architecture/
│  ├─ api/
│  ├─ rules/
│  ├─ prompts/
│  └─ decisions/
├─ scripts/
├─ .cursor/
│  ├─ rules/
│  │  ├─ 00-global.mdc
│  │  ├─ 01-architecture.mdc
│  │  ├─ 02-backend.mdc
│  │  ├─ 03-frontend.mdc
│  │  ├─ 04-database.mdc
│  │  ├─ 05-ai-extraction.mdc
│  │  ├─ 06-testing.mdc
│  │  └─ 07-security.mdc
├─ .env.example
├─ package.json
├─ turbo.json
├─ pnpm-workspace.yaml
└─ README.md
```

---

## 5. Domain Modelleri

### Ana varlıklar

* User
* Organization
* Case
* Document
* DocumentPage
* ExtractionResult
* ExtractedField
* ChecklistTemplate
* ChecklistItem
* CaseChecklistResult
* ExportJob
* AuditLog

### Temel ilişki

* Bir organization içinde çok kullanıcı olur
* Bir case içinde çok document olur
* Bir document bir extraction result üretir
* Bir case bir checklist sonucu üretir

---

## 6. Veritabanı Taslak Tabloları

### users

* id
* organization_id
* name
* email
* role
* created_at

### cases

* id
* organization_id
* title
* sector
* status
* created_by
* created_at

### documents

* id
* case_id
* file_name
* mime_type
* storage_key
* document_type
* status
* page_count
* uploaded_at

### extraction_results

* id
* document_id
* provider
* raw_response_json
* confidence_avg
* processed_at

### extracted_fields

* id
* extraction_result_id
* field_key
* field_label
* field_value
* normalized_value
* confidence
* is_required
* is_valid
* validation_message

### checklist_templates

* id
* sector
* name
* version
* is_active

### checklist_items

* id
* template_id
* code
* label
* rule_type
* rule_config_json
* sort_order
* is_required

### case_checklist_results

* id
* case_id
* checklist_item_id
* status
* message
* resolved_by
* resolved_at

### audit_logs

* id
* entity_type
* entity_id
* action
* actor_id
* payload_json
* created_at

---

## 7. Cursor Kural Dosyaları

## `.cursor/rules/00-global.mdc`

```md
---
description: Global development rules for the project
globs:
  - "**/*"
alwaysApply: true
---

- Always preserve modular architecture.
- Never place business logic inside UI components.
- Always use TypeScript strict mode compatible code.
- Always write explicit types for public functions.
- Keep files small and focused.
- Prefer server-side validation for every critical action.
- Never hardcode document rules in page components.
- Use service layer for workflows.
- Use repository/db access layer for persistence.
- Every async process must be retry-safe and idempotent.
- Every important action must produce audit logs.
- Favor readability over cleverness.
- Do not introduce hidden side effects.
- Before creating code, check whether shared utilities already exist.
- Keep naming domain-driven and consistent.
```

## `.cursor/rules/01-architecture.mdc`

```md
---
description: Architecture rules
globs:
  - "apps/**/*"
  - "packages/**/*"
alwaysApply: true
---

- Follow feature-first architecture inside app source.
- Shared primitives go into packages/shared.
- UI primitives go into packages/ui.
- Database schema and db utilities remain centralized.
- Worker-only logic must never leak into web app UI layer.
- API routes/controllers may orchestrate but not contain heavy business logic.
- Business rules must live in services or domain modules.
- External provider integrations must be wrapped behind adapters.
- Checklist evaluation must be deterministic.
```

## `.cursor/rules/02-backend.mdc`

```md
---
description: Backend rules
globs:
  - "apps/web/src/app/api/**/*"
  - "apps/web/src/features/**/*"
  - "apps/worker/src/**/*"
alwaysApply: true
---

- Validate every request payload with schema validation.
- Use zod for input validation.
- Return typed response objects.
- Separate controller, service, and integration concerns.
- Never call OCR providers directly from route handlers.
- Long-running tasks must go through queue workers.
- Normalize provider outputs before storing.
- Persist raw provider responses for auditability.
- Design all jobs to be idempotent.
- Add structured logging for every failure path.
```

## `.cursor/rules/03-frontend.mdc`

```md
---
description: Frontend rules
globs:
  - "apps/web/src/components/**/*"
  - "apps/web/src/app/**/*"
alwaysApply: true
---

- Keep components presentational when possible.
- Move data fetching to server components or dedicated hooks.
- Use consistent loading, empty, and error states.
- Never mix file upload logic with display-only components.
- All tables and lists must support clear status indicators.
- Use accessible form controls.
- Use reusable status badges for document and checklist states.
- Avoid deeply nested JSX.
```

## `.cursor/rules/04-database.mdc`

```md
---
description: Database and Prisma rules
globs:
  - "prisma/**/*"
  - "packages/database/**/*"
alwaysApply: true
---

- All schema changes must come with migrations.
- Never delete production-relevant fields without a migration plan.
- Prefer enums for stable domain statuses.
- Store raw provider payloads in json fields when needed.
- Add indexes for case_id, document_id, organization_id, and status fields.
- Use created_at and updated_at consistently.
- Avoid nullable fields unless the domain truly requires it.
```

## `.cursor/rules/05-ai-extraction.mdc`

```md
---
description: AI and extraction rules
globs:
  - "apps/worker/src/**/*"
  - "apps/web/src/features/extraction/**/*"
  - "packages/rules/**/*"
alwaysApply: true
---

- OCR output must never be trusted directly.
- Normalize extracted values before validation.
- Every extracted field must carry confidence metadata when available.
- Low-confidence fields must be reviewable in UI.
- Document classification and field extraction must be versioned.
- Rules for missing documents must be configuration-driven.
- Prefer deterministic post-processing over prompt-only behavior.
- Keep provider-specific mapping isolated from domain logic.
```

## `.cursor/rules/06-testing.mdc`

```md
---
description: Testing rules
globs:
  - "**/*"
alwaysApply: true
---

- Write unit tests for services with business rules.
- Write integration tests for upload, extraction, and checklist flows.
- Add fixture files for supported document examples.
- Cover happy path, invalid file, low-confidence, and missing-document scenarios.
- Do not merge critical workflow code without tests.
```

## `.cursor/rules/07-security.mdc`

```md
---
description: Security rules
globs:
  - "**/*"
alwaysApply: true
---

- Treat every uploaded file as untrusted input.
- Validate mime type and extension.
- Sanitize file names before persistence.
- Enforce authorization on every case and document access.
- Never expose raw storage keys publicly.
- Sensitive extracted data must be masked in logs when necessary.
- Secrets must only come from environment variables.
- Signed URLs must be short-lived.
```

---

## 8. İş Kuralları Dosyası

## `packages/rules/checklist-rules/accounting-basic.json`

```json
{
  "sector": "accounting",
  "templateName": "Accounting Basic",
  "version": 1,
  "documentRequirements": [
    {
      "code": "tax_certificate",
      "label": "Vergi Levhası",
      "required": true,
      "rules": [
        { "type": "document_exists" },
        { "type": "field_required", "field": "tax_number" },
        { "type": "field_required", "field": "company_name" }
      ]
    },
    {
      "code": "signature_circular",
      "label": "İmza Sirküleri",
      "required": true,
      "rules": [
        { "type": "document_exists" },
        { "type": "field_required", "field": "authorized_person" }
      ]
    }
  ]
}
```

---

## 9. API Modül Sırası

1. `POST /api/upload`
2. `GET /api/cases/:id`
3. `GET /api/cases/:id/documents`
4. `POST /api/cases/:id/checklist/run`
5. `PATCH /api/documents/:id/fields`
6. `GET /api/cases/:id/checklist`
7. `POST /api/cases/:id/export/excel`
8. `POST /api/cases/:id/export/pdf`

---

## 10. İlk Sprint Planı

## Sprint 1

* repo kurulumu
* next.js + tailwind + shadcn
* prisma + postgres
* auth
* organization / case / document tabloları
* upload ekranı
* storage entegrasyonu

## Sprint 2

* worker kurulumu
* OCR provider entegrasyonu
* document status akışı
* extraction result kayıtları
* belge detay ekranı

## Sprint 3

* checklist template yapısı
* eksik belge motoru
* sonuç ekranı
* doğrulama badge sistemi

## Sprint 4

* export
* audit log
* testler
* pilot hazırlığı

---

## 11. Başlangıçta Yapılmayacaklar

* Çok tenantlı karmaşık yetki sistemi
* Gelişmiş rol matrisi
* Çoklu OCR provider fallback sistemi
* NLP ile serbest yorumlama
* Mobil uygulama
* Gerçek zamanlı ortak çalışma

---

## 12. Cursor ile Çalışma Düzeni

1. Önce klasör iskeletini kur
2. Sonra db şemasını yaz
3. Sonra upload akışını bitir
4. Worker ve OCR’ı bağla
5. Extraction ve checklist servislerini ayrı yaz
6. En son dashboard ve export ekranlarını ekle
7. Her fazda test dosyası üret
8. Her yeni özellikte ilgili `.cursor/rules` dosyasına sadık kal

---

## 13. En Kritik Teknik Prensipler

* UI içinde iş kuralı olmayacak
* OCR çıktısı doğrudan doğru kabul edilmeyecek
* Eksik belge mantığı config tabanlı olacak
* Her belge işlemi tekrar çalıştırılabilir olacak
* Audit log zorunlu olacak
* Export çıktısı deterministik olacak

---

## 14. Sana Net Önerim

İlk versiyonda **tek dikey seç**: `muhasebe`.
Çünkü belge tipleri daha standart, checklist mantığı daha net, satış denemesi daha hızlı olur.
