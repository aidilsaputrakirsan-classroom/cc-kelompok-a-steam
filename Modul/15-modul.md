# MODUL 15: FINAL POLISH — SECURITY, CLEANUP & DOKUMENTASI

---

**Mata Kuliah:** Komputasi Awan  
**Program Studi:** Sistem Informasi - Institut Teknologi Kalimantan  
**SKS:** 3 (1 Kuliah + 2 Project)  
**Pertemuan:** 15 dari 16  
**Fase:** 🟣 Final & UAS (Minggu 15-16) — **Pertemuan Terakhir Sebelum UAS**  

---

## Prasyarat

Sebelum memulai pertemuan ini, pastikan:
- [x] Modul 14 selesai: monitoring, structured logging, dan metrics berfungsi
- [x] Semua fitur dari Modul 12-14 stabil dan terintegrasi
- [x] CI/CD pipeline passing di GitHub Actions
- [x] Sudah membaca OWASP Top 10 (Modul 14 Bagian D4)

> ⚠️ **Pertemuan ini adalah kesempatan TERAKHIR** untuk memperbaiki proyek sebelum UAS minggu depan. Fokus: security, kerapian kode, dokumentasi lengkap, dan persiapan presentasi. **Tidak ada fitur baru** — hanya perbaikan dan polish.

---

## Capaian Pembelajaran

### Sub-CPMK
Setelah menyelesaikan pertemuan ini, mahasiswa mampu:
1. Mengidentifikasi dan memperbaiki kerentanan keamanan dasar di aplikasi web
2. Menerapkan security best practices (rate limiting, input validation, HTTPS, secret management)
3. Melakukan code cleanup dan memastikan konsistensi kode
4. Menyusun dokumentasi proyek yang lengkap dan profesional
5. Menyiapkan presentasi teknis untuk demo UAS

### Indikator Pencapaian
- Tidak ada secret/password yang hardcoded di repository
- Rate limiting aktif di API Gateway
- Input validation terpasang di semua endpoint
- README lengkap mencakup arsitektur, setup, dan deployment
- Slide presentasi UAS siap (5-7 slide)
- Semua anggota tim memahami arsitektur dan bisa menjawab pertanyaan teknis

---

## Pembagian Fokus Tim Pertemuan Ini

| Peran | Fokus Utama | Juga Membantu |
|-------|-------------|---------------|
| **Lead Backend** | Security audit backend, input validation, error handling | Code review |
| **Lead Frontend** | UI polish, error boundaries, accessibility check | Slide presentasi |
| **Lead DevOps** | Rate limiting gateway, secret audit, production config | Deployment verify |
| **Lead QA & Docs** | Dokumentasi lengkap, README final, operations guide | Testing final |
| **Lead CI/CD** *(5 orang)* | CI pipeline final check, release tagging | Bantu dokumentasi |

---

# BAGIAN A: PEMBEKALAN TEORI (50 Menit)

## 1. Security di Cloud-Native Applications (20 menit)

### 1.1 Mengapa Security Penting?

Aplikasi yang di-deploy ke cloud bisa diakses oleh siapa saja di internet. Satu kerentanan bisa berarti:
- Data pengguna bocor (nama, email, password)
- Aplikasi diambil alih oleh attacker
- Biaya cloud membengkak (cryptomining, abuse)

> 💡 **Realita industri:**  
> Banyak kasus kebocoran data terjadi bukan karena serangan canggih, tapi karena hal sederhana: API key yang ter-commit ke GitHub, database tanpa password, atau endpoint tanpa autentikasi. Security bukan tentang menangkal hacker elite — tapi tentang tidak meninggalkan pintu terbuka.

### 1.2 OWASP Top 10 yang Relevan

Dari OWASP Top 10 Web Application Security Risks, berikut yang paling relevan untuk proyek kita:

```mermaid
flowchart TD
    subgraph OWASP ["🛡️ OWASP Top 10 — Yang Relevan"]
        A01["A01: Broken Access Control<br/>User bisa akses data orang lain"]
        A02["A02: Cryptographic Failures<br/>Password tersimpan plain text"]
        A03["A03: Injection<br/>SQL Injection, XSS"]
        A07["A07: Auth Failures<br/>Token tidak expire, brute force"]
        A09["A09: Security Logging<br/>Tidak ada log siapa melakukan apa"]
    end

    A01 --> FIX1["✅ Filter items by owner_id"]
    A02 --> FIX2["✅ bcrypt hashing + env vars"]
    A03 --> FIX3["✅ SQLAlchemy ORM + Pydantic"]
    A07 --> FIX4["✅ JWT expiry + rate limiting"]
    A09 --> FIX5["✅ Structured logging (Modul 14)"]

    style OWASP fill:#FBE5D6,stroke:#C00000
```

| OWASP Risk | Status di Proyek Kita | Perlu Diperbaiki? |
|------------|----------------------|-------------------|
| **A01: Broken Access Control** | Items sudah difilter by `owner_id` | ✅ Sudah aman |
| **A02: Cryptographic Failures** | Password di-hash dengan bcrypt | ⚠️ Cek SECRET_KEY tidak hardcoded |
| **A03: Injection** | SQLAlchemy ORM mencegah SQL injection | ⚠️ Cek input validation lengkap |
| **A07: Auth Failures** | JWT dengan expiry | ⚠️ Tambah rate limiting login |
| **A09: Security Logging** | Structured logging sudah ada | ✅ Sudah aman |

### 1.3 Security Checklist

Gunakan checklist ini untuk audit proyek:

