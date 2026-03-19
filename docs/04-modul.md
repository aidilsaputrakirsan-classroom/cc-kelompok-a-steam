# MODUL 4: INTEGRASI FULL-STACK — CORS, ENV VARIABLES & JWT AUTH

---

**Mata Kuliah:** Komputasi Awan  
**Program Studi:** Sistem Informasi - Institut Teknologi Kalimantan  
**SKS:** 3 (1 Kuliah + 2 Project)  
**Pertemuan:** 4 dari 16  
**Fase:** 🟢 Foundation (Minggu 1-4) — **Pertemuan Terakhir Fase Foundation**  

---

## Prasyarat

Sebelum memulai pertemuan ini, pastikan:
- [x] Backend FastAPI + PostgreSQL berjalan (Modul 2)
- [x] Frontend React CRUD berjalan dan terhubung ke backend (Modul 3)
- [x] Tugas Modul 3 selesai (sorting, env var, atau toast)
- [x] Sudah membaca materi CORS & JWT (Modul 3 Bagian D4)

> ⚠️ **Ini adalah pertemuan terakhir fase Foundation.** Setelah minggu ini, di minggu 5 kita masuk ke Docker. Pastikan full-stack app Anda berjalan dengan solid sebelum melanjutkan.

---

## Capaian Pembelajaran

### Sub-CPMK
Setelah menyelesaikan pertemuan ini, mahasiswa mampu:
1. Memahami dan mengatasi masalah CORS pada komunikasi frontend-backend
2. Mengelola konfigurasi aplikasi menggunakan environment variables dengan aman
3. Mengimplementasikan autentikasi berbasis JWT (JSON Web Token)
4. Membangun alur register → login → protected endpoint secara end-to-end
5. Menerapkan protected routes di frontend

### Indikator Pencapaian
- CORS dikonfigurasi dengan benar (bukan wildcard `*` untuk production)
- Semua credentials/secrets tersimpan di `.env`, tidak ada hardcoded secret
- User bisa register, login, dan mendapat JWT token
- Endpoint CRUD dilindungi — hanya user terautentikasi yang bisa akses
- Frontend menyimpan token dan mengirimnya di setiap request

---

## Pembagian Fokus Tim Pertemuan Ini

| Peran | Fokus Utama | Juga Membantu |
|-------|-------------|---------------|
| **Lead Backend** | Implementasi JWT auth: register, login, protected endpoints | — |
| **Lead Frontend** | Implementasi login page, token storage, protected requests | — |
| **Lead DevOps** | Konfigurasi CORS & environment variables backend + frontend | Review `.env` files |
| **Lead QA & Docs** | Testing alur auth end-to-end, dokumentasi API auth | Update README |
| **Lead CI/CD** *(5 orang)* | Buat `.env.example` lengkap, dokumentasi setup guide | Bantu testing |

---

# BAGIAN A: PEMBEKALAN TEORI (50 Menit)

## 1. CORS — Cross-Origin Resource Sharing (15 menit)

### 1.1 Apa itu CORS?

**CORS** adalah mekanisme keamanan browser yang membatasi request HTTP dari satu origin (domain) ke origin lain yang berbeda.

```mermaid
flowchart LR
    subgraph SAME ["✅ Same Origin (Diizinkan)"]
        A1["localhost:5173"] -->|request| A2["localhost:5173"]
    end

    subgraph CROSS ["❌ Cross Origin (Diblokir)"]
        B1["localhost:5173<br/>(Frontend)"] -->|request| B2["localhost:8000<br/>(Backend)"]
    end

    subgraph CORS_FIX ["✅ Cross Origin + CORS Header"]
        C1["localhost:5173"] -->|request| C2["localhost:8000"]
        C2 -->|"Access-Control-Allow-Origin: localhost:5173"| C1
    end

    style SAME fill:#E2EFDA,stroke:#548235
    style CROSS fill:#FBE5D6,stroke:#C00000
    style CORS_FIX fill:#E2EFDA,stroke:#548235
```

> 💡 **Analogi:**  
> CORS seperti **daftar tamu di gedung kantor**. Orang dari dalam gedung (same origin) bisa bebas masuk. Orang dari luar (cross origin) akan ditolak security, KECUALI nama mereka ada di daftar tamu (CORS whitelist).

### 1.2 Kenapa Error CORS Muncul?

Frontend kita jalan di `localhost:5173`, backend di `localhost:8000`. Meskipun sama-sama `localhost`, **port berbeda = origin berbeda**. Browser akan memblokir request kecuali backend secara eksplisit mengizinkan.

### 1.3 CORS di Development vs Production

| Aspek | Development | Production |
|-------|-------------|------------|
| **allow_origins** | `["http://localhost:5173"]` | `["https://app.domain.com"]` |
| **Kenapa?** | Hanya frontend dev yang akses | Hanya domain production |
| **Risiko `*`** | Aman untuk development | ❌ Berbahaya! Semua domain bisa akses API |

> ⚠️ **Di Modul 1-3 kita pakai `allow_origins=["*"]`** untuk kemudahan. Hari ini kita akan memperbaikinya menjadi konfigurasi yang aman.

---

## 2. Environment Variables (10 menit)

### 2.1 Mengapa Environment Variables?

**Environment variables** memisahkan konfigurasi dari kode. Ini penting karena:

