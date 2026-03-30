# Faz 0 - Muhasebe Belge Matrisi

Bu dokuman, MVP Faz 0 kapsam kilidini muhasebe dikeyi icin sabitler.

## Sabitler

- Dikey: `accounting` (muhasebe)
- Template: `Accounting Basic`
- Versiyon: `1`
- Belge tipi sayisi: `8`

## Belge Tipleri ve Kurallar

### 1) tax_certificate - Vergi Levhasi
- Zorunlu alanlar: `tax_number`, `company_name`
- Opsiyonel alanlar: `tax_office`, `issue_year`
- Dogrulama: vergi numarasi formati, sirket unvani bos olamaz
- Eksik sayilma kosulu: belge yoksa veya zorunlu alanlardan biri yoksa

### 2) signature_circular - Imza Sirkuleri
- Zorunlu alanlar: `authorized_person`
- Opsiyonel alanlar: `signing_authority_type`
- Dogrulama: yetkili kisi bos olamaz
- Eksik sayilma kosulu: belge yoksa veya `authorized_person` yoksa

### 3) trade_registry_gazette - Ticaret Sicil Gazetesi
- Zorunlu alanlar: `registry_number`, `company_name`
- Opsiyonel alanlar: `publication_date`
- Dogrulama: sicil numarasi bos olamaz
- Eksik sayilma kosulu: belge yoksa veya zorunlu alanlardan biri yoksa

### 4) activity_certificate - Faaliyet Belgesi
- Zorunlu alanlar: `chamber_name`, `valid_until`
- Opsiyonel alanlar: `certificate_number`
- Dogrulama: gecerlilik tarihi gecmis olamaz
- Eksik sayilma kosulu: belge yoksa veya `valid_until` yoksa

### 5) identity_copy - Kimlik Fotokopisi
- Zorunlu alanlar: `person_name`, `identity_number`
- Opsiyonel alanlar: `birth_date`
- Dogrulama: kimlik numarasi format kontrolu
- Eksik sayilma kosulu: belge yoksa veya zorunlu alanlardan biri yoksa

### 6) tax_plate_previous_year - Gecen Yil Vergi Levhasi
- Zorunlu alanlar: `tax_number`, `fiscal_year`
- Opsiyonel alanlar: `company_name`
- Dogrulama: `fiscal_year` beklenen aralikta olmali
- Eksik sayilma kosulu: belge yoksa veya zorunlu alanlardan biri yoksa

### 7) balance_sheet - Bilanco
- Zorunlu alanlar: `period`, `total_assets`
- Opsiyonel alanlar: `total_liabilities`
- Dogrulama: toplam aktif numerik ve 0'dan buyuk olmali
- Eksik sayilma kosulu: belge yoksa veya zorunlu alanlardan biri yoksa

### 8) income_statement - Gelir Tablosu
- Zorunlu alanlar: `period`, `net_sales`
- Opsiyonel alanlar: `net_profit`
- Dogrulama: net satis numerik ve 0'dan buyuk olmali
- Eksik sayilma kosulu: belge yoksa veya zorunlu alanlardan biri yoksa

## Faz 0 Cikis Kriteri

- Belge matrisi yazili ve sabit durumda.
- Zorunlu/opsiyonel alanlar belirlendi.
- Eksik evrak kosullari deterministik olarak tanimlandi.