```
SECRETS & CREDENTIALS
□ Tidak ada password/API key yang hardcoded di kode
□ .env tidak ter-commit ke Git (.gitignore)
□ .env.example hanya berisi placeholder, bukan nilai asli
□ SECRET_KEY menggunakan random string yang kuat
□ Database password berbeda antara dev dan production

AUTHENTICATION & AUTHORIZATION
□ JWT token memiliki expiry time
□ Password di-hash (bcrypt), tidak plain text
□ Login endpoint memiliki rate limiting
□ User hanya bisa akses data miliknya (owner_id check)

INPUT VALIDATION
□ Semua input divalidasi (Pydantic schemas)
□ Email divalidasi formatnya (EmailStr)
□ Price/quantity tidak boleh negatif
□ String length dibatasi (name max 200 char)

NETWORK & DEPLOYMENT
□ CORS hanya mengizinkan domain yang dikenal
□ Health dan metrics endpoint tidak mengexpose data sensitif
□ Docker images menggunakan versi spesifik (bukan :latest)
□ Production tidak menggunakan debug mode
```

---

## 2. Code Quality & Cleanup (15 menit)

### 2.1 Code Smells yang Umum

| Code Smell | Contoh | Solusi |
|------------|--------|--------|
| **Hardcoded values** | `SECRET_KEY = "abc123"` | Pindah ke environment variable |
| **Dead code** | Fungsi yang tidak dipanggil | Hapus atau komentari alasannya |
| **Inconsistent naming** | Mix `camelCase` dan `snake_case` | Pilih satu konvensi |
| **Missing error handling** | `response.json()` tanpa try/catch | Wrap dengan proper error handling |
| **Copy-paste code** | Logika sama di auth dan item service | Extract ke shared module |
| **TODO comments** | `# TODO: fix this later` | Selesaikan atau buat GitHub Issue |

### 2.2 Prinsip Clean Code untuk Project Akhir

1. **Consistency** — konvensi penamaan, format, dan struktur yang sama di semua services
2. **Documentation** — setiap file punya docstring yang menjelaskan fungsinya
3. **Error handling** — semua operasi yang bisa gagal memiliki error handling
4. **No secrets** — semua credential di environment variables
5. **Working tests** — semua test passing di CI

---

## 3. Dokumentasi Profesional (15 menit)

### 3.1 Apa yang Dinilai di UAS

```mermaid
flowchart LR
    subgraph UAS ["🎓 Komponen Penilaian UAS"]
        DEMO["🖥️ Live Demo<br/>25%"]
        ARCH["🏗️ Arsitektur & Kode<br/>20%"]
        CICD["🔄 CI/CD Pipeline<br/>15%"]
        VIVA["🎤 Individual Viva<br/>25%"]
        DOCS["📝 Dokumentasi & Reflection<br/>15%"]
    end

    DEMO --> D1["Aplikasi berjalan end-to-end"]
    ARCH --> D2["Microservices, CI/CD, monitoring"]
    DOCS --> D3["README, API docs, architecture diagram"]
    PRESENT --> D4["Jelaskan keputusan teknis, jawab pertanyaan"]

    style UAS fill:#DEEBF7,stroke:#2E75B6
```

### 3.2 README yang Lengkap

README harus mencakup:

1. **Project Overview** — apa aplikasinya, untuk siapa
2. **Architecture** — diagram microservices (mermaid/gambar)
3. **Tech Stack** — semua teknologi dan versinya
4. **Getting Started** — cara menjalankan dari nol (clone → up)
5. **API Documentation** — daftar semua endpoints
6. **Deployment** — cara deploy ke Railway/cloud
7. **Team** — anggota dan kontribusi masing-masing
8. **Project Journey** — evolusi dari monolith ke microservices

### 3.3 Slide Presentasi UAS (5-7 Slide)

| Slide | Isi | Waktu |
|-------|-----|-------|
| 1 | **Judul** — nama proyek, nama tim, logo | 30 detik |
| 2 | **Problem & Solution** — masalah yang diselesaikan | 1 menit |
| 3 | **Architecture Journey** — monolith → microservices | 2 menit |
| 4 | **Tech Stack & Infrastructure** — Docker, CI/CD, Railway, monitoring | 2 menit |
| 5 | **Live Demo** — register → login → CRUD → status page | 3 menit |
| 6 | **Challenges & Lessons Learned** — masalah yang dihadapi dan solusinya | 2 menit |
| 7 | **Kontribusi Tim** — siapa mengerjakan apa, metrics (commits, PRs) | 1 menit |

---

# BAGIAN B: WORKSHOP LAB (170 Menit)

## Workshop 15.1: Security Audit & Hardening (40 menit)

### Langkah 1: Secret Audit

```bash
# Cek apakah ada secret yang bocor di repository
# Cari hardcoded passwords, API keys, tokens
grep -rn "password\|secret\|token\|api_key" \
  --include="*.py" --include="*.yml" --include="*.yaml" \
  --include="*.js" --include="*.jsx" --include="*.env" \
  services/ frontend/ docker-compose.yml \
  | grep -v ".env.example" \
  | grep -v "node_modules" \
  | grep -v "__pycache__"
```

**Yang HARUS ditemukan dan diperbaiki:**
- `SECRET_KEY = "dev-secret-key..."` → ganti menjadi `os.getenv("SECRET_KEY")`
- Password default di docker-compose → gunakan `.env` file
- Token hardcoded di frontend test → hapus

### Langkah 2: Environment Variable Audit

