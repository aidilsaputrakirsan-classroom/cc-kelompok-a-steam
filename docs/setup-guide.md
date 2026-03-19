# Setup Guide — Cloud App Full-Stack (Backend FastAPI + Frontend React)

Panduan ini ditujukan untuk pengguna baru yang **belum pernah melihat proyek ini**.  
Ikuti langkah secara berurutan dari clone repository sampai aplikasi berjalan.

---

## 1) Prasyarat

Pastikan software berikut sudah terpasang:

- **Git**
- **Python 3.11+**
- **Node.js 18+** dan **npm**
- **PostgreSQL 14+** (atau versi yang kompatibel)
- (Opsional) **pgAdmin** / SQL client lain

Verifikasi cepat:

```bash
git --version
python --version
node --version
npm --version
psql --version
```

---

## 2) Clone Repository

```bash
git clone <URL_REPOSITORY_KALIAN>
cd cc-kelompok-a-cc-kelompok-5
```

> Ganti `<URL_REPOSITORY_KALIAN>` dengan URL GitHub repository tim.

---

## 3) Setup Database PostgreSQL

### 3.1 Buat database baru

Masuk ke PostgreSQL lalu buat database, contoh nama: `cloudapp`.

```sql
CREATE DATABASE cloudapp;
```

### 3.2 Pastikan kredensial DB valid

Catat:
- host (biasanya `localhost`)
- port (default `5432`)
- username (contoh `postgres`)
- password PostgreSQL kamu
- nama database (`cloudapp`)

---

## 4) Setup Backend (FastAPI)

Masuk ke folder backend:

```bash
cd backend
```

### 4.1 Buat virtual environment (disarankan)

```bash
python -m venv .venv
```

Aktifkan virtual environment:

**Windows (Git Bash):**
```bash
source .venv/Scripts/activate
```

**Linux/macOS:**
```bash
source .venv/bin/activate
```

### 4.2 Install dependency backend

```bash
pip install -r requirements.txt
```

### 4.3 Buat file `.env` backend

Buat file `backend/.env` (copy dari `.env.example` jika tersedia), lalu isi:

```env
# Database
DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@localhost:5432/cloudapp

# JWT
SECRET_KEY=your-random-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Generate secret key random (opsional, direkomendasikan):

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 4.4 Jalankan backend

Masih di folder `backend/`:

```bash
uvicorn main:app --reload --port 8000
```

Jika berhasil:
- API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

---

## 5) Setup Frontend (React + Vite)

Buka terminal baru, lalu masuk ke folder frontend dari root project:

```bash
cd frontend
```

### 5.1 Install dependency frontend

```bash
npm install
```

### 5.2 Buat file `.env` frontend

Buat `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

### 5.3 Jalankan frontend

```bash
npm run dev
```

Jika berhasil:
- Frontend: `http://localhost:5173`

---

## 6) Verifikasi End-to-End

1. Buka `http://localhost:5173`
2. Halaman login/register muncul
3. Register user baru
4. Login dengan akun tersebut
5. Coba fitur CRUD item (create, read, update, delete)
6. Logout, lalu login kembali
7. Pastikan backend tetap merespons di `http://localhost:8000/docs`

---

## 7) Struktur `.env` yang Dipakai

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://postgres:YOUR_DB_PASSWORD@localhost:5432/cloudapp
SECRET_KEY=your-random-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:8000
```

> Jangan commit file `.env` ke Git.  
> Yang boleh di-commit: `.env.example`.

---

## 8) Troubleshooting

### A. `CORS error` di browser
- Pastikan `ALLOWED_ORIGINS` di `backend/.env` berisi origin frontend:
  - `http://localhost:5173`
- Restart backend setelah ubah `.env`.

### B. `401 Unauthorized` saat akses `/items`
- Pastikan user sudah login dan token terkirim di header:
  - `Authorization: Bearer <token>`

### C. `Database connection failed`
- Cek `DATABASE_URL` (user, password, host, port, db name).
- Pastikan service PostgreSQL sedang berjalan.

### D. `Module not found` / dependency error
- Pastikan venv aktif sebelum `pip install -r requirements.txt`.
- Ulang install dependency backend/frontend.

### E. Port conflict
- Jika `8000` atau `5173` terpakai, stop proses lain atau ganti port run.

---

## 9) Alur Menjalankan Harian (Setelah Setup Pertama)

Setiap kali mulai kerja:

1. Jalankan backend di terminal 1 (`backend/`, venv aktif)
2. Jalankan frontend di terminal 2 (`frontend/`)
3. Buka `http://localhost:5173`

---

## 10) Catatan DevOps

- Gunakan `.env.example` sebagai template konfigurasi tim.
- Simpan secret hanya di `.env` lokal.
- Untuk production, gunakan CORS whitelist spesifik (bukan wildcard `*`).
- Pastikan semua anggota tim menggunakan versi dependency yang konsisten.
