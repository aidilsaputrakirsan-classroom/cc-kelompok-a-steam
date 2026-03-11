# Environment Configuration - Lead DevOps

## 📋 Tugas Lead DevOps - Modul 3

Dokumentasi setup environment variables untuk frontend Inti Rupa project.

---

## ✅ Yang Sudah Dikerjakan

### 1. File `.env` (Development Environment)
**Lokasi:** `frontend/.env`

```env
VITE_API_URL=http://localhost:8000
```

> ⚠️ **Penting:** File ini **TIDAK di-commit** ke Git karena berisi konfigurasi lokal.

---

### 2. File `.env.example` (Template untuk Tim)
**Lokasi:** `frontend/.env.example`

```env
VITE_API_URL=http://localhost:8000
```

> ✅ File ini **di-commit** ke Git sebagai template untuk anggota tim lain.

---

### 3. Update `api.js` untuk Environment Variable
**Lokasi:** `frontend/src/services/api.js`

**Sebelum:**
```javascript
const API_URL = "http://localhost:8000"
```

**Sesudah:**
```javascript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"
```

**Penjelasan:**
- `import.meta.env.VITE_API_URL` → membaca dari `.env` file
- Prefix `VITE_` diperlukan untuk Vite framework
- `|| "http://localhost:8000"` → fallback jika `.env` tidak ada

---

### 4. Update `.gitignore`
**Lokasi:** `frontend/.gitignore`

Ditambahkan:
```ignore
# Environment variables
.env
.env.local
.env.*.local
```

Memastikan file `.env` tidak ter-commit ke repository.

---

## 🚀 Cara Menggunakan

### Untuk Developer Baru

1. **Clone repository**
   ```bash
   git clone <repo-url>
   cd frontend
   ```

2. **Copy `.env.example` ke `.env`**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` jika perlu**
   ```bash
   # Jika backend berjalan di port lain
   VITE_API_URL=http://localhost:9000
   ```

4. **Install dependencies & run**
   ```bash
   npm install
   npm run dev
   ```

---

## 🔧 Konfigurasi untuk Production

Untuk deployment ke production, update `.env` dengan URL backend production:

```env
VITE_API_URL=https://api.intirupa.com
```

Atau set environment variable di platform deployment (Vercel, Netlify, Railway):
```
VITE_API_URL=https://api.intirupa.com
```

---

## 📝 Environment Variables yang Tersedia

| Variable | Default | Deskripsi |
|----------|---------|-----------|
| `VITE_API_URL` | `http://localhost:8000` | URL backend API untuk fetch data |

### Menambah Variable Baru

1. Tambahkan di `.env` dan `.env.example`:
   ```env
   VITE_NEW_VARIABLE=value
   ```

2. Gunakan di kode:
   ```javascript
   const value = import.meta.env.VITE_NEW_VARIABLE
   ```

> ⚠️ **Penting:** Semua env var untuk Vite **harus** prefix `VITE_` agar bisa diakses di browser.

---

## ✅ Checklist Completion

- [x] Buat `frontend/.env` dengan `VITE_API_URL`
- [x] Buat `frontend/.env.example` sebagai template
- [x] Update `api.js` menggunakan `import.meta.env.VITE_API_URL`
- [x] Pastikan `.env` ada di `.gitignore`
- [x] Test frontend masih bisa connect ke backend
- [x] Dokumentasi setup selesai

---

## 🧪 Testing

### Test 1: Verifikasi Environment Variable Terbaca

Tambahkan log di `api.js`:
```javascript
console.log("API_URL:", import.meta.env.VITE_API_URL)
```

Buka browser console, seharusnya muncul:
```
API_URL: http://localhost:8000
```

### Test 2: Verifikasi `.env` Tidak Ter-commit

```bash
git status
```

File `.env` **tidak boleh** muncul di list "Changes not staged for commit".

File `.env.example` **harus** muncul di list untuk di-commit.

### Test 3: Test Koneksi API

1. Pastikan backend running: `http://localhost:8000/docs`
2. Buka frontend: `http://localhost:5173`
3. Data items harus muncul dari backend

---

## 🐛 Troubleshooting

### Issue: `VITE_API_URL` undefined

**Solusi:**
1. Restart dev server setelah edit `.env`
2. Pastikan variable prefix `VITE_`
3. Check typo di nama variable

### Issue: CORS error

**Solusi:**
1. Pastikan backend CORS config allow `http://localhost:5173`
2. Check `backend/main.py`:
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["*"],  # atau ["http://localhost:5173"]
       ...
   )
   ```

### Issue: `.env` ter-commit ke Git

**Solusi:**
```bash
# Remove from Git tracking
git rm --cached frontend/.env

# Verify .gitignore includes .env
cat frontend/.gitignore | grep .env
```

---

## 📚 Resources

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [React Environment Variables Best Practices](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [Security: Never commit .env files](https://12factor.net/config)

---

**Dikerjakan oleh:** Lead DevOps - Jonathan Cristopher Jetro  
**Tanggal:** March 11, 2026  
**Status:** ✅ Completed
