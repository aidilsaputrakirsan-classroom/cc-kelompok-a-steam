# Outline Presentasi UAS — Proyek Inti Rupa Cloud App

Dokumen ini merupakan outline bahan presentasi (slide deck) untuk ujian akhir semester (UAS) mata kuliah Cloud Computing.

---

## Slide 1: Judul Presentasi & Identitas Tim
*   **Judul:** Inti Rupa: Platform Generative AI Berbasis Cloud-Native Microservices
*   **Subtitle:** Implementasi Tugas Akhir Praktikum Cloud Computing — Kelompok A
*   **Identitas Tim:**
    *   Irfan Zaki Riyanto (10231045) — Lead Backend
    *   Incha Raghil (10231043) — Lead Frontend
    *   Jonathan Cristopher Jetro (10231047) — Lead DevOps
    *   Jonathan Joseph Yudita Tampubolon (10231048) — Lead QA & Docs
*   **Logo / Aset Visual:** Desain minimalis elegan bertema AI Cloud.

---

## Slide 2: Latar Belakang & Solusi
*   **Poin Masalah:**
    *   Tingginya volume konsumsi teks dan dokumen dalam aktivitas harian.
    *   Kebutuhan akan representasi visual cepat berdasarkan imajinasi/deskripsi.
    *   Kompleksitas integrasi AI yang mahal bagi pengguna biasa.
*   **Solusi (Inti Rupa):**
    *   Aplikasi full-stack yang mengawinkan **NLP/LLM (Summarizer & OCR)** dan **AI Generatif Visual (Image Generator)** dalam satu antarmuka modern terpadu.

---

## Slide 3: Fitur Utama Platform
*   **Summarizer (Text-to-Text):** Merangkum teks panjang secara cerdas dalam bahasa Indonesia (didukung oleh Google Gemini API).
*   **OCR & Summarizer (Visual-to-Text):** Mengekstrak teks dari foto dokumen atau screenshot, lalu otomatis merangkum isinya.
*   **Visual Generator (Text-to-Image):** Memproduksi gambar artistik berkualitas tinggi berdasarkan deskripsi teks bahasa Indonesia/Inggris (didukung oleh HuggingFace FLUX.1).
*   **Statistik Penggunaan & History:** Riwayat chat dan generasi gambar terproteksi per-user dengan counter pemakaian kuota API.

---

## Slide 4: Evolusi Arsitektur Sistem
*   **Fase 1: Monolit (Milestone 1)**
    *   FastAPI + React + PostgreSQL tunggal. Cepat untuk deployment awal namun tidak scalable.
*   **Fase 2: Containerization (Milestone 2)**
    *   Mengisolasi lingkungan pengembang menggunakan Docker & Docker Compose.
*   **Fase 3: Cloud Microservices (Milestone 3)**
    *   Memecah sistem menjadi service independen: `auth-service` (Port 8001), `ai-service` (Port 8002), Frontend Static Server, dan PostgreSQL terpisah per-service.

---

## Slide 5: Arsitektur Mikroservis & Flow Data
*   **Diagram Arsitektur (Mermaid):**
    *   Menampilkan visualisasi alur request: User Browser → Nginx Gateway → Microservices (Auth & AI) → PostgreSQL & SDK AI eksternal.
*   **Mekanisme Autentikasi:**
    *   Penerapan **Stateless JWT Verification** menggunakan shared-secret key. AI Service memverifikasi token pengguna secara lokal tanpa overhead request ke Auth Service.

---

## Slide 6: Aspek Reliability & Fault Tolerance
*   **Circuit Breaker Pattern:**
    *   Melindungi `ai-service` ketika melakukan synchronous call ke `auth-service`. State CLOSED akan berpindah ke OPEN jika terjadi 5 error beruntun, menghindari cascading failure.
*   **Graceful Degradation:**
    *   Jika `auth-service` down, user terautentikasi tetap dapat menggunakan fungsi generator. Aplikasi akan menyajikan `/stats/degraded` (data agregat publik) tanpa langsung mengalami crash total.

---

## Slide 7: Aspek Keamanan (Security Hardening)
*   **Rate Limiting Terpusat di Nginx:**
    *   Membatasi request IP: Auth (5 req/s) untuk brute force protection, AI API (20 req/s), Frontend (30 req/s).
*   **Input Validation Ketat (Pydantic v2):**
    *   Sanitasi spasi string, pembatasan karakter sandi (max 128 chars), pengamanan regex email, dan pembatasan range angka numerik.
*   **Secrets Isolation:**
    *   Seluruh kredensial API dan DB disimpan di Cloud Environment Variable (Railway), tidak di-commit di git history.

---

## Slide 8: Observability & Monitoring
*   **Structured Logging (JSON):**
    *   Log seragam di seluruh service memudahkan parsing log untuk audit keamanan.
*   **Correlation ID Tracing:**
    *   UUID unik melacak siklus request mulai dari Nginx Gateway, Auth, hingga AI Service.
*   **Health Check & Metrics Dashboard:**
    *   Expose `/metrics` (latensi p50/p95/p99) dan dashboard `/status` real-time yang memonitor dependency database serta state circuit breaker.

---

## Slide 9: Infrastructure & CI/CD Pipeline
*   **CI/CD GitHub Actions:**
    *   Otomatisasi pengujian unit testing dan Docker build verification setiap ada Pull Request ke branch `main`.
*   **Railway Cloud Production Deployment:**
    *   Deploy otomatis setelah merge dengan auto health check liveness.
    *   Link Production:
        *   Frontend: [https://cc-kelompok-a-steam-production-51bf.up.railway.app](https://cc-kelompok-a-steam-production-51bf.up.railway.app)

---

## Slide 10: Demo Sistem (Live Demo)
*   *Langkah Demo Live:*
    1.  Mendaftarkan User Baru (menunjukkan validasi input sandi).
    2.  Melakukan Login (menguji response token JWT & Rate limiting).
    3.  Melakukan Summarization teks panjang dan OCR dokumen.
    4.  Mencoba Image Generation (menunjukkan query HuggingFace FLUX).
    5.  Menunjukkan Halaman Real-time Health Dashboard.

---

## Slide 11: Kesimpulan & Pembelajaran Tim
*   **Poin Pembelajaran (Takeaway):**
    *   Pemahaman mendalam mengenai transisi monolit ke microservices.
    *   Pentingnya monitoring latensi dan log tracing di sistem terdistribusi.
    *   Implementasi pattern ketahanan (Retry & Circuit Breaker) untuk menjaga availability layanan.
*   **Sesi Tanya Jawab (Q&A)**