```mermaid
flowchart TD
    subgraph BAD ["❌ Hardcoded (Bahaya!)"]
        B1["SECRET_KEY = 'abc123'<br/>di dalam main.py"]
        B2["Push ke GitHub"]
        B3["🔓 Siapapun bisa lihat secret!"]
        B1 --> B2 --> B3
    end

    subgraph GOOD ["✅ Environment Variable (Aman)"]
        G1["SECRET_KEY di .env file"]
        G2[".env ada di .gitignore"]
        G3["🔒 Secret tidak pernah ke GitHub"]
        G1 --> G2 --> G3
    end

    style BAD fill:#FBE5D6,stroke:#C00000
    style GOOD fill:#E2EFDA,stroke:#548235
```

### 2.2 12-Factor App: Config

Salah satu prinsip **12-Factor App** (yang akan kita ikuti sepanjang semester): *"Store config in the environment"*. Konfigurasi yang berbeda antara environment (development, staging, production) harus disimpan di environment variables, bukan di kode.

### 2.3 Apa Saja yang Masuk .env?

| Masuk `.env` (Rahasia) | TIDAK masuk `.env` (Boleh di kode) |
|-------------------------|------------------------------------|
| Database URL & password | Port number (8000, 5173) |
| JWT secret key | API route paths (/items, /auth) |
| API keys pihak ketiga | UI labels & messages |
| Cloud deployment credentials | Library versions |
| CORS allowed origins | Business logic |

---

## 3. JWT Authentication (25 menit)

### 3.1 Apa itu Authentication vs Authorization?

| Konsep | Pertanyaan | Contoh |
|--------|------------|--------|
| **Authentication** | "Siapa kamu?" | Login dengan email & password |
| **Authorization** | "Boleh ngapain?" | Admin bisa hapus user, user biasa tidak |

### 3.2 Apa itu JWT?

**JWT (JSON Web Token)** adalah standar terbuka untuk mentransmisikan informasi secara aman antar pihak sebagai JSON object yang di-sign secara digital.

```mermaid
flowchart LR
    subgraph JWT ["🔐 JWT Token"]
        direction TB
        H["Header<br/>(algorithm, type)"]
        P["Payload<br/>(user_id, email, exp)"]
        S["Signature<br/>(verify keaslian)"]
    end

    H --- P --- S

    style JWT fill:#DEEBF7,stroke:#2E75B6
    style H fill:#E2D9F3,stroke:#7B68A5
    style P fill:#FFF2CC,stroke:#BF8F00
    style S fill:#E2EFDA,stroke:#548235
```

JWT terdiri dari 3 bagian yang di-encode Base64 dan digabung dengan titik:
```
eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoxfQ.signature
|_______ Header ______|.|_____ Payload _____|.|_ Sign _|
```

### 3.3 Alur JWT Authentication

```mermaid
sequenceDiagram
    participant FE as ⚛️ Frontend
    participant BE as 🐍 Backend
    participant DB as 🗄️ Database

    Note over FE,DB: 1. REGISTER
    FE->>BE: POST /auth/register {email, password, name}
    BE->>BE: Hash password (bcrypt)
    BE->>DB: INSERT user
    DB-->>BE: user created
    BE-->>FE: 201 {id, email, name}

    Note over FE,DB: 2. LOGIN
    FE->>BE: POST /auth/login {email, password}
    BE->>DB: SELECT user WHERE email
    DB-->>BE: user data
    BE->>BE: Verify password hash
    BE->>BE: Generate JWT token
    BE-->>FE: 200 {access_token, token_type}

    Note over FE,DB: 3. PROTECTED REQUEST
    FE->>FE: Simpan token di state
    FE->>BE: GET /items (Authorization: Bearer TOKEN)
    BE->>BE: Decode & verify JWT
    BE->>DB: Query data
    DB-->>BE: items
    BE-->>FE: 200 {items}

    Note over FE,DB: 4. EXPIRED / INVALID TOKEN
    FE->>BE: GET /items (expired token)
    BE->>BE: Token expired!
    BE-->>FE: 401 Unauthorized
    FE->>FE: Redirect ke login
```

### 3.4 Mengapa JWT untuk Cloud-Native?

JWT cocok untuk arsitektur cloud-native dan microservices karena:
1. **Stateless** — Server tidak perlu menyimpan session. Token berisi semua informasi yang dibutuhkan
2. **Scalable** — Karena stateless, bisa di-handle oleh server mana saja (cocok untuk horizontal scaling)
3. **Self-contained** — Token berisi info user, tidak perlu query database setiap request
4. **Cross-service** — Satu token bisa digunakan di banyak microservice

> 📝 **Catatan keamanan:** Di mata kuliah ini kita simpan token di React state (hilang saat refresh). Untuk production, ada metode lebih aman seperti **HTTP-only cookies**. Tapi untuk belajar konsep JWT, pendekatan ini sudah cukup.

---

## 5. Rangkuman Teori

```mermaid
mindmap
  root((🔗 FULL-STACK<br/>INTEGRATION))
    CORS
      Browser security mechanism
      Whitelist origins, bukan wildcard
      Dev vs Production config
    Environment Variables
      Pisahkan config dari kode
      .env + .gitignore
      12-Factor App prinsip III
    JWT Auth
      Authentication = Siapa kamu?
      Token = Header + Payload + Signature
      Stateless & Scalable
      Alur: Register → Login → Token → Protected
    Milestone
      Full-stack app dengan auth
      Siap untuk di-containerisasi minggu 5
```

---

# BAGIAN B: WORKSHOP DI LAB (170 Menit)


> ⚠️ **Pastikan backend dan frontend berjalan** di dua terminal terpisah sebelum memulai.

---

## Workshop 4.1: Konfigurasi Environment Variables (25 menit)