Buat `.env.example` yang lengkap di root proyek:

File: `.env.example`

```bash
# ============================================
# Cloud App — Environment Variables
# ============================================
# Copy file ini ke .env dan isi dengan nilai yang sesuai
# JANGAN commit file .env ke repository!

# ---- GENERAL ----
ENVIRONMENT=development          # development | production

# ---- AUTH SERVICE ----
AUTH_DB_URL=postgresql://postgres:CHANGE_ME@auth-db:5432/auth_db
SECRET_KEY=CHANGE_ME_USE_RANDOM_STRING_MIN_32_CHARS
TOKEN_EXPIRE_MINUTES=30

# ---- ITEM SERVICE ----
ITEM_DB_URL=postgresql://postgres:CHANGE_ME@item-db:5432/item_db
AUTH_SERVICE_URL=http://auth-service:8001

# ---- DATABASE ----
POSTGRES_PASSWORD=CHANGE_ME

# ---- FRONTEND ----
VITE_API_URL=http://localhost

# ---- LOGGING ----
LOG_LEVEL=INFO                   # DEBUG | INFO | WARNING | ERROR
```

Verifikasi `.gitignore`:

```bash
# Pastikan .env ada di .gitignore
grep "\.env" .gitignore || echo ".env" >> .gitignore

# Cek apakah .env pernah ter-commit
git log --all --full-history -- "*.env" | head -5
```

### Langkah 3: Rate Limiting di Gateway

Update `services/gateway/nginx.conf` — tambahkan rate limiting:

```nginx
# Rate limiting zones (tambahkan di ATAS block server)
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=5r/s;
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;
limit_req_zone $binary_remote_addr zone=general_limit:10m rate=30r/s;

server {
    listen 80;
    server_name localhost;

    # Auth routes — ketat (5 request/detik, burst 10)
    location /auth/login {
        limit_req zone=auth_limit burst=10 nodelay;
        limit_req_status 429;
        proxy_pass http://auth_service/login;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Authorization $http_authorization;
    }

    location /auth/register {
        limit_req zone=auth_limit burst=5 nodelay;
        limit_req_status 429;
        proxy_pass http://auth_service/register;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Auth routes lainnya
    location /auth/ {
        limit_req zone=general_limit burst=20 nodelay;
        proxy_pass http://auth_service/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Authorization $http_authorization;
    }

    # Item routes — sedang (20 request/detik, burst 30)
    location /items {
        limit_req zone=api_limit burst=30 nodelay;
        limit_req_status 429;
        proxy_pass http://item_service/items;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Authorization $http_authorization;
    }

    # Health & metrics (no rate limit)
    location /auth/health {
        proxy_pass http://auth_service/health;
    }
    location /auth/metrics {
        proxy_pass http://auth_service/metrics;
    }
    location /items/health {
        proxy_pass http://item_service/health;
    }
    location /items/metrics {
        proxy_pass http://item_service/metrics;
    }
    location /health {
        default_type application/json;
        return 200 '{"status": "healthy", "service": "gateway"}';
    }

    # Frontend
    location / {
        limit_req zone=general_limit burst=50 nodelay;
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Custom error page untuk rate limit
    error_page 429 = @rate_limited;
    location @rate_limited {
        default_type application/json;
        return 429 '{"error": "Too many requests. Please try again later."}';
    }
}
```

**Penjelasan rate limiting:**

| Zone | Rate | Burst | Target |
|------|------|-------|--------|
| `auth_limit` | 5 req/s | 10 | Login/register — mencegah brute force |
| `api_limit` | 20 req/s | 30 | CRUD operations — penggunaan normal |
| `general_limit` | 30 req/s | 50 | Frontend dan route lainnya |

### Langkah 4: Input Validation Strengthening

Update `services/auth-service/schemas.py` — perkuat validasi:

```python
"""Pydantic schemas with strict validation."""
from pydantic import BaseModel, EmailStr, field_validator


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password minimal 8 karakter")
        if len(v) > 128:
            raise ValueError("Password maksimal 128 karakter")
        if not any(c.isupper() for c in v):
            raise ValueError("Password harus mengandung minimal 1 huruf besar")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password harus mengandung minimal 1 angka")
        return v

    @field_validator("name")
    @classmethod
    def validate_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError("Nama minimal 2 karakter")
        if len(v) > 200:
            raise ValueError("Nama maksimal 200 karakter")
        return v.strip()
```

Update `services/item-service/schemas.py` — perkuat validasi:

```python
"""Pydantic schemas with strict validation."""
from pydantic import BaseModel, field_validator
from typing import Optional


class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    price: float
    quantity: Optional[int] = 0

    @field_validator("name")
    @classmethod
    def validate_name(cls, v):
        if len(v.strip()) < 1:
            raise ValueError("Nama item tidak boleh kosong")
        if len(v) > 300:
            raise ValueError("Nama item maksimal 300 karakter")
        return v.strip()

    @field_validator("description")
    @classmethod
    def validate_description(cls, v):
        if v and len(v) > 2000:
            raise ValueError("Deskripsi maksimal 2000 karakter")
        return v

    @field_validator("price")
    @classmethod
    def validate_price(cls, v):
        if v < 0:
            raise ValueError("Harga tidak boleh negatif")
        if v > 999_999_999:
            raise ValueError("Harga terlalu besar")
        return round(v, 2)

    @field_validator("quantity")
    @classmethod
    def validate_quantity(cls, v):
        if v is not None and v < 0:
            raise ValueError("Quantity tidak boleh negatif")
        if v is not None and v > 999_999:
            raise ValueError("Quantity terlalu besar")
        return v
```

