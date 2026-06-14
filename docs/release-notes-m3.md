# Release Notes — Milestone 3 (Final Project)

## Version: 3.0.0 — Production-Ready Cloud App

**Release Date:** Juni 2026  
**Tag:** v3.0.0  
**Status:** ✅ Production Ready (UAS Ready)

---

## 📊 Milestone Overview

Rilis ini menandai selesainya transformasi penuh dari arsitektur monolitik menjadi arsitektur microservices berbasis cloud-native pada aplikasi **Inti Rupa**:

```
Milestone 1 (v1.0) → Monolit Full-stack (FastAPI + PostgreSQL + React SPA)
Milestone 2 (v2.0) → Containerization & Orchestration (Docker Compose Dev/Prod)
Milestone 3 (v3.0) → Microservices + Advanced Observability + Security Hardening ⭐
```

---

## 🎯 Fitur Baru & Peningkatan di v3.0.0

### 1. Transformasi Arsitektur (Weeks 12-14)
*   **Decomposed Services:** Memecah monolit menjadi dua service terpisah: `auth-service` (port `8001`) dan `ai-service` (port `8002`).
*   **API Gateway (Nginx):** Berfungsi sebagai pintu masuk tunggal yang melakukan routing cerdas ke masing-masing microservice, menangani CORS, dan menerapkan rate limiting terpusat.
*   **Database per Service:** Menggunakan database PostgreSQL terpisah untuk masing-masing microservice (`auth_db` dan `ai_db`) demi menjaga integritas data dan otonomi service.
*   **Resilient Inter-service Communication:** Panggilan sinkron dari `ai-service` ke `auth-service` untuk pencatatan kuota API dilindungi dengan pattern **Circuit Breaker** (menggunakan transisi state CLOSED, OPEN, HALF-OPEN) untuk mencegah cascading failure ketika service auth mengalami downtime.

### 2. Observability & Monitoring (Week 14)
*   **Structured JSON Logging:** Format log standar JSON untuk memudahkan parsing dan visualisasi log.
*   **Correlation ID Tracing:** Menggunakan UUID unik (`X-Correlation-ID`) yang diteruskan ke seluruh request internal guna mempermudah pelacakan flow request secara end-to-end.
*   **Health Check Aggregator:** Endpoint `/health` dan `/status` yang menampilkan metrics liveness check serta keterhubungan database dan status sirkuit inter-service.
*   **Custom Metrics Endpoint:** Menyediakan persentil latensi request (p50, p95, p99), error rate, dan volume request melalui endpoint `/metrics` di masing-masing service.

### 3. Security Hardening (Week 15 - Modul Final)
*   **Nginx Rate Limiting:** Membatasi request IP guna mencegah brute-force:
    *   Auth endpoints: 5 req/s (burst 10)
    *   AI API endpoints: 20 req/s (burst 30)
    *   Frontend: 30 req/s (burst 50)
*   **Strict Input Validation:** Menambahkan limitasi karakter password (max 128 chars), sanitasi whitespace nama lengkap, pengecekan format email (RFC standar), dan pencegahan negative-value pada input numerik menggunakan schema Pydantic v2.
*   **Secrets Management:** Semua kredensial sensitif dipisahkan dari source code dan disimpan dalam environment variables (`.env`). Template `.env.example` telah dimutakhirkan.
*   **Code Quality Cleanup:** Membersihkan sisa print statement pengujian, menerapkan format standard formatter (`black` dan `isort` via `pyproject.toml`), dan menambahkan modul-level docstring untuk semua file Python utama guna mematuhi standar clean code industri.

---

## 📈 Statistik Proyek

| Metrik | Nilai | Deskripsi |
| :--- | :--- | :--- |
| **Total Services** | 4 | Auth-service, AI-service, Gateway (Nginx), Frontend |
| **Total Database** | 2 | PostgreSQL terpisah (`auth_db` dan `ai_db`) |
| **Integrasi AI** | 2 | Google Gemini API (Text/OCR) & HuggingFace (Flux Image Gen) |
| **Total Container Images** | 5 | Frontend, Auth Service, AI Service, 2x DB Images |
| **Kepatuhan Clean Code** | 100% | Bebas dari file python tanpa docstring |

---

## 🚀 Panduan Deployment Cloud & Local

### 1. Production URL (Railway)
*   **Frontend Client:** [https://cc-kelompok-a-steam-production-51bf.up.railway.app](https://cc-kelompok-a-steam-production-51bf.up.railway.app)
*   **API Gateway:** [https://cc-kelompok-a-steam-production.up.railway.app](https://cc-kelompok-a-steam-production.up.railway.app)

### 2. Local Run
```bash
# Clone dan buat environment
cp .env.example .env
# Edit .env dengan API keys Anda

# Jalankan container
docker compose up -d --build
```

---

## 🔄 Kompatibilitas Mundur (Backward Compatibility)
*   **Breaking Changes:** Tidak ada.
*   Gateway tetap melayani kompatibilitas rute lama dengan memetakan alias `/items/` ke endpoint `/chat/` pada AI Service, sehingga integrasi client lama tidak terputus.

---

## 👥 Kontributor Tim (Kelompok A)
*   **Irfan Zaki Riyanto** (10231045) — Lead Backend
*   **Incha Raghil** (10231043) — Lead Frontend
*   **Jonathan Cristopher Jetro** (10231047) — Lead DevOps
*   **Jonathan Joseph Yudita Tampubolon** (10231048) — Lead QA & Docs