### Langkah 1: Update backend/.env

File: `backend/.env`
```
# Database
DATABASE_URL=postgresql://postgres:PASSWORD_ANDA@localhost:5432/cloudapp

# JWT
SECRET_KEY=ganti-dengan-random-string-panjang-minimal-32-karakter
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

> 💡 **Generate random secret key:**
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

File: `backend/.env.example`
```
# Database
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/cloudapp

# JWT
SECRET_KEY=your-secret-key-minimum-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS
ALLOWED_ORIGINS=http://localhost:5173
```

### Langkah 2: Update frontend/.env

File: `frontend/.env`
```
VITE_API_URL=http://localhost:8000
```

File: `frontend/.env.example`
```
VITE_API_URL=http://localhost:8000
```

### Langkah 3: Verifikasi .gitignore

```bash
# Pastikan .env terdaftar di .gitignore root
cat .gitignore | grep ".env"
# Harus ada: .env

# Jika belum, tambahkan
echo ".env" >> .gitignore
```

> ✅ **Checkpoint:** File `.env` ada di backend dan frontend. `.env.example` siap di-commit. `.env` di-ignore oleh Git.

---

## Workshop 4.2: CORS yang Benar + User Model (25 menit)

### Langkah 1: Install Dependencies Baru

Update file: `backend/requirements.txt`
```
fastapi==0.115.0
uvicorn==0.30.0
sqlalchemy==2.0.35
psycopg2-binary==2.9.9
python-dotenv==1.0.1
pydantic[email]==2.9.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
bcrypt==4.0.1
```

```bash
cd backend
pip install -r requirements.txt
```

### Langkah 2: Tambah User Model

Update file: `backend/models.py` — tambahkan di bawah class Item:

```python
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean
from sqlalchemy.sql import func
from database import Base


class Item(Base):
    """Model untuk tabel 'items'."""
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text, nullable=True)
    price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class User(Base):
    """Model untuk tabel 'users'."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

### Langkah 3: CORS dengan Whitelist

Kita akan update `main.py` nanti di Workshop 4.4 setelah semua komponen siap. Untuk sekarang, buat file auth terlebih dahulu.

---

## Workshop 4.3: JWT Auth Backend (40 menit)

### Arsitektur Auth

```mermaid
flowchart TD
    subgraph FILES ["📁 File Baru"]
        AUTH_UTIL["auth.py<br/>JWT utilities<br/>(create token, verify, hash)"]
        AUTH_SCHEMA["schemas.py<br/>+ UserCreate, UserResponse,<br/>Token, LoginRequest"]
        AUTH_CRUD["crud.py<br/>+ create_user, get_user_by_email,<br/>authenticate_user"]
        AUTH_ROUTE["main.py<br/>+ /auth/register, /auth/login,<br/>+ dependency: get_current_user"]
    end

    AUTH_UTIL --> AUTH_ROUTE
    AUTH_SCHEMA --> AUTH_ROUTE
    AUTH_CRUD --> AUTH_ROUTE

    style FILES fill:#DEEBF7,stroke:#2E75B6
```

### Langkah 1: Buat auth.py

File: `backend/auth.py`
```python
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from database import get_db
from models import User

load_dotenv()

# Konfigurasi dari environment variables
SECRET_KEY = os.getenv("SECRET_KEY", "fallback-secret-key-for-development")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme — FastAPI akan mencari header "Authorization: Bearer <token>"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ==================== PASSWORD ====================

def hash_password(password: str) -> str:
    """Hash password menggunakan bcrypt."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifikasi password terhadap hash."""
    return pwd_context.verify(plain_password, hashed_password)


# ==================== JWT TOKEN ====================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Buat JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode dan verifikasi JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau sudah expired",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ==================== DEPENDENCY ====================

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Dependency injection: ambil current user dari JWT token.
    Gunakan di endpoint yang butuh autentikasi.
    """
    payload = decode_token(token)
    user_id: int = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid",
        )

    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User tidak ditemukan",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun tidak aktif",
        )

    return user
```

### Langkah 2: Update schemas.py — Tambahkan Auth Schemas

Tambahkan di bagian bawah file `backend/schemas.py`:

```python
# ============================================================
# AUTH SCHEMAS
# ============================================================

class UserCreate(BaseModel):
    """Schema untuk registrasi user baru."""
    email: str = Field(..., examples=["user@student.itk.ac.id"])
    name: str = Field(..., min_length=2, max_length=100, examples=["Aidil Saputra"])
    password: str = Field(..., min_length=8, examples=["password123"])


class UserResponse(BaseModel):
    """Schema untuk response user (tanpa password)."""
    id: int
    email: str
    name: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    """Schema untuk login request."""
    email: str = Field(..., examples=["user@student.itk.ac.id"])
    password: str = Field(..., examples=["password123"])


class TokenResponse(BaseModel):
    """Schema untuk response setelah login berhasil."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
```

### Langkah 3: Update crud.py — Tambahkan User CRUD

Tambahkan di bagian bawah file `backend/crud.py`:

```python
from models import Item, User
from schemas import ItemCreate, ItemUpdate, UserCreate
from auth import hash_password, verify_password


# ==================== USER CRUD ====================

