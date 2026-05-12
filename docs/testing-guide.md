    #  Buku Panduan Testing

Dokumen ini adalah Standar Operasional Prosedur (SOP) untuk menjalankan, membaca, dan memvalidasi *automated testing* (CI) pada proyek STEAM. Sebagai Lead QA & Docs, dokumen ini berfungsi sebagai acuan kelayakan kode sebelum digabungkan ke branch utama.

## 1. Cara Menjalankan Test Secara Lokal

Sebelum melakukan `push` atau `Pull Request`, setiap *developer* **WAJIB** memastikan kodenya lolos pengujian secara lokal di laptop masing-masing untuk menjaga integritas pipeline CI.

> ⚠️ **PENTING:** Perintah pengujian harus dijalankan di dalam folder modul masing-masing (`backend/` atau `frontend/`).

### A. Testing Backend (Python / FastAPI)
Kita menggunakan `pytest` untuk backend. Audit terakhir menunjukkan sistem memiliki **11 unit test**.

1. Buka terminal dan masuk ke folder backend dengan mengetik :
   cd backend
2. Lalu ketik `pytest`
3. maka hasil yang didapat sebagai berikut :
   berikut adalah interpretasi dari log terminal yang muncul:
* Collected 11 items: Sistem berhasil mendeteksi  total 11 skenario pengujian otomatis di dalam folder tests/.
* Indikator Titik (.): Setiap tanda titik melambangkan satu unit test yang berstatus PASSED.
* test_auth.py ....... (7 passed): Memastikan sistem registrasi, login, dan token keamanan berfungsi 100%.
* test_chat.py .. (2 passed): Memastikan integrasi fitur chat AI tidak memiliki kendala logika.
* test_health.py .. (2 passed): Memastikan endpoint kesehatan sistem merespon dengan cepat.
* 11 passed, 7 warnings: Seluruh test utama LULUS. Namun, terdapat 7 peringatan (warnings) mengenai library yang perlu di-update (seperti Pydantic dan Google Generative AI). Hal ini tidak menggagalkan pengujian, tetapi menjadi catatan bagi tim untuk pemeliharaan ke depan.
* Execution Time (27.49s): Total waktu yang dibutuhkan mesin untuk memvalidasi seluruh logika backend.

### B. Testing Frontend (React / Vite)
Kita menggunakan **Vitest** untuk memvalidasi komponen UI. Minimal terdapat 3 skenario pengujian.

1. Buka terminal dan masuk ke folder frontend: `cd frontend`
2. Jalankan perintah:
   ```bash
   npm install
   npm test
3. hasil analisis yang didapat adalah sebagai berikut :
   
![Hasil Testing Frontend](docs/images/npmtest.jpeg)

* Test Files (3 passed): Tiga area utama (API,      Header, dan Chat History) telah divalidasi.
* Tests (12 passed): Terdapat 12 ekspektasi fungsional (seperti "tombol harus muncul" atau "data harus ter-render") yang semuanya berstatus LULUS.
* ✓ Checkmark: Menandakan tidak ada regresi (kerusakan kode) pada komponen UI saat dilakukan build terbaru.
* Duration (3.43s): Kecepatan eksekusi test yang sangat efisien untuk pengujian tingkat komponen.

| Kategori | Status | Kuantitas | Keterangan |
| :--- | :--- | :--- | :--- |
| **Unit Test Backend** | ✅ PASSED | 11 Items | Lolos pengujian Auth, Chat, dan Health. |
| **Unit Test Frontend** | ✅ PASSED | 12 Items | Lolos pengujian API, Header, dan Chat Page. |