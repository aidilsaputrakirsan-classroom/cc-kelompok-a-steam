## Cloud App - STEAM

![CI Pipeline](https://github.com/aidilsaputrakirsan-classroom/cc-kelompok-a-steam/actions/workflows/ci.yml/badge.svg)

### 📖 Deskripsi Proyek

**Inti Rupa** adalah platform asisten cerdas berbasis cloud yang dirancang untuk membantu pengguna mengolah informasi secara lebih efisien. Aplikasi ini menggabungkan kekuatan **Analisis Teks** dan **Kreativitas Visual** dalam satu platform terintegrasi.

Dengan fitur **Summarizer**, pengguna dapat mengekstrak _"Inti"_ dari artikel panjang maupun foto dokumen hanya dalam hitungan detik. Didukung fitur **Generator**, pengguna juga dapat menciptakan _"Rupa"_ visual baru cukup dengan memberikan perintah teks sederhana.

**Inti Rupa** hadir sebagai solusi _all-in-one_ bagi siapa saja yang ingin **memahami informasi lebih cepat** dan **berkreasi tanpa batas**.

#### ✨ Fitur Utama

| Fitur                        | Deskripsi                                                                                                         |
| :--------------------------- | :---------------------------------------------------------------------------------------------------------------- |
| 🌐 Web Scraper & Summarizer  | Mengambil teks dari URL artikel yang diberikan                                                                    |
| 🖼️ Visual-to-Text Summarizer | Melakukan OCR pada gambar yang diunggah untuk mengekstrak teks, kemudian merangkum isinya                         |
| 🗂️ History & Cache           | Menyimpan riwayat ringkasan di database agar pengguna bisa melihat kembali hasil sebelumnya tanpa memproses ulang |
| 🎨 AI Image Generator ⭐     | Generate gambar secara otomatis berdasarkan deskripsi atau prompt yang diberikan pengguna                         |

---

### 🏗️ Architecture Overview

Sistem **Inti Rupa** menggunakan arsitektur **client-server** berbasis cloud. Frontend (React) berjalan di browser dan berkomunikasi dengan Backend (FastAPI) melalui HTTP request. Backend bertugas memproses setiap permintaan: scraping URL, OCR gambar, atau generate gambar sebelum diteruskan ke **Hugging Face API** sebagai AI nya. Setiap hasil diproses melalui **Cache Checker** terlebih dahulu untuk menghemat penggunaan API, lalu disimpan di **PostgreSQL Database** sebagai riwayat.

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                         │
│                      (React Frontend)                       │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP Request
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                        │
│                                                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────┐   │
│  │   Web     │  │   OCR     │  │  History  │  │  Image  │   │
│  │ Scraper   │  │  Module   │  │  Endpoint │  │  Gen    │   │
│  │ Endpoint  │  │ Endpoint  │  │           │  │Endpoint │   │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬───┘   │
│        └──────────────┼──────────────┘              │       │
│                       │        ┌────────────────────┘       │
│              ┌────────┴────────┐                            │
│              │  Cache Checker  │                            │
│              └────────┬────────┘                            │
└───────────────────────┼─────────────────────────────────────┘
            ┌───────────┴───────────┐
            │                       │
            ▼                       ▼
┌──────────────────────┐  ┌────────────────────────┐
│  Hugging Face API    │  │  PostgreSQL Database   │
│  - Summarizer        │  │  (History & Cache)     │
│  - Image Generator   │  │                        │
└──────────────────────┘  └────────────────────────┘
```

---

### 👥 Team Member

| Nama                              | NIM      | Peran               |
| :-------------------------------- | :------- | :------------------ |
| Irfan Zaki Riyanto                | 10231045 | Lead Backend        |
| Incha Raghil                      | 10231043 | Lead Frontend       |
| Jonathan Cristopher Jetro         | 10231047 | Lead DevOps         |
| Jonathan Joseph Yudita Tampubolon | 10231048 | Lead Lead QA & Docs |

### 🛠️ Tech Stack

| Teknologi        | Fungsi                                       |
| :--------------- | :------------------------------------------- |
| FastAPI          | Backend REST API                             |
| React            | Frontend SPA                                 |
| PostgreSQL       | Database                                     |
| Docker           | Containerization                             |
| GitHub Actions   | GitHub Actions                               |
| Railway/Render   | Cloud Deployment                             |
| Hugging Face API | Generative AI (Summarizer & Image Generator) |

---

### ⚙️ Development Workflow (Makefile)

Untuk mempermudah workflow pengembangan dan CI/CD, Anda dapat menggunakan perintah `make` berikut:

| Perintah        | Deskripsi                                                                                                                           |
| :-------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| `make lint`     | Menjalankan linter untuk menjaga kualitas kode (backend & frontend).                                                                |
| `make test`     | Menjalankan _automated tests_ (unit test, dll).                                                                                     |
| `make pr-check` | Menjalankan semua pengujian (`lint` & `test`) lalu melakukan _build_ image Docker. Digunakan untuk verifikasi sebelum Pull Request. |

---

### 📅 Roadmap

| Minggu | Target                 | Status |
| :----- | :--------------------- | :----: |
| 1      | Setup & Hello World    |   ✅   |
| 2      | REST API + Database    |   ✅   |
| 3      | React Frontend         |   ✅   |
| 4      | Full-Stack Integration |   ✅   |
| 5-7    | Docker & Compose       |   ✅   |
| 8      | UTS Demo               |   ✅   |
| 9-11   | CI/CD Pipeline         |   ✅   |
| 12-14  | Microservices          |   ⬜   |
| 15-16  | Final & UAS            |   ⬜   |

### 🔐 Security & Rate Limiting

Untuk melindungi API dari abuse dan brute force attacks:

- **Rate Limiting**: Nginx gateway membatasi request rate per IP address
  - Auth endpoints: 5 req/s (login protection)
  - API endpoints: 20 req/s (general CRUD)
  - Frontend: 30 req/s (general traffic)
- **Input Validation**: Semua input divalidasi menggunakan Pydantic
  - Email format validation
  - Password strength (min 8 chars, 1 uppercase, 1 digit)
  - Numeric fields (price, quantity) tidak boleh negatif
- **Secrets Management**: Semua credentials disimpan di environment variables
  - `.env` tidak di-commit ke Git (ada di `.gitignore`)
  - Lihat `.env.example` untuk template lengkap
- **CORS Configuration**: Diatur per environment (development vs production)

---

### 📊 Monitoring & Observability (Module 14)

Sistem ini dilengkapi dengan monitoring production-ready:

**Structured Logging (JSON Format)**

- Setiap request di-log dengan format JSON untuk mudah di-parse
- Includes: timestamp, service name, correlation ID, latency, status code
- Auto-exclude health checks dan metrics endpoint untuk reduce noise

```bash
# View logs semua services
docker compose logs -f auth-service ai-service

# Filter logs by correlation ID untuk track satu request across services
docker compose logs | grep "a1b2c3d4"
```

**Metrics Endpoint**

- Setiap service expose `/metrics` endpoint dengan statistics
- Metrics yang ditrack: total requests, error rate, latency percentiles (p50/p95/p99)
- Useful untuk monitoring dan alerting

```bash
# Check Auth Service metrics
curl http://localhost/auth/metrics | python3 -m json.tool

# Check AI Service metrics
curl http://localhost/items/metrics | python3 -m json.tool
```

**Health Dashboard**

- Real-time system status page di `http://localhost/status`
- Shows health dan metrics dari semua services
- Auto-refresh every 10 seconds
- Responsive design untuk mobile & desktop

**Correlation ID Tracing**

- Setiap request diberi unique ID yang diteruskan ke semua internal services
- Allows tracking request journey: Frontend → Gateway → Auth/AI Service
- Useful untuk debugging request flows di production

---

### 🚀 Quick Start

#### Prerequisites

- Docker & Docker Compose (v2+)
- Git

#### Run with Docker Compose

```bash
# 1. Clone repository
git clone https://github.com/aidilsaputrakirsan-classroom/cc-kelompok-a-steam.git
cd cc-kelompok-a-steam

# 2. Setup environment (copy template)
cp .env.example .env
# Edit .env jika perlu custom values, default sudah aman untuk development

# 3. Start all services
docker compose up -d

# 4. Verify services running
docker compose ps

# 5. Open in browser
# Frontend: http://localhost
# API Docs: http://localhost/auth/docs
# Status Page: http://localhost/status
```

#### Troubleshooting

```bash
# Check service health
curl http://localhost/health

# View real-time logs
docker compose logs -f

# Restart specific service
docker compose restart auth-service

# Full reset
docker compose down -v
docker compose up -d
```

---

### 📝 Documentation

| Document                                       | Purpose                                 |
| ---------------------------------------------- | --------------------------------------- |
| [Architecture & API Contract](docs/architecture.md) | Microservices diagram, port mapping, API specifications |
| [API Documentation](docs/api-documentation.md) | Complete API endpoints reference        |
| [Deployment Guide](docs/deployment-guide.md)   | How to deploy to Railway (production)   |
| [Operations Guide](docs/operations-guide.md)   | Production troubleshooting & monitoring |
| [Database Schema](docs/database-schema.md)     | ER diagram & table definitions          |
| [CI/CD Pipeline](docs/cicd.md)                 | GitHub Actions workflow explanation     |
| [Git Workflow](docs/git-workflow.md)           | Team collaboration guidelines           |

---

### 📊 Architecture Evolution

| Phase                | Weeks | Key Changes                                          |
| -------------------- | ----- | ---------------------------------------------------- |
| **Foundation**       | 1-4   | Monolith: Single FastAPI + PostgreSQL + React        |
| **Containerization** | 5-7   | Docker Compose: 3 containers (frontend, backend, db) |
| **CI/CD**            | 9-11  | GitHub Actions + Railway deployment                  |
| **Microservices**    | 12-14 | Decomposed: Auth Service + AI Service + Gateway      |
| **Monitoring**       | 14    | Structured logging + metrics + health dashboard      |
| **Final Polish**     | 15    | Security hardening + documentation                   |

---

### 🎓 Laporan Pengujian setiap minggu

**⚙️ Modul 2: Backend REST API (FastAPI)**
_[Hasil Pengujian API Terintegrasi via Swagger](docs/api-test-results.md)_

- Testing endpoints: auth/login, generate/image, authorize, generate/summarize
- Dokumentasi API responses dengan screenshot

**💻 Modul 3: Frontend Development (React UI)**
_[Hasil Pengujian Antarmuka (UI)](docs/ui-test-results.md)_

- Testing: API Connection, Data Rendering, POST/PUT/DELETE operations
- Search filtering, confirmation dialogs
- 8 test cases dengan screenshot

**🔐 Modul 4: Integrasi Full-Stack & Autentikasi**

- [Alur Otentikasi & Otorisasi](docs/auth-test-results.md)
- 8 test cases: Register, Login, Get Profile, Token validation
- Testing unauthorized access, expired tokens

**📦 Modul 5 & 6: Docker Containerization & Orchestration**
_[ Containerization & Orchestration](docs/cicd.md)_

- GitHub Actions workflow
- Automated testing pada Docker build
- Backend (17 tests) + Frontend (12 tests)

**🚀 Modul 11: Cloud Deployment & CI/CD Pipeline (Railway)**
_[Deployment & Rollback Guide](docs/deployment-guide.md)_

- Pipeline CI/CD otomatis terintegrasi penuh ke cloud Railway.
- Dilengkapi dengan **Automated Health Check** (pengujian `/health` backend & `200 OK` frontend pada proses deploy).
- Dilengkapi dengan instruksi **Rollback Manual** untuk memitigasi kegagalan sistem di production.
- Production URL:
  - **Frontend:** [https://cc-kelompok-a-steam-production-51bf.up.railway.app](https://cc-kelompok-a-steam-production-51bf.up.railway.app)
  - **Backend:** [https://cc-kelompok-a-steam-production.up.railway.app](https://cc-kelompok-a-steam-production.up.railway.app)