### Langkah 5: Test Rate Limiting

```bash
# Rebuild gateway
docker compose up -d --build gateway

# Test rate limiting login (>5 request/detik harus ditolak)
for i in $(seq 1 20); do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST http://localhost/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}')
  echo "Request $i: HTTP $STATUS"
done
# → Setelah beberapa request, harus muncul HTTP 429
```

> ✅ **Checkpoint:** Rate limiting aktif (429 muncul saat request berlebihan). Input validation menolak password lemah dan input negatif.

---

## Workshop 15.2: Code Cleanup (30 menit)

### Langkah 1: Hapus Dead Code dan TODO

```bash
# Cari semua TODO di codebase
grep -rn "TODO\|FIXME\|HACK\|XXX" \
  --include="*.py" --include="*.js" --include="*.jsx" \
  services/ frontend/src/

# Cari print() statements (harusnya pakai logger)
grep -rn "print(" --include="*.py" services/

# Cari console.log (harusnya dihapus di production)
grep -rn "console.log" --include="*.js" --include="*.jsx" frontend/src/
```

**Untuk setiap item yang ditemukan:**
- TODO → selesaikan sekarang, atau buat GitHub Issue jika out of scope
- `print()` → ganti dengan `logger.info()` atau `logger.debug()`
- `console.log` → hapus, atau ganti dengan conditional logging

### Langkah 2: Konsistensi Kode

Tambahkan konfigurasi formatter. 

File: `services/auth-service/pyproject.toml`

```toml
[tool.black]
line-length = 88
target-version = ["py312"]

[tool.isort]
profile = "black"
```

File: `services/item-service/pyproject.toml`

```toml
[tool.black]
line-length = 88
target-version = ["py312"]

[tool.isort]
profile = "black"
```

```bash
# Install formatter (optional, untuk yang sudah familiar)
pip install black isort --break-system-packages

# Format kode
cd services/auth-service && black . && isort .
cd ../item-service && black . && isort .
```

### Langkah 3: Docstrings Audit

Pastikan setiap file Python memiliki module-level docstring:

```bash
# Cari file Python tanpa docstring di baris pertama
for f in $(find services/ -name "*.py" -not -path "*/test*" -not -name "__init__.py"); do
  FIRST=$(head -1 "$f" | tr -d '[:space:]')
  if [[ "$FIRST" != '"""' && "$FIRST" != "'''" ]]; then
    echo "⚠️  Missing docstring: $f"
  fi
done
```

> ✅ **Checkpoint:** Tidak ada TODO yang tidak terselesaikan, tidak ada `print()`/`console.log`, semua file memiliki docstring.

---

## Workshop 15.3: Dokumentasi Final (35 menit)

### Langkah 1: Update README.md

File: `README.md` (di root repository)

```markdown
# ☁️ Cloud App — [Nama Proyek Tim]

> Aplikasi cloud-native untuk manajemen inventory, dibangun dengan arsitektur
> microservices sebagai proyek mata kuliah Komputasi Awan — Institut Teknologi
> Kalimantan.

![CI](https://github.com/[org]/[repo]/actions/workflows/ci.yml/badge.svg)
![CD](https://github.com/[org]/[repo]/actions/workflows/ci.yml/badge.svg?branch=main)

## 🏗️ Architecture

```mermaid
flowchart TD
    USER["👤 User"] --> GW["🚪 API Gateway<br/>Nginx"]
    GW -->|"/auth/*"| AUTH["🔐 Auth Service<br/>FastAPI :8001"]
    GW -->|"/items/*"| ITEM["📦 Item Service<br/>FastAPI :8002"]
    GW -->|"/"| FE["⚛️ Frontend<br/>React :3000"]
    AUTH --> ADB[("auth_db<br/>PostgreSQL")]
    ITEM --> IDB[("item_db<br/>PostgreSQL")]
    ITEM -.->|"HTTP /verify"| AUTH
```

### Architecture Evolution

| Phase | Weeks | Architecture |
|-------|-------|-------------|
| Foundation | 1-4 | Monolith (FastAPI + React + PostgreSQL) |
| Containerization | 5-7 | Docker Compose (3 containers) |
| CI/CD | 9-11 | GitHub Actions + Railway deployment |
| Microservices | 12-14 | 2 services + gateway + monitoring |
| Final | 15-16 | Security hardened + production ready |

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React + Vite | Single Page Application |
| Backend | FastAPI (Python) | REST API microservices |
| Database | PostgreSQL 16 | Relational database (per service) |
| Gateway | Nginx | Reverse proxy + rate limiting |
| Container | Docker + Docker Compose | Containerization |
| CI/CD | GitHub Actions | Automated test + deploy |
| Cloud | Railway | PaaS deployment |
| Monitoring | Custom metrics + dashboard | Observability |

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git

### Run Locally

```bash
# Clone repository
git clone https://github.com/[org]/[repo].git
cd [repo]

# Copy environment file
cp .env.example .env
# Edit .env with your values

# Start all services
docker compose up -d

# Verify
docker compose ps
curl http://localhost/health
```

Open http://localhost in your browser.

### Run Without Docker

```bash
# Backend (Auth Service)
cd services/auth-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8001

# Backend (Item Service)  
cd services/item-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8002