def create_user(db: Session, user_data: UserCreate) -> User:
    """Buat user baru dengan password yang di-hash."""
    # Cek apakah email sudah terdaftar
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        return None  # Email sudah dipakai

    db_user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=hash_password(user_data.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Autentikasi user: cek email & password."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user
```

> ⚠️ **Pastikan import di crud.py sudah benar.** Baris `from models import Item` harus diubah menjadi `from models import Item, User`, dan tambahkan import `UserCreate` serta fungsi auth.

---

## Workshop 4.4: Update main.py — Auth Endpoints + CORS Fix (40 menit)

### Flowchart Endpoint Lengkap

```mermaid
flowchart TD
    subgraph PUBLIC ["🔓 Public Endpoints (tanpa token)"]
        HEALTH["GET /health"]
        REGISTER["POST /auth/register"]
        LOGIN["POST /auth/login"]
    end

    subgraph PROTECTED ["🔒 Protected Endpoints (butuh token)"]
        GET_ME["GET /auth/me"]
        POST_ITEM["POST /items"]
        GET_ITEMS["GET /items"]
        GET_ITEM["GET /items/{id}"]
        PUT_ITEM["PUT /items/{id}"]
        DEL_ITEM["DELETE /items/{id}"]
    end

    CLIENT["🌐 Client"] --> PUBLIC
    CLIENT -->|"Authorization: Bearer TOKEN"| PROTECTED
    PROTECTED --> CHECK{"Token valid?"}
    CHECK -->|"✅ Ya"| PROCESS["Proses request"]
    CHECK -->|"❌ Tidak"| REJECT["401 Unauthorized"]

    style PUBLIC fill:#E2EFDA,stroke:#548235
    style PROTECTED fill:#FFF2CC,stroke:#BF8F00
    style REJECT fill:#FBE5D6,stroke:#C00000
```

Update file: `backend/main.py` (ganti seluruh isinya):

```python
import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, get_db
from models import Base, User
from schemas import (
    ItemCreate, ItemUpdate, ItemResponse, ItemListResponse,
    UserCreate, UserResponse, LoginRequest, TokenResponse,
)
from auth import create_access_token, get_current_user
import crud

load_dotenv()

# Buat semua tabel
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cloud App API",
    description="REST API untuk mata kuliah Komputasi Awan — SI ITK",
    version="0.4.0",
)

# ==================== CORS (FIXED) ====================
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
origins_list = [origin.strip() for origin in allowed_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== HEALTH CHECK ====================

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "0.4.0"}


# ==================== AUTH ENDPOINTS (PUBLIC) ====================

