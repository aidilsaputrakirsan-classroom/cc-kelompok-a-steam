    #  Buku Panduan Testing

Dokumen ini adalah Standar Operasional Prosedur (SOP) untuk menjalankan, membaca, dan memvalidasi *automated testing* (CI) pada proyek STEAM. Sebagai Lead QA & Docs, dokumen ini berfungsi sebagai acuan kelayakan kode sebelum digabungkan ke branch utama.

## 1. Cara Menjalankan Test Secara Lokal

Sebelum melakukan `push` atau `Pull Request`, setiap *developer* **WAJIB** memastikan kodenya lolos pengujian secara lokal di laptop masing-masing untuk menjaga integritas pipeline CI.

> ⚠️ **PENTING:** Perintah pengujian harus dijalankan di dalam folder modul masing-masing (`backend/` atau `frontend/`).

### A. Testing Backend (Python / FastAPI)
Kita menggunakan `pytest` untuk backend. Audit terakhir menunjukkan sistem memiliki **17 unit test**.

1. Buka terminal dan masuk ke folder backend dengan mengetik :
   cd backend
2. Lalu ketik `pytest`
3. berikut adalah interpretasi dari log terminal yang muncul:
![Hasil Testing Backend](docs/images/pytest.png)

* **Collected 17 items:** Sistem berhasil mendeteksi dan menjalankan total **17 skenario pengujian** otomatis di dalam folder `tests/` (meningkat dari 11 skenario sebelumnya).
* **Indikator Titik (`.`):** Setiap tanda titik melambangkan satu unit test yang berstatus **PASSED** (Lolos).
* `test_auth.py .........` (**9 passed**): Peningkatan dari 7 test, memastikan skenario keamanan, registrasi, dan validasi token jauh lebih kuat.
* `test_chat.py ......` (**6 passed**): Peningkatan pesat dari 2 test, memastikan berbagai skenario respon fitur chat AI teruji dengan baik.
* `test_health.py ..` (**2 passed**): Memastikan pemantauan konektivitas dan kesehatan server tetap stabil.
* **17 passed, 7 warnings:** Seluruh 17 test utama **LULUS**. Peringatan library (*warnings*) yang muncul tetap sama (Pydantic, SQLAlchemy, dan depresiasi Google Generative AI) dan tidak mempengaruhi keabsahan status kelulusan sistem.
* **Execution Time (25.42s):** Eksekusi pengujian berjalan lebih efisien, memvalidasi lebih banyak test (17 items) dengan waktu yang lebih singkat dibanding sebelumnya (27.49s).



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
| **Unit Test Backend** | ✅ PASSED | 17 Items | Lolos pengujian Auth, Chat, dan Health. |
| **Unit Test Frontend** | ✅ PASSED | 12 Items | Lolos pengujian API, Header, dan Chat Page. |