# Frontend
cd frontend
npm install
npm run dev
```

## 📡 API Documentation

### Auth Service (port 8001)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register user baru | ❌ |
| POST | `/login` | Login, return JWT token | ❌ |
| GET | `/verify` | Verify JWT token (internal) | ✅ |
| GET | `/health` | Health check | ❌ |
| GET | `/metrics` | Service metrics | ❌ |

### Item Service (port 8002)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/items` | List items (with search) | ✅ |
| POST | `/items` | Create item | ✅ |
| GET | `/items/{id}` | Get item by ID | ✅ |
| PUT | `/items/{id}` | Update item | ✅ |
| DELETE | `/items/{id}` | Delete item | ✅ |
| GET | `/items/stats` | Item statistics | ✅ |
| GET | `/health` | Health check | ❌ |
| GET | `/metrics` | Service metrics | ❌ |

### Via Gateway (port 80)

All requests go through the gateway with prefix:
- Auth: `http://localhost/auth/...`
- Items: `http://localhost/items/...`
- Status: `http://localhost/status`

## 🔐 Security

- JWT authentication with expiry
- bcrypt password hashing
- Rate limiting (Nginx): 5 req/s auth, 20 req/s API
- Input validation (Pydantic)
- CORS configured per environment
- Secrets via environment variables (never hardcoded)
- Database per service (no shared DB)

## 📊 Monitoring

- **Structured Logging**: JSON format with correlation ID
- **Metrics**: `/metrics` endpoint per service (request count, error rate, latency p50/p95/p99)
- **Health Dashboard**: `/status` page with auto-refresh
- **Circuit Breaker**: Item Service → Auth Service with retry + backoff

## 👥 Tim

| Nama | NIM | Peran | Kontribusi Utama |
|------|-----|-------|-----------------|
| [Nama] | [NIM] | Lead Backend | Auth Service, Item Service, API design |
| [Nama] | [NIM] | Lead Frontend | React UI, Status Page, UX |
| [Nama] | [NIM] | Lead DevOps | Docker, Nginx Gateway, Railway deploy |
| [Nama] | [NIM] | Lead QA & Docs | Testing, CI pipeline, documentation |

## 📄 Documentation

- [Architecture Guide](docs/architecture.md)
- [Deployment Guide](docs/deployment-guide.md)
- [Operations Guide](docs/operations-guide.md)
- [API Contract](docs/api-contract.md)
- [Release Notes](docs/release-notes-m3.md)

## 📅 Roadmap

| Week | Target | Status |
|------|--------|--------|
| 1 | Setup & Hello World | ✅ |
| 2 | REST API + Database | ✅ |
| 3 | React Frontend | ✅ |
| 4 | Full-Stack Integration + Auth | ✅ |
| 5-7 | Docker & Compose | ✅ |
| 8 | UTS Demo (Milestone 1) | ✅ |
| 9-11 | CI/CD & Cloud Deployment | ✅ |
| 12-14 | Microservices & Monitoring | ✅ |
| 15 | Final Polish & Security | ✅ |
| 16 | UAS Demo (Milestone 3) | ⬜ |
```

### Langkah 2: Buat Release Notes Milestone 3

File: `docs/release-notes-m3.md`

```markdown
# Release Notes — Milestone 3 (Final)

## Version: 3.0.0
**Release Date:** [Tanggal UAS]  
**Tag:** v3.0.0

## 🆕 Fitur Baru (dari Milestone 2)

### Microservices Architecture
- Monolith decomposed menjadi Auth Service + Item Service
- Database per service (auth_db, item_db)
- API Gateway (Nginx) sebagai entry point
- Inter-service communication via HTTP REST

### Reliability
- Retry logic dengan exponential backoff (3 retries)
- Circuit breaker pattern (5 failures → open, 30s cooldown)
- Graceful degradation saat Auth Service down

### Monitoring & Observability
- Structured JSON logging dengan correlation ID
- In-memory metrics (request count, error rate, latency percentiles)
- Health dashboard (/status) dengan auto-refresh
- Aggregated health check dengan dependency status

### Security Hardening
- Rate limiting di API Gateway (5 req/s auth, 20 req/s API)
- Input validation diperkuat (password strength, field limits)
- Secret audit — semua credentials di environment variables
- CORS dikonfigurasi per environment

## 📊 Statistik Proyek

| Metric | Nilai |
|--------|-------|
| Total Services | 6 (2 APIs, 2 DBs, frontend, gateway) |
| Total Endpoints | 12 |
| Unit Tests | [X] tests |
| Integration Tests | 8 tests |
| CI Pipeline Jobs | [X] jobs |
| Total Commits | [X] |
| Total PRs Merged | [X] |

## 🐛 Known Issues
- [List known issues jika ada]

## 👥 Kontribusi
| Nama | Commits | PRs | Areas |
|------|---------|-----|-------|
| [Nama] | [X] | [X] | Backend, Auth Service |
| [Nama] | [X] | [X] | Frontend, Dashboard |
| [Nama] | [X] | [X] | DevOps, Gateway, CI/CD |
| [Nama] | [X] | [X] | QA, Testing, Docs |
```

### Langkah 3: Buat API Contract

File: `docs/api-contract.md`

```markdown
# API Contract — Cloud App Microservices

## Base URLs

| Environment | Gateway URL |
|-------------|-------------|
| Local Development | http://localhost |
| Production | https://[your-app].up.railway.app |

## Authentication

All protected endpoints require JWT token in header:
```
Authorization: Bearer <access_token>
```

Token diperoleh dari `POST /auth/login`.  
Token expire setelah 30 menit (configurable via TOKEN_EXPIRE_MINUTES).

## Error Response Format

