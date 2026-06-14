# 🎨 Inti Rupa — Cloud-Native GenAI Platform

[![CI Pipeline Status](https://github.com/aidilsaputrakirsan-classroom/cc-kelompok-a-steam/actions/workflows/ci.yml/badge.svg)](https://github.com/aidilsaputrakirsan-classroom/cc-kelompok-a-steam/actions)
[![Production Release](https://img.shields.io/badge/release-v3.0.0-blue.svg)](https://github.com/aidilsaputrakirsan-classroom/cc-kelompok-a-steam/releases)
[![Tech Stack](https://img.shields.io/badge/stack-FastAPI%20%7C%20React%20%7C%20Docker-green.svg)](#tech-stack)

**Inti Rupa** adalah platform asisten cerdas berbasis cloud-native yang dirancang untuk membantu pengguna mengolah informasi secara efisien. Platform ini mengintegrasikan kekuatan **Pemrosesan Bahasa Alami (NLP/LLM)** dan **Kreativitas Visual** ke dalam arsitektur microservices modern yang tangguh, aman, dan siap produksi.

Dengan fitur **Summarizer & OCR**, pengguna dapat mengekstrak teks dari foto dokumen serta merangkum artikel panjang hanya dalam hitungan detik. Didukung oleh fitur **Visual Generator**, pengguna juga dapat menciptakan karya seni visual baru berkualitas tinggi berdasarkan deskripsi teks sederhana.

---

## 🏗️ Architecture Design

Sistem **Inti Rupa** dirancang dengan arsitektur microservices terdesentralisasi yang terisolasi dan mandiri.

```mermaid
graph TD
    User([User Browser / React Frontend]) -->|Port 80: Nginx Gateway| Gateway[Nginx Reverse Proxy & Rate Limiter]
    
    Gateway -->|/auth/*| AuthService[Auth Service : Port 8001]
    Gateway -->|/chat/*| AIService[AI Service : Port 8002]
    Gateway -->|/status atau /| FrontendService[Frontend Static Server : Port 80]
    
    AuthService -->|Read/Write| AuthDB[(PostgreSQL Auth DB : Port 5433)]
    AIService -->|Read/Write| AIDB[(PostgreSQL AI DB : Port 5435)]
    
    AIService -.->|Stateless JWT Validation| SecretKey[Shared Secret Key]
    AIService -->|Internal Sync Quota PUT| AuthService
    
    AIService -->|External SDK API| GeminiAPI[Google Gemini AI - Text & OCR]
    AIService -->|External API Client| HuggingFaceAPI[HuggingFace Hub - FLUX Image Gen]
```

### Key Architectural Decisions:
1. **API Gateway Pattern:** Nginx digunakan sebagai single entry-point terpusat untuk routing path, penanganan CORS, TLS Termination, dan perlindungan Rate Limiting.
2. **Database per Service Pattern:** `auth-service` dan `ai-service` memiliki database PostgreSQL terisolasi masing-masing (`auth_db` dan `ai_db`). Tidak ada query lintas database (shared-database anti-pattern dihindari).
3. **Stateless JWT Authentication:** `ai-service` memverifikasi token pengguna secara mandiri menggunakan shared-secret key secara stateless, mengeliminasi kebutuhan synchronous network request ke `auth-service` untuk setiap validasi endpoint terproteksi.
4. **Resilient Circuit Breaker:** Komunikasi inter-service untuk pencatatan kuota dilindungi oleh pattern **Circuit Breaker** untuk mencegah cascading failure jika `auth-service` mengalami downtime.

---

## 👥 Tim Pengembang (Kelompok A)

| Peran | Nama | NIM | Tanggung Jawab Utama |
| :--- | :--- | :--- | :--- |
| **Lead Backend** | Irfan Zaki Riyanto | 10231045 | REST API Desain, Database Per-Service, Skema Pydantic, & JWT Auth |
| **Lead Frontend** | Incha Raghil | 10231043 | SPA React UI, State Management, Integrasi API, & Dynamic UX |
| **Lead DevOps** | Jonathan Cristopher Jetro | 10231047 | CI/CD GitHub Actions, Docker Compose, Gateway Nginx, & Monitoring |
| **Lead QA & Docs** | Jonathan Joseph Y. T. | 10231048 | Automated API Testing, Reliability Skenario, & API Contract Specs |

---

## 🛠️ Tech Stack

*   **Frontend:** React (SPA), Vite, Vanilla CSS (Premium Custom Theme, Glassmorphism, Responsive Grid)
*   **Backend Framework:** FastAPI (Python 3.11/3.12, ASGI Asynchronous Engine)
*   **Database:** PostgreSQL 16 (Alpine-based Container)
*   **Gateway & Security:** Nginx (Reverse Proxy, Rate Limiter)
*   **AI Engine Integrations:**
    *   **Google Gemini 1.5 Flash:** OCR (Visual-to-Text) dan Text Summarization
    *   **HuggingFace Inference API (FLUX.1 Schnell):** Text-to-Image Generation
*   **Monitoring & Observability:** Structured JSON Logging, Custom Performance Metrics Endpoint (`/metrics`), Correlation ID Tracing, dan Real-time Health Dashboard.

---

## 🔐 Security Hardening & Rate Limiting

Untuk melindungi sistem dari penyalahgunaan dan serangan keamanan di lingkungan production:
*   **Strict Nginx Rate Limiting:**
    *   `auth_limit` (Endpoint Pendaftaran/Login): **5 request/detik** per IP address (mencegah brute force).
    *   `api_limit` (Endpoint AI Chat/Image Gen): **20 request/detik** per IP address.
    *   `general_limit` (Statik Frontend & Aset): **30 request/detik** per IP address.
*   **Strict Input Validation:** Schema `UserCreate` di `auth-service` diperkuat dengan validasi panjang password maksimal 128 karakter, sanitasi spasi nama lengkap, enkripsi kata sandi menggunakan `passlib` bcrypt, dan validasi format alamat email standar RFC.
*   **Secrets Isolation:** Kredensial sensitif diisolasi ke dalam `.env` dan tidak pernah masuk ke version control (diamankan melalui `.gitignore`). Template variabel pengembang didokumentasikan pada `.env.example`.

---

## 🚀 Panduan Memulai Cepat (Quick Start)

### Prasyarat System:
*   Docker & Docker Compose (v2.0+)
*   Git

### Langkah-langkah Menjalankan Sistem Secara Lokal:

1.  **Clone Repository:**
    ```bash
    git clone https://github.com/aidilsaputrakirsan-classroom/cc-kelompok-a-steam.git
    cd cc-kelompok-a-steam
    ```

2.  **Konfigurasi Environment:**
    Salin file template `.env.example` menjadi `.env`:
    ```bash
    cp .env.example .env
    ```
    Buka file `.env` baru dan masukkan API Key Anda untuk provider AI:
    ```env
    GEMINI_API_KEY=AIzaSy_masukkan_gemini_key_anda
    HUGGINGFACE_API_KEY=hf_masukkan_huggingface_key_anda
    SECRET_KEY=masukkan_32_karakter_acak_untuk_keamanan_jwt
    ```

3.  **Jalankan Microservices Container:**
    ```bash
    docker compose up -d --build
    ```

4.  **Verifikasi Status Kontainer:**
    Pastikan seluruh service berstatus `healthy`:
    ```bash
    docker compose ps
    ```

5.  **Akses Aplikasi:**
    *   **Frontend Client:** [http://localhost](http://localhost) (Port 80)
    *   **Real-time Health Dashboard:** [http://localhost/status](http://localhost/status)
    *   **Auth Service API Swagger Docs:** [http://localhost/auth/docs](http://localhost/auth/docs)
    *   **AI Service API Swagger Docs:** [http://localhost/chat/docs](http://localhost/chat/docs)

---

## 📈 Monitoring & Observability

Sistem ini memprioritaskan keterlacakan performa aplikasi di lingkungan cloud:
*   **Correlation ID Tracing:** Setiap request masuk diberikan HTTP header `X-Correlation-ID` unik. ID ini secara otomatis di-forward oleh Nginx Gateway ke `auth-service` dan `ai-service`, memungkinkan kita menelusuri perjalanan request lintas kontainer (trace logs) secara real-time.
*   **Structured JSON Logging:** Log backend ditulis dalam format JSON standar yang dapat dengan mudah di-consume oleh log aggregator (seperti ELK Stack atau Loki).
*   **Service Metrics:** Tiap kontainer mengekspos metrik internal (seperti total request, error count, p50/p95/p99 latency) melalui format JSON di path `/metrics` (akses via Gateway di `/auth/metrics` dan `/chat/metrics`).

---

## 📝 Dokumentasi Teknis Tambahan

Seluruh dokumentasi detail dan laporan pengujian berkala proyek Inti Rupa dapat diakses pada tautan berikut:

1.  **[API Contract & Specifications](docs/api-contract.md)** — Kontrak payload & format endpoint backend.
2.  **[Operations & Troubleshooting Guide](docs/operations-guide.md)** — Buku panduan penanganan insiden dan pembacaan metrik.
3.  **[Reliability Testing Report](docs/reliability-testing.md)** — Laporan ketahanan sistem saat disimulasikan error/down.
4.  **[Deployment & Release Notes](docs/release-notes-m3.md)** — Catatan rilis v3.0.0 dan riwayat evolusi arsitektur.

---

## 🌐 Production Deployment (Railway)

Aplikasi kami telah di-deploy secara penuh di Railway Cloud dengan integrasi pipeline CI/CD otomatis pada branch `main`:
*   **Production Frontend Client:** [https://cc-kelompok-a-steam-production-51bf.up.railway.app](https://cc-kelompok-a-steam-production-51bf.up.railway.app)
*   **Production API Gateway:** [https://cc-kelompok-a-steam-production.up.railway.app](https://cc-kelompok-a-steam-production.up.railway.app)
