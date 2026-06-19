# Railway Deployment Documentation

## Overview
Aplikasi **Inti Rupa** sepenuhnya di-deploy di atas infrastruktur cloud **Railway**. Proyek ini menggunakan pendekatan **Microservices** di mana setiap komponen aplikasi dijalankan sebagai container mandiri dengan siklus deployment (CI/CD) yang diotomatisasi melalui GitHub Actions.

## Daftar Microservices
Layanan yang berjalan di dalam environment `production` Railway:
1. **Frontend (Vite/React)**
   - Tersedia ke publik melalui custom domain (e.g., `cc-kelompok-a-steam-production-51bf.up.railway.app`).
2. **API Gateway (Nginx)**
   - Bertindak sebagai reverse proxy. Domain publiknya (e.g., `gateway-production-18ce.up.railway.app`) menangani semua API calls dari Frontend.
3. **Auth Service (FastAPI)**
   - Layanan privat internal (diakses via `auth-service.railway.internal`). Mengelola proses autentikasi dan terhubung ke PostgreSQL.
4. **AI Service (FastAPI)**
   - Layanan privat internal (diakses via `ai-service.railway.internal`). Menangani fitur AI dengan integrasi ke API Eksternal (Gemini/HuggingFace).
5. **PostgreSQL**
   - Database bawaan Railway dengan Persistent Volume untuk menyimpan data pengguna dan riwayat obrolan (chat).

## CI/CD Pipeline (GitHub Actions)
Konfigurasi CI/CD berada di `.github/workflows/ci.yml`. Pipeline ini mengatur secara penuh proses pengetesan dan pengiriman kode ke Railway setiap kali terjadi push ke branch `main`.

**Tahapan Pipeline:**
1. **Testing:** Menjalankan Unit Tests untuk Backend (Pytest) dan Frontend (Vitest).
2. **Build Docker:** Melakukan validasi build Dockerfile untuk semua microservices (`gateway`, `ai-service`, `auth-service`, `frontend`).
3. **Integration Test:** Menjalankan layanan secara lokal (GitHub Runner) menggunakan `docker compose` untuk memastikan layanan dapat saling berkomunikasi secara sehat sebelum dirilis.
4. **Deploy to Railway:**
   - Menggunakan Railway CLI (`railway up --service <nama_layanan>`) untuk mengunggah dan mendeploy container langsung dari spesifikasi folder source masing-masing.
   - **Automated Health Check:** CI akan menunggu (polling) endpoint `/health` dari Frontend dan Gateway. Pipeline hanya akan ditandai *Success* (hijau) jika HTTP response mengembalikan status sehat (seperti 200 OK).

## Komunikasi Internal (Private Network)
Railway otomatis menyediakan nama host internal untuk layanan di dalam satu environment yang sama dengan format `<nama_layanan>.railway.internal`.
Pada proyek ini, Gateway secara dinamis memanfaatkan nama host tersebut untuk meneruskan traffic:
- `http://auth-service.railway.internal:8001`
- `http://ai-service.railway.internal:8002`

Pendekatan ini sangat aman karena Auth Service dan AI Service tidak terekspos langsung ke internet public, melainkan dilindungi di balik layanan Gateway dan sistem otorisasi.