Semua error menggunakan format yang konsisten:
```json
{
    "detail": "Error message description"
}
```

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 201 | Created |
| 204 | Deleted (no content) |
| 400 | Bad request / validation error |
| 401 | Unauthorized / invalid token |
| 404 | Resource not found |
| 422 | Validation error (Pydantic) |
| 429 | Rate limited |
| 503 | Service unavailable |

## Auth Service Endpoints

### POST /auth/register
- **Rate limit**: 5 req/s
- **Body**: `{"email": "str", "password": "str (min 8, 1 uppercase, 1 digit)", "name": "str"}`
- **Response 201**: `{"id": int, "email": "str", "name": "str"}`

### POST /auth/login
- **Rate limit**: 5 req/s
- **Body**: `{"email": "str", "password": "str"}`
- **Response 200**: `{"access_token": "str", "token_type": "bearer"}`

### GET /auth/verify
- **Internal**: Dipanggil oleh service lain, bukan frontend
- **Header**: `Authorization: Bearer <token>`
- **Response 200**: `{"user_id": int, "email": "str", "name": "str"}`

## Item Service Endpoints

### GET /items?search=&skip=0&limit=20
- **Auth**: Required
- **Response 200**: `{"total": int, "items": [ItemResponse]}`

### POST /items
- **Auth**: Required
- **Body**: `{"name": "str", "description": "str?", "price": float, "quantity": int?}`
- **Response 201**: ItemResponse

### GET /items/{id}
- **Auth**: Required
- **Response 200**: ItemResponse

### PUT /items/{id}
- **Auth**: Required
- **Body**: Partial update (any field from ItemCreate)
- **Response 200**: ItemResponse

### DELETE /items/{id}
- **Auth**: Required
- **Response 204**: No content
```

> ✅ **Checkpoint:** README lengkap, release notes ditulis, API contract terdokumentasi.

---

## Workshop 15.4: Persiapan Presentasi UAS (35 menit)

### Langkah 1: Buat Outline Presentasi

Diskusikan dengan tim dan isi outline ini:

File: `docs/uas-presentation-outline.md`

```markdown
# UAS Presentation Outline

## Slide 1: Title
- Nama proyek: ___
- Nama tim: ___
- Anggota: ___

## Slide 2: Problem & Solution
- Masalah yang diselesaikan: ___
- Target pengguna: ___
- Solusi: ___

## Slide 3: Architecture Journey
- Week 1-4: Monolith (1 backend, 1 DB) → [screenshot/diagram]
- Week 5-7: Containerized (Docker Compose) → [diagram]
- Week 9-11: CI/CD (GitHub Actions + Railway) → [screenshot]
- Week 12-14: Microservices (2 services + gateway) → [diagram]

## Slide 4: Tech Stack & Infrastructure
- Diagram arsitektur final
- Jumlah containers, services, endpoints
- CI/CD pipeline flow
- Monitoring & observability

## Slide 5: Live Demo
- Flow: Open app → register → login → create items → view items
  → update → delete → check /status page → show CI/CD badge
- Backup: recorded video jika internet bermasalah

## Slide 6: Challenges & Lessons Learned
- Challenge 1: ___  → Solution: ___
- Challenge 2: ___  → Solution: ___
- Challenge 3: ___  → Solution: ___
- Biggest learning: ___

## Slide 7: Team Contributions
- [Nama] — [Role] — [Key contributions] — [X commits, X PRs]
- [Nama] — ...
- [Nama] — ...
- [Nama] — ...

## Demo Script (urutan langkah)
1. Buka http://localhost (atau production URL)
2. Register user baru
3. Login
4. Create 2-3 items
5. Show item list
6. Update item
7. Delete item
8. Buka /status — show health + metrics
9. Show GitHub → CI/CD pipeline green
10. Show structured logs (docker compose logs)
```

### Langkah 2: Persiapan Demo Backup

```bash
# Rekam demo sebagai backup (jika internet bermasalah saat UAS)
# Gunakan screen recording tool (OBS, Loom, atau built-in screen recorder)

# Pastikan semua services running
docker compose up -d
docker compose ps

# Test full flow
# 1. Register
curl -X POST http://localhost/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"DemoPass123","name":"Demo User"}'

# 2. Login
curl -X POST http://localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"DemoPass123"}'

# 3. Gunakan token untuk CRUD
# ... (jalankan full CRUD cycle)

# 4. Check health & metrics
curl http://localhost/health
curl http://localhost/auth/metrics
curl http://localhost/items/metrics
```

### Langkah 3: Latihan Presentasi

**Pembagian presenter:**

| Slide | Presenter | Durasi |
|-------|-----------|--------|
| 1-2 | Lead QA & Docs | 1.5 menit |
| 3 | Lead DevOps | 2 menit |
| 4 | Lead CI/CD atau Lead DevOps | 2 menit |
| 5 (Demo) | Lead Backend + Lead Frontend | 3 menit |
| 6-7 | Semua (round-robin) | 3 menit |

> 📝 **Tips presentasi:**
> - Setiap anggota harus bisa menjelaskan **keseluruhan arsitektur**, bukan hanya bagiannya
> - Siapkan jawaban untuk pertanyaan umum dosen: "Mengapa pakai microservices?", "Apa kelebihan/kekurangan?", "Jika user 10x lipat, service mana yang di-scale?"
> - Demo live lebih impresif dari screenshot — tapi selalu siapkan backup video

> ✅ **Checkpoint:** Outline presentasi lengkap, pembagian presenter ditentukan.

---

## Workshop 15.5: Final Verification (20 menit)

### Full System Test

Jalankan checklist ini dan pastikan semua hijau:

```bash
echo "============================================"
echo "  FINAL VERIFICATION CHECKLIST"
echo "============================================"