@app.post("/auth/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Registrasi user baru.
    
    - **email**: Email unik (akan digunakan untuk login)
    - **name**: Nama lengkap
    - **password**: Minimal 8 karakter
    """
    user = crud.create_user(db=db, user_data=user_data)
    if not user:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    return user


@app.post("/auth/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Login dan dapatkan JWT token.
    
    Token berlaku selama 60 menit (default).
    Gunakan token di header: `Authorization: Bearer <token>`
    """
    user = crud.authenticate_user(db=db, email=login_data.email, password=login_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Email atau password salah")

    token = create_access_token(data={"sub": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }


@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Ambil profil user yang sedang login."""
    return current_user


# ==================== ITEM ENDPOINTS (PROTECTED) ====================

@app.post("/items", response_model=ItemResponse, status_code=201)
def create_item(
    item: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Buat item baru. **Membutuhkan autentikasi.**"""
    return crud.create_item(db=db, item_data=item)


@app.get("/items", response_model=ItemListResponse)
def list_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ambil daftar items. **Membutuhkan autentikasi.**"""
    return crud.get_items(db=db, skip=skip, limit=limit, search=search)


@app.get("/items/{item_id}", response_model=ItemResponse)
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ambil satu item. **Membutuhkan autentikasi.**"""
    item = crud.get_item(db=db, item_id=item_id)
    if not item:
        raise HTTPException(status_code=404, detail=f"Item {item_id} tidak ditemukan")
    return item


@app.put("/items/{item_id}", response_model=ItemResponse)
def update_item(
    item_id: int,
    item: ItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update item. **Membutuhkan autentikasi.**"""
    updated = crud.update_item(db=db, item_id=item_id, item_data=item)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Item {item_id} tidak ditemukan")
    return updated


@app.delete("/items/{item_id}", status_code=204)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Hapus item. **Membutuhkan autentikasi.**"""
    success = crud.delete_item(db=db, item_id=item_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Item {item_id} tidak ditemukan")
    return None


# ==================== TEAM INFO ====================

@app.get("/team")
def team_info():
    return {
        "team": "cloud-team-XX",
        "members": [
            {"name": "Nama 1", "nim": "NIM1", "role": "Lead Backend"},
            {"name": "Nama 2", "nim": "NIM2", "role": "Lead Frontend"},
            {"name": "Nama 3", "nim": "NIM3", "role": "Lead DevOps"},
            {"name": "Nama 4", "nim": "NIM4", "role": "Lead QA & Docs"},
        ],
    }
```

### Test di Swagger UI

```bash
cd backend
uvicorn main:app --reload --port 8000
# Buka http://localhost:8000/docs
```

**Testing flow:**
1. `POST /auth/register` — buat user baru
2. `POST /auth/login` — login, copy `access_token` dari response
3. Klik tombol **"Authorize" 🔒** di Swagger UI → paste token → Authorize
4. Sekarang semua endpoint `/items` bisa diakses
5. Tanpa token → `GET /items` akan return 401

> ✅ **Checkpoint:** Auth flow bekerja di Swagger UI.

---

## Workshop 4.5: Frontend Auth — Login Page & Token (40 menit)

### Flowchart Frontend Auth

```mermaid
flowchart TD
    START([User buka app]) --> CHECK{Ada token<br/>di state?}
    CHECK -->|Tidak| LOGIN_PAGE["Tampilkan Login Page<br/>+ Tab Register"]
    CHECK -->|Ada| MAIN_PAGE["Tampilkan Main App<br/>(Header + CRUD)"]

    LOGIN_PAGE --> REG["User: Register"]
    LOGIN_PAGE --> LOG["User: Login"]
    REG -->|"POST /auth/register"| SUCCESS_REG["Berhasil → Otomatis login"]
    LOG -->|"POST /auth/login"| SUCCESS_LOG["Berhasil → Simpan token"]
    SUCCESS_REG --> SUCCESS_LOG
    SUCCESS_LOG --> MAIN_PAGE

    MAIN_PAGE --> LOGOUT["User: Logout"]
    LOGOUT --> CLEAR["Hapus token dari state"]
    CLEAR --> LOGIN_PAGE

    MAIN_PAGE --> API_CALL["Setiap API call<br/>sertakan Authorization header"]
    API_CALL --> TOKEN_CHECK{Token expired?}
    TOKEN_CHECK -->|Ya| LOGIN_PAGE
    TOKEN_CHECK -->|Tidak| RESPONSE["Proses response"]

    style LOGIN_PAGE fill:#FFF2CC,stroke:#BF8F00
    style MAIN_PAGE fill:#E2EFDA,stroke:#548235
```

### Langkah 1: Update api.js — Tambahkan Auth Functions

Update file: `frontend/src/services/api.js` (ganti seluruh isinya):

```javascript
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

// ==================== TOKEN MANAGEMENT ====================

let authToken = null

export function setToken(token) {
  authToken = token
}

export function getToken() {
  return authToken
}

export function clearToken() {
  authToken = null
}

function authHeaders() {
  const headers = {}
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`
  }
  return headers
}

// Helper: handle response errors
async function handleResponse(response) {
  if (response.status === 401) {
    clearToken()
    throw new Error("UNAUTHORIZED")
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || `Request gagal (${response.status})`)
  }
  // 204 No Content
  if (response.status === 204) return null
  return response.json()
}

// ==================== AUTH API ====================

export async function register(userData) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  })
  return handleResponse(response)
}

export async function login(email, password) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  const data = await handleResponse(response)
  setToken(data.access_token)
  return data
}

export async function getMe() {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: authHeaders(),
  })
  return handleResponse(response)
}

// ==================== ITEMS API ====================

export async function fetchItems(search = "", skip = 0, limit = 20) {
  const params = new URLSearchParams()
  if (search) params.append("search", search)
  params.append("skip", skip)
  params.append("limit", limit)

  const response = await fetch(`${API_URL}/items?${params}`, {
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function createItem(itemData) {
  const response = await fetch(`${API_URL}/items`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(itemData),
  })
  return handleResponse(response)
}

export async function updateItem(id, itemData) {
  const response = await fetch(`${API_URL}/items/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(itemData),
  })
  return handleResponse(response)
}

export async function deleteItem(id) {
  const response = await fetch(`${API_URL}/items/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  })
  return handleResponse(response)
}

export async function checkHealth() {
  try {
    const response = await fetch(`${API_URL}/health`)
    const data = await response.json()
    return data.status === "healthy"
  } catch {
    return false
  }
}
```

### Langkah 2: Buat LoginPage Component

File: `frontend/src/components/LoginPage.jsx`
```jsx
import { useState } from "react"

function LoginPage({ onLogin, onRegister }) {
  const [isRegister, setIsRegister] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (isRegister) {
        if (!formData.name.trim()) {
          setError("Nama wajib diisi")
          setLoading(false)
          return
        }
        if (formData.password.length < 8) {
          setError("Password minimal 8 karakter")
          setLoading(false)
          return
        }
        await onRegister(formData)
      } else {
        await onLogin(formData.email, formData.password)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h1 style={styles.title}>☁️ Cloud App</h1>
        <p style={styles.subtitle}>Komputasi Awan — SI ITK</p>

        {/* Tab Switch */}
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(isRegister ? {} : styles.tabActive) }}
            onClick={() => { setIsRegister(false); setError("") }}
          >
            Login
          </button>
          <button
            style={{ ...styles.tab, ...(isRegister ? styles.tabActive : {}) }}
            onClick={() => { setIsRegister(true); setError("") }}
          >
            Register
          </button>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {isRegister && (
            <div style={styles.field}>
              <label style={styles.label}>Nama Lengkap</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Nama Lengkap"
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@student.itk.ac.id"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimal 8 karakter"
              required
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.btnSubmit} disabled={loading}>
            {loading ? "⏳ Loading..." : isRegister ? "📝 Register" : "🔐 Login"}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F4E79",
    padding: "2rem",
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  card: {
    backgroundColor: "white",
    padding: "2.5rem",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "420px",
    boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
  },
  title: {
    textAlign: "center",
    margin: "0 0 0.25rem 0",
    color: "#1F4E79",
    fontSize: "2rem",
  },
  subtitle: {
    textAlign: "center",
    color: "#888",
    margin: "0 0 1.5rem 0",
    fontSize: "0.9rem",
  },
  tabs: {
    display: "flex",
    marginBottom: "1.5rem",
    borderRadius: "8px",
    overflow: "hidden",
    border: "2px solid #e0e0e0",
  },
  tab: {
    flex: 1,
    padding: "0.7rem",
    border: "none",
    backgroundColor: "#f0f0f0",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontWeight: "bold",
    color: "#888",
  },
  tabActive: {
    backgroundColor: "#1F4E79",
    color: "white",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
  },
  label: {
    fontSize: "0.85rem",
    fontWeight: "bold",
    color: "#555",
  },
  input: {
    padding: "0.75rem 1rem",
    border: "2px solid #ddd",
    borderRadius: "8px",
    fontSize: "1rem",
    outline: "none",
  },
  btnSubmit: {
    padding: "0.8rem",
    backgroundColor: "#548235",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
    fontWeight: "bold",
    marginTop: "0.5rem",
  },
  error: {
    backgroundColor: "#FBE5D6",
    color: "#C00000",
    padding: "0.6rem 1rem",
    borderRadius: "6px",
    marginBottom: "0.5rem",
    fontSize: "0.9rem",
    textAlign: "center",
  },
}

export default LoginPage
```

### Langkah 3: Update Header — Tambahkan User Info & Logout

Update file: `frontend/src/components/Header.jsx` (ganti seluruh isinya):

```jsx
function Header({ totalItems, isConnected, user, onLogout }) {
  return (
    <header style={styles.header}>
      <div>
        <h1 style={styles.title}>☁️ Cloud App</h1>
        <p style={styles.subtitle}>Komputasi Awan — SI ITK</p>
      </div>
      <div style={styles.right}>
        <div style={styles.stats}>
          <span style={styles.badge}>{totalItems} items</span>
          <span style={{
            ...styles.status,
            backgroundColor: isConnected ? "#E2EFDA" : "#FBE5D6",
            color: isConnected ? "#548235" : "#C00000",
          }}>
            {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
          </span>
        </div>
        {user && (
          <div style={styles.user}>
            <span style={styles.userName}>👤 {user.name}</span>
            <button onClick={onLogout} style={styles.btnLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1.5rem 2rem",
    backgroundColor: "#1F4E79",
    color: "white",
    borderRadius: "12px",
    marginBottom: "1.5rem",
  },
  title: { margin: 0, fontSize: "1.8rem" },
  subtitle: { margin: "0.25rem 0 0 0", fontSize: "0.9rem", opacity: 0.8 },
  right: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" },
  stats: { display: "flex", gap: "0.5rem", alignItems: "center" },
  badge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: "0.3rem 0.7rem",
    borderRadius: "20px",
    fontSize: "0.8rem",
  },
  status: { padding: "0.3rem 0.7rem", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "bold" },
  user: { display: "flex", gap: "0.5rem", alignItems: "center" },
  userName: { fontSize: "0.85rem", opacity: 0.9 },
  btnLogout: {
    padding: "0.3rem 0.8rem",
    backgroundColor: "rgba(255,255,255,0.2)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.8rem",
  },
}

export default Header
```

### Langkah 4: Update App.jsx — Auth Integration

Update file: `frontend/src/App.jsx` (ganti seluruh isinya):

```jsx
import { useState, useEffect, useCallback } from "react"
import Header from "./components/Header"
import SearchBar from "./components/SearchBar"
import ItemForm from "./components/ItemForm"
import ItemList from "./components/ItemList"
import LoginPage from "./components/LoginPage"
import {
  fetchItems, createItem, updateItem, deleteItem,
  checkHealth, login, register, setToken, clearToken,
} from "./services/api"

function App() {
  // ==================== AUTH STATE ====================
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // ==================== APP STATE ====================
  const [items, setItems] = useState([])
  const [totalItems, setTotalItems] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [searchQuery, setSearchQuery] = useState("")

  // ==================== LOAD DATA ====================
  const loadItems = useCallback(async (search = "") => {
    setLoading(true)
    try {
      const data = await fetchItems(search)
      setItems(data.items)
      setTotalItems(data.total)
    } catch (err) {
      if (err.message === "UNAUTHORIZED") {
        handleLogout()
      }
      console.error("Error loading items:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkHealth().then(setIsConnected)
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      loadItems()
    }
  }, [isAuthenticated, loadItems])

  // ==================== AUTH HANDLERS ====================

  const handleLogin = async (email, password) => {
    const data = await login(email, password)
    setUser(data.user)
    setIsAuthenticated(true)
  }

  const handleRegister = async (userData) => {
    // Register lalu otomatis login
    await register(userData)
    await handleLogin(userData.email, userData.password)
  }

  const handleLogout = () => {
    clearToken()
    setUser(null)
    setIsAuthenticated(false)
    setItems([])
    setTotalItems(0)
    setEditingItem(null)
    setSearchQuery("")
  }

  // ==================== ITEM HANDLERS ====================

  const handleSubmit = async (itemData, editId) => {
    try {
      if (editId) {
        await updateItem(editId, itemData)
        setEditingItem(null)
      } else {
        await createItem(itemData)
      }
      loadItems(searchQuery)
    } catch (err) {
      if (err.message === "UNAUTHORIZED") handleLogout()
      else throw err
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleDelete = async (id) => {
    const item = items.find((i) => i.id === id)
    if (!window.confirm(`Yakin ingin menghapus "${item?.name}"?`)) return
    try {
      await deleteItem(id)
      loadItems(searchQuery)
    } catch (err) {
      if (err.message === "UNAUTHORIZED") handleLogout()
      else alert("Gagal menghapus: " + err.message)
    }
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
    loadItems(query)
  }

  // ==================== RENDER ====================

  // Jika belum login, tampilkan login page
  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} onRegister={handleRegister} />
  }

  // Jika sudah login, tampilkan main app
  return (
    <div style={styles.app}>
      <div style={styles.container}>
        <Header
          totalItems={totalItems}
          isConnected={isConnected}
          user={user}
          onLogout={handleLogout}
        />
        <ItemForm
          onSubmit={handleSubmit}
          editingItem={editingItem}
          onCancelEdit={() => setEditingItem(null)}
        />
        <SearchBar onSearch={handleSearch} />
        <ItemList
          items={items}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      </div>
    </div>
  )
}

const styles = {
  app: {
    minHeight: "100vh",
    backgroundColor: "#f0f2f5",
    padding: "2rem",
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  container: { maxWidth: "900px", margin: "0 auto" },
}

export default App
```

### 💡Troubleshooting Hint
```
Pastikan :
1. Header HTTP yang dikirim oleh frontend
2. Apakah request dengan body JSON sudah menyertakan header yang sesuai?
3. Gunakan tab Network di browser DevTools untuk mengecek detail request
```
### Jalankan & Test

```bash
# Terminal 1: Backend
cd backend && uvicorn main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend && npm run dev
```

> ✅ **Checkpoint:** Buka http://localhost:5173 → Login page muncul → Register user baru → Login → CRUD items bekerja → Logout → Kembali ke login page.

---

## Workshop 4.6: Testing End-to-End (20 menit)

### Checklist Testing

```mermaid
flowchart TD
    START([🟢 Buka localhost:5173]) --> SEE_LOGIN["1️⃣ Login page muncul?"]
    SEE_LOGIN --> REG["2️⃣ Register user baru"]
    REG --> AUTO_LOGIN["3️⃣ Otomatis login<br/>setelah register?"]
    AUTO_LOGIN --> SEE_ITEMS["4️⃣ Main app + items muncul?"]
    SEE_ITEMS --> SEE_USER["5️⃣ Nama user di header?"]
    SEE_USER --> CRUD["6️⃣ CRUD items masih berfungsi?"]
    CRUD --> LOGOUT["7️⃣ Klik Logout"]
    LOGOUT --> BACK_LOGIN["8️⃣ Kembali ke login page?"]
    BACK_LOGIN --> LOGIN["9️⃣ Login dengan akun tadi"]
    LOGIN --> DATA_PERSIST["🔟 Data items masih ada?"]
    DATA_PERSIST --> END([🟢 SEMUA PASS ✅])

    style START fill:#70AD47,color:#fff
    style END fill:#70AD47,color:#fff
```

---

## Workshop 4.7: Commit & Push (20 menit)

### Struktur File Baru/Updated

```
cloud-team-XX/
├── backend/
│   ├── main.py              ← Updated (auth endpoints, CORS fix)
│   ├── auth.py              ← BARU (JWT utilities)
│   ├── database.py
│   ├── models.py            ← Updated (+ User model)
│   ├── schemas.py           ← Updated (+ auth schemas)
│   ├── crud.py              ← Updated (+ user CRUD)
│   ├── requirements.txt     ← Updated (+ jose, passlib, bcrypt)
│   ├── .env                 ← Updated (+ JWT & CORS config)
│   └── .env.example         ← Updated
├── frontend/
│   ├── src/
│   │   ├── App.jsx              ← Updated (auth integration)
│   │   ├── components/
│   │   │   ├── Header.jsx       ← Updated (+ user info, logout)
│   │   │   ├── LoginPage.jsx    ← BARU
│   │   │   ├── SearchBar.jsx
│   │   │   ├── ItemForm.jsx
│   │   │   ├── ItemList.jsx
│   │   │   └── ItemCard.jsx
│   │   └── services/
│   │       └── api.js           ← Updated (+ auth, token mgmt)
│   ├── .env
│   └── .env.example
├── .gitignore
└── README.md
```

### Commit

```bash
# Lead Backend
git add backend/
git commit -m "feat: add JWT authentication

- Add auth.py: JWT token creation, verification, password hashing
- Add User model with email, hashed_password, is_active
- Add auth endpoints: POST /auth/register, POST /auth/login, GET /auth/me
- Protect all /items endpoints with get_current_user dependency
- Fix CORS: use whitelist from env var instead of wildcard"

git push origin main

# Lead Frontend
git pull origin main
git add frontend/
git commit -m "feat: add login/register UI and auth integration

- Add LoginPage component with register/login tabs
- Update api.js: token management, auth headers, error handling
- Update App.jsx: auth state, conditional rendering login vs main
- Update Header: show user name, add logout button"

git push origin main
```

---

# BAGIAN C: TUGAS TERSTRUKTUR (60 Menit)

> 📝 **Kumpulkan sebelum pertemuan 5** via push ke repository tim.
> 
> ⚠️ **Pertemuan 5 adalah Docker!** Pastikan full-stack app berjalan sempurna sebelum kita containerisasi.

---

## Tugas 4: Polish Full-Stack App & Dokumentasi

### Pembagian Tugas

| Anggota | Tugas | Detail |
|---------|-------|--------|
| **Lead Backend** | Tambah validasi: email format, password strength | Gunakan Pydantic regex validator. Tambah endpoint `GET /items/stats` jika belum. Pastikan error messages informatif. |
| **Lead Frontend** | Tambah **notifikasi** sukses/gagal + loading state | Tampilkan toast/alert setelah create/update/delete. Tambah spinner saat loading. |
| **Lead DevOps** | Buat `docs/setup-guide.md` | Langkah lengkap dari clone sampai running: install deps, setup DB, config .env, jalankan backend & frontend. Guide harus bisa diikuti oleh orang yang belum pernah lihat proyek ini. |
| **Lead QA & Docs** | Testing & update README.md | Test semua fitur (auth + CRUD). Update README: tambah section Authentication, API endpoint list lengkap. Catat bug jika ada. |
| **Lead CI/CD** *(5 orang)* | Buat `docs/api-documentation.md` | Dokumentasi semua endpoint: method, URL, request body, response, auth required?. Termasuk contoh curl command. |

### Deliverable Akhir Fase Foundation

Sebelum masuk ke Docker (minggu 5), pastikan:

```mermaid
flowchart TD
    subgraph CHECKLIST ["✅ Fase Foundation Checklist"]
        C1["Backend: FastAPI + PostgreSQL<br/>5+ endpoints CRUD<br/>JWT auth (register, login, protected)"]
        C2["Frontend: React SPA<br/>Login/Register page<br/>CRUD interface with search"]
        C3["Config: .env untuk semua secrets<br/>CORS whitelist (bukan wildcard)<br/>.env.example di-commit"]
        C4["Git: Semua anggota punya commit<br/>README lengkap<br/>Struktur folder rapi"]
    end

    C1 --> READY([🟢 SIAP DOCKER!])
    C2 --> READY
    C3 --> READY
    C4 --> READY

    style CHECKLIST fill:#E2EFDA,stroke:#548235
    style READY fill:#70AD47,color:#fff
```

### Informasi Pengumpulan

| Item | Keterangan |
|------|------------|
| **Deadline** | Sebelum pertemuan 5 dimulai |
| **Format** | Push ke repository tim |
| **Penilaian** | Fitur auth berfungsi end-to-end, dokumentasi lengkap, setiap anggota punya ≥1 commit |

---

# BAGIAN D: BELAJAR MANDIRI (230 Menit)

---

## D1. Membaca Referensi (60 menit)

### Bacaan Wajib
1. **JWT Introduction** — https://jwt.io/introduction  
   (Memahami struktur dan cara kerja JWT)

2. **Docker Get Started** — https://docs.docker.com/get-started/  
   (Persiapan minggu depan: apa itu Docker, container, image)

3. **12-Factor App — Factor III: Config** — https://12factor.net/config  
   (Prinsip menyimpan konfigurasi di environment)

### Bacaan Tambahan
- CORS Explained — https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- FastAPI Security Docs — https://fastapi.tiangolo.com/tutorial/security/
- OWASP Authentication Cheatsheet — https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

---

## D2. Video Tutorial (60 menit)

1. **"JWT Authentication Explained"** — Web Dev Simplified (YouTube, ~15 min)
2. **"CORS in 100 Seconds"** — Fireship (YouTube, ~3 min)
3. **"Docker in 100 Seconds"** + **"Docker Tutorial for Beginners"** — Fireship + TechWorld with Nana (YouTube, ~30 min)
4. **"Learn Docker in 7 Easy Steps"** — Fireship (YouTube, ~10 min)

> ⚠️ **Video Docker sangat penting!** Minggu depan kita langsung hands-on Docker. Pastikan Anda sudah punya gambaran dasar tentang container dan image.

---

## D3. Latihan Mandiri (60 menit)

### Soal Pilihan Ganda

**1.** CORS error muncul ketika:
- [ ] a. Server mati
- [ ] b. Browser memblokir request ke origin yang berbeda tanpa izin server
- [ ] c. Database tidak terhubung
- [ ] d. JavaScript syntax error

**2.** Di FastAPI, `allow_origins=["*"]` artinya:
- [ ] a. Hanya localhost yang diizinkan
- [ ] b. Tidak ada origin yang diizinkan
- [ ] c. Semua origin diizinkan (tidak aman untuk production)
- [ ] d. Hanya HTTPS yang diizinkan

**3.** JWT token terdiri dari 3 bagian, yaitu:
- [ ] a. Username, Password, Token
- [ ] b. Header, Payload, Signature
- [ ] c. Request, Response, Status
- [ ] d. Public Key, Private Key, Hash

**4.** Mengapa password TIDAK boleh disimpan sebagai plain text di database?
- [ ] a. Memakan terlalu banyak storage
- [ ] b. Jika database bocor, semua password terekspos
- [ ] c. Python tidak bisa memproses plain text
- [ ] d. PostgreSQL tidak mendukung string

**5.** Prinsip 12-Factor App tentang "Config" menyatakan:
- [ ] a. Konfigurasi harus di-hardcode dalam kode
- [ ] b. Konfigurasi harus disimpan di environment variables
- [ ] c. Konfigurasi harus di-commit ke Git
- [ ] d. Konfigurasi tidak diperlukan

---

## D4. Persiapan Pertemuan Berikutnya (50 menit)

Pertemuan 5 memulai **Fase Containerization** dengan Docker. Persiapkan:

- **Install Docker Desktop** jika belum: https://www.docker.com/products/docker-desktop/
- Verifikasi: `docker --version` dan `docker compose version`
- Pahami konsep dasar: **image vs container**, **Dockerfile**, **docker build**, **docker run**
- Baca: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/
- Baca: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/

> 💡 **Tip:** Docker Desktop bisa memakan waktu lama untuk download dan install (1-2 GB). Jangan ditunda sampai malam sebelum kelas!
>
> ⚠️ **Windows Users:** Docker Desktop membutuhkan **WSL 2** (Windows Subsystem for Linux). Jika belum diaktifkan, ikuti panduan di https://docs.docker.com/desktop/install/windows-install/

---

---

*Modul ini disusun oleh Aidil Saputra Kirsan, Institut Teknologi Kalimantan.*