# 1. Docker Compose
echo ""
echo "1. Docker Compose..."
docker compose up -d
sleep 10
RUNNING=$(docker compose ps --format json | grep -c '"running"')
echo "   Containers running: $RUNNING/6"

# 2. Health checks
echo ""
echo "2. Health checks..."
GW=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health)
AUTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/auth/health)
echo "   Gateway: $GW"
echo "   Auth Service: $AUTH"

# 3. Register + Login
echo ""
echo "3. Auth flow..."
REG=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"final-$(date +%s)@test.com\",\"password\":\"FinalTest123\",\"name\":\"Final\"}")
echo "   Register: $REG"

# 4. Metrics
echo ""
echo "4. Metrics..."
METRICS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/auth/metrics)
echo "   Auth Metrics: $METRICS"

# 5. Frontend
echo ""
echo "5. Frontend..."
FE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost)
echo "   Frontend: $FE"

# 6. CI Status
echo ""
echo "6. CI/CD..."
echo "   Check: https://github.com/[org]/[repo]/actions"

echo ""
echo "============================================"
echo "  VERIFICATION COMPLETE"
echo "============================================"
```

### Git Tag Release

```bash
# Pastikan semua changes sudah di-commit dan merged ke main
git checkout main
git pull origin main

# Tag release final
git tag -a v3.0.0 -m "Release v3.0.0 — Final Project (UAS)

Features:
- Microservices architecture (Auth + Item Service)
- API Gateway (Nginx) with rate limiting
- CI/CD pipeline (GitHub Actions)
- Cloud deployment (Railway)
- Monitoring & observability (structured logging, metrics, dashboard)
- Security hardened (rate limiting, input validation, secret management)"

git push origin v3.0.0
```

> ✅ **Checkpoint Akhir Workshop:** Semua verifikasi passing, tag v3.0.0 dibuat.

---

## Workshop 15.6: Commit Final (10 menit)

```bash
git checkout -b feature/final-polish

git add .env.example
git add services/gateway/nginx.conf
git add services/auth-service/schemas.py
git add services/item-service/schemas.py
git add services/auth-service/pyproject.toml
git add services/item-service/pyproject.toml
git add README.md
git add docs/release-notes-m3.md
git add docs/api-contract.md
git add docs/uas-presentation-outline.md

git commit -m "chore: final polish — security, docs, UAS preparation

- Add rate limiting to Nginx gateway (5 req/s auth, 20 req/s API)
- Strengthen input validation (password, price, quantity limits)
- Complete .env.example with all variables
- Update README with full architecture, API docs, team info
- Add release notes v3.0.0 (Milestone 3)
- Add API contract documentation
- Add UAS presentation outline
- Add pyproject.toml for code formatting config"

git push origin feature/final-polish
```

PR → review → merge → `git tag v3.0.0`.

> ✅ **Semua selesai!** Proyek siap untuk UAS.

---

# BAGIAN C: TUGAS TERSTRUKTUR (60 Menit)

> 📝 **Tugas terakhir!** Kumpulkan sebelum UAS (pertemuan 16).

---

## Tugas 15: UAS Preparation

### Pembagian Tugas

| Anggota | Tugas | Detail |
|---------|-------|--------|
| **Lead Backend** | Finalisasi backend + siap jawab pertanyaan | Pastikan semua endpoint berfungsi. Siapkan jawaban: "Mengapa FastAPI?", "Bagaimana auth antar service?", "Apa yang terjadi jika Auth Service down?" |
| **Lead Frontend** | Finalisasi frontend + slide presentasi | Buat 5-7 slide (Google Slides/PowerPoint). Pastikan UI bersih dan responsive. Siapkan demo script. |
| **Lead DevOps** | Pastikan deployment production running | Verify Railway deployment. Test production URL berfungsi. Siapkan jawaban: "Bagaimana CI/CD flow?", "Bagaimana scaling?" |
| **Lead QA & Docs** | Review semua dokumentasi + final testing | Proofread README, API docs, release notes. Run full integration test. Buat `docs/final-checklist.md`. |
| **Lead CI/CD** *(5 orang)* | CI pipeline hijau + backup demo | Pastikan CI passing. Rekam video backup demo (3 menit). Upload ke Google Drive sebagai backup. |

### Final Checklist

Setiap tim harus memastikan semua item berikut selesai:

```
REPOSITORY
☐ README.md lengkap dan up-to-date
☐ .env.example mencakup semua environment variables
☐ .gitignore mencakup .env, __pycache__, node_modules
☐ Tidak ada secret/password hardcoded di kode
☐ Tag v3.0.0 sudah dibuat

CODE
☐ Semua services berjalan di Docker Compose
☐ Auth Service: register, login, verify berfungsi
☐ Item Service: CRUD + stats berfungsi
☐ Gateway: routing + rate limiting aktif
☐ Frontend: semua halaman berfungsi
☐ Health check + metrics endpoint tersedia
☐ Structured logging aktif (JSON format)
☐ Correlation ID diteruskan antar service

CI/CD
☐ GitHub Actions CI pipeline passing
☐ CD auto-deploy berfungsi (atau manual deploy working)
☐ Production URL accessible

DOKUMENTASI
☐ docs/architecture.md
☐ docs/deployment-guide.md
☐ docs/api-contract.md
☐ docs/release-notes-m3.md

PRESENTASI
☐ Slide 5-7 slide siap
☐ Demo script tertulis
☐ Backup video demo (jika internet bermasalah)
☐ Setiap anggota tahu perannya di presentasi
☐ Setiap anggota bisa menjelaskan arsitektur keseluruhan
```

### Informasi Pengumpulan

| Item | Keterangan |
|------|------------|
| **Deadline** | Sebelum UAS (pertemuan 16) dimulai |
| **Format** | Repository GitHub final + slide presentasi (link di README) |
| **Yang dinilai** | Kelengkapan, kerapian, profesionalisme, kesiapan demo |

---

# BAGIAN D: BELAJAR MANDIRI (230 Menit)

> 📚 **Fokus: persiapan UAS dan review seluruh materi semester.**

---

## D1. Review Materi Semester (90 menit)

Review semua konsep kunci yang bisa ditanyakan dosen saat UAS:

| Minggu | Konsep | Pertanyaan yang Mungkin Muncul |
|--------|--------|-------------------------------|
| 1 | Cloud Computing, IaaS/PaaS/SaaS | "Railway termasuk model layanan apa? Mengapa?" |
| 2-4 | REST API, CRUD, Auth | "Jelaskan alur autentikasi JWT di aplikasi Anda" |
| 5-7 | Docker, Compose | "Apa bedanya Docker image dan container?" |
| 9-11 | CI/CD, GitHub Actions | "Apa yang terjadi saat Anda merge PR ke main?" |
| 12-13 | Microservices | "Mengapa memisahkan Auth dan Item Service?" |
| 14 | Monitoring | "Bagaimana Anda men-debug error di production?" |

### Pertanyaan Teknis yang Harus Bisa Dijawab Semua Anggota

1. Jelaskan arsitektur aplikasi Anda dari frontend sampai database
2. Apa perbedaan monolith dan microservices? Pro dan kontra masing-masing?
3. Bagaimana CI/CD pipeline bekerja di proyek ini?
4. Apa yang terjadi jika Auth Service down? Bagaimana Item Service menangani?
5. Apa itu 12-Factor App dan faktor mana yang sudah diterapkan?
6. Bagaimana secret/credential dikelola di proyek ini?
7. Jelaskan alur request: user klik "Create Item" → apa saja yang terjadi di balik layar?
8. Jika traffic meningkat 10x, service mana yang perlu di-scale dan mengapa?

---

## D2. Latihan Presentasi (60 menit)

1. **Dry run presentasi** — setiap anggota presentasi sesuai pembagian (timer 12 menit total)
2. **Q&A session** — saling tanya pertanyaan teknis
3. **Demo rehearsal** — jalankan demo dari awal sampai akhir, perhatikan timing

---

## D3. Latihan Mandiri (60 menit)

### Soal Pilihan Ganda

**1.** Rate limiting di API Gateway berfungsi untuk:
- [ ] a. Mempercepat response time
- [ ] b. Menghapus request yang tidak valid
- [ ] c. Mengenkripsi data yang dikirim ke backend
- [ ] d. Melindungi backend services dari request berlebihan dan brute force attack

**2.** Dalam 12-Factor App, konfigurasi (database URL, API key) harus disimpan di:
- [ ] a. Hardcoded di source code
- [ ] b. File konfigurasi yang di-commit ke Git
- [ ] c. Environment variables
- [ ] d. Database

**3.** OWASP Top 10 A01: Broken Access Control bisa terjadi jika:
- [ ] a. Password di-hash dengan bcrypt
- [ ] b. User bisa mengakses data user lain tanpa izin
- [ ] c. API menggunakan HTTPS
- [ ] d. Frontend menggunakan React

**4.** Git tag v3.0.0 digunakan untuk:
- [ ] a. Menandai titik rilis spesifik dalam riwayat commit agar bisa dirujuk kembali
- [ ] b. Menghapus versi lama dari repository
- [ ] c. Membuat branch baru
- [ ] d. Melakukan rollback otomatis

**5.** Saat presentasi UAS, jika ditanya "Jika traffic meningkat 10x, apa yang Anda lakukan?", jawaban terbaik adalah:
- [ ] a. Upgrade seluruh server ke hardware yang lebih kuat
- [ ] b. Tambah lebih banyak database
- [ ] c. Scale horizontal service yang paling banyak menerima traffic menggunakan container orchestration
- [ ] d. Ubah arsitektur kembali ke monolith

---

## D4. Persiapan UAS (20 menit)

### Checklist Sebelum UAS

```
TEKNIS
□ Production URL bisa diakses
□ Demo script sudah ditulis dan dipraktikkan
□ Backup video demo tersedia
□ Semua anggota sudah pull kode terbaru

PRESENTASI
□ Slide selesai dan tersedia (Google Slides/USB)
□ Pembagian presenter sudah ditentukan
□ Timer dipasang (max 12 menit presentasi + 8 menit Q&A)
□ Setiap anggota bisa menjelaskan arsitektur

MENTAL
□ Tidur cukup malam sebelumnya
□ Datang 15 menit lebih awal
□ Test internet/WiFi di ruang UAS
□ Laptop terisi penuh (bawa charger)
```

> 💡 **Minggu depan adalah UAS!** Anda sudah membangun aplikasi cloud-native dari nol — dari Hello World sampai production-ready microservices. Bangga dengan perjalanan ini dan tunjukkan di presentasi Anda. Semangat! 🎓

---

---

*Modul ini disusun oleh Aidil Saputra Kirsan, Institut Teknologi Kalimantan.*
