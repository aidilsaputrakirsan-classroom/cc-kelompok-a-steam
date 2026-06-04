# MODUL 12: MICROSERVICES — KONSEP & DEKOMPOSISI

---

**Mata Kuliah:** Komputasi Awan  
**Program Studi:** Sistem Informasi - Institut Teknologi Kalimantan  
**SKS:** 3 (1 Kuliah + 2 Project)  
**Pertemuan:** 12 dari 16  
**Fase:** 🔵 Microservices & Production (Minggu 12-14)  

---

## Prasyarat

Sebelum memulai pertemuan ini, pastikan:
- [x] Modul 11 selesai: aplikasi full-stack live di Railway, CD pipeline berjalan
- [x] Sudah membaca artikel Martin Fowler tentang Microservices (Modul 11 Bagian D4)
- [x] Sudah menonton video Microservices (Modul 11 Bagian D2)
- [x] Familiar dengan Docker Compose (multi-container) dari Modul 5-7


---

## Capaian Pembelajaran

### Sub-CPMK
Setelah menyelesaikan pertemuan ini, mahasiswa mampu:
1. Menjelaskan konsep microservices dan perbedaannya dengan arsitektur monolith
2. Mengidentifikasi bounded context dan memecah monolith menjadi service-service independen
3. Merancang arsitektur microservices untuk aplikasi yang sudah dibangun
4. Mengimplementasikan Auth Service sebagai service terpisah
5. Mengkonfigurasi Docker Compose untuk menjalankan multiple services

### Indikator Pencapaian
- Arsitektur microservices terdokumentasi (diagram + API contract)
- Auth Service berjalan sebagai container terpisah dengan database sendiri
- Auth Service memiliki endpoint: `POST /register`, `POST /login`, `GET /verify`
- Docker Compose menjalankan minimal 4 services: auth-service, item-service, auth-db, item-db
- Services berkomunikasi via HTTP REST

---

## Pembagian Fokus Tim Pertemuan Ini

| Peran | Fokus Utama | Juga Membantu |
|-------|-------------|---------------|
| **Lead Backend** | Memisahkan Auth Service dari monolith | Endpoint auth |
| **Lead Frontend** | Update frontend untuk multi-service API | Update API URL config |
| **Lead DevOps** | Docker Compose multi-service, networking | Debug container networking |
| **Lead QA & Docs** | Dokumentasi arsitektur, API contract | Testing antar service |
| **Lead CI/CD** *(5 orang)* | Update CI pipeline untuk multi-service | Bantu Docker Compose |

---

# BAGIAN A: PEMBEKALAN TEORI (50 Menit)

## 1. Monolith vs Microservices (20 menit)

### 1.1 Review: Arsitektur Monolith Kita Saat Ini

Dari Modul 1 sampai 11, kita membangun **monolith** — satu aplikasi backend yang menangani semuanya:

```mermaid
flowchart TD
    subgraph MONOLITH ["🟦 Monolith Backend (Saat Ini)"]
        AUTH["🔐 Auth Module<br/>(register, login, JWT)"]
        ITEMS["📦 Items Module<br/>(CRUD operations)"]
        HEALTH["❤️ Health Module"]
        DB_CONN["🔌 Database Connection"]
        
        AUTH --> DB_CONN
        ITEMS --> DB_CONN
        HEALTH --> DB_CONN
    end

    DB_CONN --> DB[("🗄️ PostgreSQL<br/>1 database, semua tabel")]
    FE["⚛️ React Frontend"] -->|HTTP| MONOLITH

    style MONOLITH fill:#DEEBF7,stroke:#2E75B6
    style DB fill:#FFF2CC,stroke:#BF8F00
```

**Kelebihan monolith (yang sudah kita rasakan):**
- Simple — semua di satu tempat
- Mudah develop dan debug
- Satu deployment, satu database

**Kelemahan monolith (yang mulai terasa saat aplikasi bertumbuh):**
- Satu bug di auth bisa crash seluruh aplikasi
- Tidak bisa scale auth dan items secara independen
- Tim bertambah → semua edit di repo yang sama → conflict makin sering
- Deployment monolith = deploy semuanya, meskipun yang berubah hanya 1 fitur kecil

### 1.2 Apa itu Microservices?

**Microservices** adalah arsitektur dimana aplikasi dipecah menjadi **service-service kecil yang independen**, masing-masing:
- Punya **tanggung jawab tunggal** (single responsibility)
- Punya **database sendiri** (database per service)
- Bisa **di-deploy secara independen**
- Berkomunikasi via **network** (HTTP/REST, message queue)

```mermaid
flowchart TD
    subgraph MS ["🟢 Microservices Architecture (Target)"]
        subgraph AUTH_SVC ["🔐 Auth Service"]
            A_API["POST /register<br/>POST /login<br/>GET /verify"]
            A_DB[("auth_db")]
            A_API --> A_DB
        end

        subgraph ITEM_SVC ["📦 Item Service"]
            I_API["GET /items<br/>POST /items<br/>PUT /items/:id<br/>DELETE /items/:id"]
            I_DB[("item_db")]
            I_API --> I_DB
        end
    end

    FE["⚛️ React Frontend"] -->|"HTTP"| A_API
    FE -->|"HTTP"| I_API
    I_API -.->|"Verify token<br/>HTTP call"| A_API

    style AUTH_SVC fill:#E2EFDA,stroke:#548235
    style ITEM_SVC fill:#DEEBF7,stroke:#2E75B6
    style A_DB fill:#FFF2CC,stroke:#BF8F00
    style I_DB fill:#FFF2CC,stroke:#BF8F00
```

> 💡 **Analogi:**  
> Monolith seperti **satu restoran besar** dimana dapur, kasir, dan gudang semua di satu bangunan. Jika dapur kebakaran, seluruh restoran tutup. Microservices seperti **food court** — setiap tenant punya dapur sendiri, kasir sendiri, bahan sendiri. Jika satu tenant bermasalah, tenant lain tetap beroperasi.

### 1.3 Perbandingan Lengkap

| Aspek | Monolith | Microservices |
|-------|----------|---------------|
| **Struktur** | Satu codebase, satu deploy | Banyak codebase/folder, deploy independen |
| **Database** | Satu database shared | Database per service |
| **Scaling** | Scale seluruh app | Scale per service sesuai kebutuhan |
| **Deployment** | Deploy ulang seluruh app | Deploy hanya service yang berubah |
| **Failure** | Satu bug bisa crash semua | Satu service down, lainnya tetap jalan |
| **Complexity** | Simple di awal | Lebih kompleks (networking, konsistensi) |
| **Tim** | Cocok untuk tim kecil (1-5 orang) | Cocok untuk tim besar (banyak tim) |
| **Testing** | Simple (satu app) | Perlu integration test antar service |
| **Contoh** | Aplikasi kita Modul 1-11 | Netflix, Spotify, Grab, Gojek, Tokopedia |

> 📝 **Kapan microservices cocok?** Tidak selalu! Untuk startup kecil atau proyek sederhana, monolith lebih efisien. Microservices cocok saat aplikasi sudah besar, tim bertambah, atau ada kebutuhan scaling yang berbeda per fitur. Dalam mata kuliah ini, kita memecah monolith untuk **belajar konsepnya** — bukan karena app kita sudah terlalu besar.

---

## 2. Konsep Kunci Microservices (15 menit)

### 2.1 Bounded Context

**Bounded Context** (dari Domain-Driven Design) adalah batasan logis yang menentukan scope suatu service. Setiap service bertanggung jawab atas satu "domain" bisnis.

```mermaid
flowchart LR
    subgraph BC_AUTH ["🔐 Bounded Context: Authentication"]
        U_MODEL["User Model<br/>(id, email, hashed_password, name)"]
        U_LOGIC["Register, Login,<br/>Token Generation, Verification"]
    end

    subgraph BC_ITEM ["📦 Bounded Context: Inventory"]
        I_MODEL["Item Model<br/>(id, name, price, quantity, owner_id)"]
        I_LOGIC["CRUD Items,<br/>Search, Stats, Categories"]
    end

    BC_AUTH -.->|"owner_id reference<br/>(NOT foreign key!)"| BC_ITEM

    style BC_AUTH fill:#E2EFDA,stroke:#548235
    style BC_ITEM fill:#DEEBF7,stroke:#2E75B6
```

**Cara menentukan bounded context:** Tanya diri sendiri — "Jika fitur ini down, fitur lain mana yang tetap bisa jalan?"
- Auth down → items tidak bisa dibuat (butuh login), tapi item list mungkin tetap bisa di-read
- Items down → user tetap bisa login/register

### 2.2 Database per Service

Setiap service memiliki database sendiri. Service **tidak boleh** mengakses database service lain secara langsung.

```mermaid
flowchart TD
    subgraph BENAR ["✅ Benar — Database per Service"]
        A1["Auth Service"] --> A1_DB[("auth_db")]
        I1["Item Service"] --> I1_DB[("item_db")]
        I1 -.->|"HTTP call"| A1
    end

    subgraph SALAH ["❌ Salah — Shared Database"]
        A2["Auth Service"] --> SHARED[("shared_db")]
        I2["Item Service"] --> SHARED
    end

    style BENAR fill:#E2EFDA,stroke:#548235
    style SALAH fill:#FBE5D6,stroke:#C00000
```

Mengapa? Jika service berbagi database:
- Perubahan schema di satu service bisa break service lain
- Tidak bisa scale database secara independen
- Tight coupling — kebalikan dari tujuan microservices

### 2.3 Inter-Service Communication

Bagaimana service berkomunikasi? Ada dua pola utama:

| Pola | Mekanisme | Kapan Digunakan | Contoh |
|------|-----------|-----------------|--------|
| **Synchronous** | HTTP/REST call | Butuh response langsung | Item Service memanggil Auth Service untuk verify token |
| **Asynchronous** | Message Queue (RabbitMQ, Kafka) | Tidak butuh response langsung, event-driven | Setelah order dibuat, kirim notifikasi email |

> 📝 **Untuk mata kuliah ini:** Kita menggunakan **synchronous HTTP/REST** karena lebih sederhana. Message queue adalah topik lanjutan yang bisa Anda eksplorasi sendiri.

### 2.4 API Gateway (Konsep)

Di production, biasanya ada **API Gateway** di depan semua services — sebagai pintu masuk tunggal.

```mermaid
flowchart LR
    FE["⚛️ Frontend"] --> GW["🚪 API Gateway<br/>(Nginx / Traefik)"]
    GW -->|"/auth/*"| AUTH["🔐 Auth Service"]
    GW -->|"/items/*"| ITEMS["📦 Item Service"]
    GW -->|"/health"| HEALTH["❤️ Health Aggregator"]

    style GW fill:#FFF2CC,stroke:#BF8F00
    style AUTH fill:#E2EFDA,stroke:#548235
    style ITEMS fill:#DEEBF7,stroke:#2E75B6
```

API Gateway berfungsi sebagai:
- **Router** — mengarahkan request ke service yang tepat
- **Load balancer** — membagi traffic antar instance
- **SSL termination** — handle HTTPS di satu tempat
- **Rate limiting** — melindungi services dari overload

> 📝 **Di workshop ini:** Kita menggunakan **Nginx sebagai API Gateway** sederhana di Docker Compose. Frontend hanya perlu tahu satu URL (gateway), bukan URL setiap service.

---

## 3. Rencana Dekomposisi (15 menit)

### 3.1 Service Map

Berikut rencana pemecahan monolith kita:

| Service | Tanggung Jawab | Endpoints | Database |
|---------|---------------|-----------|----------|
| **Auth Service** | Registrasi, login, JWT token management, verifikasi | `POST /register`, `POST /login`, `GET /verify` | `auth_db` (tabel: users) |
| **Item Service** | CRUD items, search, stats | `GET /items`, `POST /items`, `PUT /items/:id`, `DELETE /items/:id`, `GET /items/stats` | `item_db` (tabel: items) |
| **API Gateway** | Routing, reverse proxy | Proxy semua request ke service yang tepat | — (tanpa database) |

### 3.2 Alur Request

```mermaid
sequenceDiagram
    participant FE as ⚛️ Frontend
    participant GW as 🚪 Gateway (Nginx)
    participant AUTH as 🔐 Auth Service
    participant ITEM as 📦 Item Service

    Note over FE,ITEM: 1. User Login
    FE->>GW: POST /auth/login
    GW->>AUTH: POST /login
    AUTH-->>GW: {access_token: "eyJ..."}
    GW-->>FE: {access_token: "eyJ..."}

    Note over FE,ITEM: 2. Create Item (with token)
    FE->>GW: POST /items (Header: Bearer eyJ...)
    GW->>ITEM: POST /items (Header: Bearer eyJ...)
    ITEM->>AUTH: GET /verify (Header: Bearer eyJ...)
    AUTH-->>ITEM: {user_id: 1, email: "..."}
    ITEM-->>GW: {id: 1, name: "Laptop", ...}
    GW-->>FE: {id: 1, name: "Laptop", ...}
```

Perhatikan: Item Service **tidak mengakses auth_db** untuk verifikasi token. Ia melakukan **HTTP call ke Auth Service** — ini adalah inter-service communication.

### 3.3 Folder Structure Target

```
cloud-team-XX/
├── services/
│   ├── auth-service/             ← Service baru (dari auth.py)
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── database.py
│   │   ├── requirements.txt
│   │   ├── Dockerfile
│   │   └── tests/
│   ├── item-service/             ← Service baru (dari crud.py)
│   │   ├── main.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── database.py
│   │   ├── auth_client.py        ← HTTP client ke Auth Service
│   │   ├── requirements.txt
│   │   ├── Dockerfile
│   │   └── tests/
│   └── gateway/                  ← Nginx reverse proxy
│       └── nginx.conf
├── frontend/
│   └── ... (tetap sama)
├── docker-compose.yml            ← Updated: multi-service
├── docker-compose.dev.yml        ← Development overrides
└── README.md
```

---

# BAGIAN B: WORKSHOP LAB (170 Menit)

## Workshop 12.1: Buat Auth Service (50 menit)

### Langkah 1: Setup Folder Structure

```bash
mkdir -p services/auth-service/tests
touch services/auth-service/__init__.py
touch services/auth-service/tests/__init__.py
```

### Langkah 2: Auth Service — database.py

File: `services/auth-service/database.py`

```python
"""Database connection for Auth Service."""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5433/auth_db"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### Langkah 3: Auth Service — models.py

File: `services/auth-service/models.py`

```python
"""User model for Auth Service."""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

### Langkah 4: Auth Service — schemas.py

File: `services/auth-service/schemas.py`

```python
"""Pydantic schemas for Auth Service."""
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str


class UserResponse(BaseModel):
    id: int
    email: str
    name: str

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenVerifyResponse(BaseModel):
    user_id: int
    email: str
    name: str
```

### Langkah 5: Auth Service — main.py

File: `services/auth-service/main.py`

```python
"""
Auth Service — Handles authentication and user management.
Microservice yang bertanggung jawab untuk:
- User registration
- User login (JWT token generation)
- Token verification (dipanggil oleh service lain)
"""
import os
from datetime import datetime, timedelta, timezone
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from passlib.context import CryptContext
import jwt

from database import engine, get_db, Base
from models import User
from schemas import (
    UserCreate, UserResponse, LoginRequest,
    TokenResponse, TokenVerifyResponse
)

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Auth Service",
    description="Authentication microservice — register, login, verify tokens",
    version="2.0.0",
)

# CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT config
SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")
ALGORITHM = "HS256"
TOKEN_EXPIRE_MINUTES = int(os.getenv("TOKEN_EXPIRE_MINUTES", "30"))


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# =====================
# ENDPOINTS
# =====================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "auth-service",
        "version": "2.0.0",
    }


@app.post("/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register user baru."""
    # Check duplicate email
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=user_data.email,
        name=user_data.name,
        hashed_password=pwd_context.hash(user_data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Login dan dapatkan JWT token."""
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not pwd_context.verify(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
    })
    return TokenResponse(access_token=token)


@app.get("/verify", response_model=TokenVerifyResponse)
def verify_token(authorization: str = Header(...)):
    """
    Verifikasi JWT token — dipanggil oleh service lain.
    Service lain mengirim header: Authorization: Bearer <token>
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.split("Bearer ")[1]
    payload = decode_token(token)

    return TokenVerifyResponse(
        user_id=int(payload["sub"]),
        email=payload["email"],
        name=payload["name"],
    )
```

### Langkah 6: Auth Service — requirements.txt & Dockerfile

File: `services/auth-service/requirements.txt`

```
fastapi==0.115.6
uvicorn==0.34.0
sqlalchemy==2.0.36
psycopg2-binary==2.9.10
passlib[bcrypt]==1.7.4
pyjwt==2.10.1
pydantic[email]==2.10.4
```

File: `services/auth-service/Dockerfile`

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

> 📝 Perhatikan port **8001** — berbeda dari monolith (8000). Setiap service punya port sendiri di dalam Docker network.

> ✅ **Checkpoint:** Folder `services/auth-service/` lengkap dengan semua file.

---

## Workshop 12.2: Buat Item Service (40 menit)

### Langkah 1: Setup Folder

```bash
mkdir -p services/item-service/tests
touch services/item-service/__init__.py
touch services/item-service/tests/__init__.py
```

### Langkah 2: Item Service — auth_client.py (Inter-Service Communication)

Ini adalah **kunci microservices**: Item Service memverifikasi token dengan **memanggil Auth Service via HTTP**.

File: `services/item-service/auth_client.py`

```python
"""
HTTP client untuk berkomunikasi dengan Auth Service.
Item Service TIDAK memiliki akses ke auth_db — ia memanggil
Auth Service via HTTP untuk memverifikasi token.
"""
import os
import httpx
from fastapi import HTTPException, Header

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001")


async def verify_token_with_auth_service(authorization: str = Header(...)) -> dict:
    """
    Dependency: Verifikasi token dengan memanggil Auth Service.
    Digunakan sebagai Depends() di endpoints yang butuh autentikasi.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{AUTH_SERVICE_URL}/verify",
                headers={"Authorization": authorization},
                timeout=5.0,
            )

        if response.status_code == 200:
            return response.json()  # {user_id, email, name}
        elif response.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        else:
            raise HTTPException(status_code=503, detail="Auth service unavailable")

    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Cannot connect to Auth Service. Is it running?"
        )
    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Auth Service timeout"
        )
```

> 📝 **Key Insight:** Perhatikan URL `http://auth-service:8001`. Di Docker Compose, container bisa saling panggil menggunakan **service name** sebagai hostname. Kita sudah pelajari ini di Modul 6.

### Langkah 3: Item Service — database.py & models.py

File: `services/item-service/database.py`

```python
"""Database connection for Item Service — SEPARATE database from Auth."""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5434/item_db"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

File: `services/item-service/models.py`

```python
"""Item model — di item_db, BUKAN di auth_db."""
from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from database import Base


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String, default="")
    price = Column(Float, nullable=False)
    quantity = Column(Integer, default=0)
    owner_id = Column(Integer, nullable=False)  # Reference ke user di auth_db (bukan FK!)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

> ⚠️ **Perhatikan `owner_id`**: Ini bukan foreign key ke tabel users (karena users ada di database yang berbeda). Ini hanya integer reference — konsistensi dijaga di level aplikasi, bukan database.

### Langkah 4: Item Service — schemas.py

File: `services/item-service/schemas.py`

```python
"""Pydantic schemas for Item Service."""
from pydantic import BaseModel
from typing import Optional


class ItemCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    price: float
    quantity: Optional[int] = 0


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None


class ItemResponse(BaseModel):
    id: int
    name: str
    description: str
    price: float
    quantity: int
    owner_id: int

    class Config:
        from_attributes = True


class ItemListResponse(BaseModel):
    total: int
    items: list[ItemResponse]
```

### Langkah 5: Item Service — main.py

File: `services/item-service/main.py`

```python
"""
Item Service — Handles inventory management.
Berkomunikasi dengan Auth Service untuk verifikasi token.
"""
import os
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, get_db, Base
from models import Item
from schemas import ItemCreate, ItemUpdate, ItemResponse, ItemListResponse
from auth_client import verify_token_with_auth_service

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Item Service",
    description="Inventory microservice — CRUD items with auth via Auth Service",
    version="2.0.0",
)

# CORS
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =====================
# ENDPOINTS
# =====================

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "item-service",
        "version": "2.0.0",
    }


@app.post("/items", response_model=ItemResponse, status_code=201)
async def create_item(
    item_data: ItemCreate,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db),
):
    """Buat item baru — requires authentication."""
    item = Item(
        **item_data.model_dump(),
        owner_id=user["user_id"],
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@app.get("/items", response_model=ItemListResponse)
async def get_items(
    search: str = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db),
):
    """Ambil daftar items milik user yang login."""
    query = db.query(Item).filter(Item.owner_id == user["user_id"])
    if search:
        query = query.filter(Item.name.ilike(f"%{search}%"))
    total = query.count()
    items = query.offset(skip).limit(limit).all()
    return ItemListResponse(total=total, items=items)


@app.get("/items/{item_id}", response_model=ItemResponse)
async def get_item(
    item_id: int,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db),
):
    """Ambil item by ID."""
    item = db.query(Item).filter(
        Item.id == item_id, Item.owner_id == user["user_id"]
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@app.put("/items/{item_id}", response_model=ItemResponse)
async def update_item(
    item_id: int,
    update_data: ItemUpdate,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db),
):
    """Update item."""
    item = db.query(Item).filter(
        Item.id == item_id, Item.owner_id == user["user_id"]
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    for field, value in update_data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@app.delete("/items/{item_id}", status_code=204)
async def delete_item(
    item_id: int,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db),
):
    """Hapus item."""
    item = db.query(Item).filter(
        Item.id == item_id, Item.owner_id == user["user_id"]
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
```

### Langkah 6: Item Service — requirements.txt & Dockerfile

File: `services/item-service/requirements.txt`

```
fastapi==0.115.6
uvicorn==0.34.0
sqlalchemy==2.0.36
psycopg2-binary==2.9.10
httpx==0.28.1
pydantic==2.10.4
```

File: `services/item-service/Dockerfile`

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8002

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
```

> ✅ **Checkpoint:** Folder `services/item-service/` lengkap. Perhatikan `auth_client.py` — ini yang membedakan microservices dari monolith.

---

## Workshop 12.3: API Gateway dengan Nginx (20 menit)

### Langkah 1: Buat Nginx Config

```bash
mkdir -p services/gateway
```

File: `services/gateway/nginx.conf`

```nginx
upstream auth_service {
    server auth-service:8001;
}

upstream item_service {
    server item-service:8002;
}

server {
    listen 80;
    server_name localhost;

    # Auth Service routes
    location /auth/ {
        proxy_pass http://auth_service/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Authorization $http_authorization;
    }

    # Item Service routes
    location /items {
        proxy_pass http://item_service/items;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Authorization $http_authorization;
    }

    # Health check aggregator
    location /health {
        default_type application/json;
        return 200 '{"status": "healthy", "service": "gateway"}';
    }

    # Frontend (static files)
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

**Alur routing:**

| Request URL | Gateway mengarahkan ke | Service |
|-------------|----------------------|---------|
| `POST /auth/register` | `http://auth-service:8001/register` | Auth Service |
| `POST /auth/login` | `http://auth-service:8001/login` | Auth Service |
| `GET /items` | `http://item-service:8002/items` | Item Service |
| `POST /items` | `http://item-service:8002/items` | Item Service |
| `/` (root) | `http://frontend:3000` | Frontend |

> ✅ **Checkpoint:** `services/gateway/nginx.conf` lengkap dengan routing ke semua services.

---

## Workshop 12.4: Docker Compose Multi-Service (30 menit)

### Langkah 1: Tulis docker-compose.yml Baru

File: `docker-compose.yml`

```yaml
# ==============================================
# Docker Compose — Microservices Architecture
# Cloud Team XX
# ==============================================
# Services:
# 1. auth-db: PostgreSQL untuk Auth Service
# 2. item-db: PostgreSQL untuk Item Service
# 3. auth-service: Authentication (port 8001)
# 4. item-service: Inventory CRUD (port 8002)
# 5. frontend: React app (port 3000)
# 6. gateway: Nginx reverse proxy (port 80)

services:
  # ================================
  # DATABASES (Database per Service)
  # ================================
  auth-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: auth_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - auth_db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5

  item-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: item_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - item_db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 5

  # ================================
  # BACKEND SERVICES
  # ================================
  auth-service:
    build: ./services/auth-service
    environment:
      DATABASE_URL: postgresql://postgres:postgres@auth-db:5432/auth_db
      SECRET_KEY: ${SECRET_KEY:-dev-secret-key-change-in-production}
      CORS_ORIGINS: "http://localhost,http://localhost:5173"
    depends_on:
      auth-db:
        condition: service_healthy
    restart: unless-stopped

  item-service:
    build: ./services/item-service
    environment:
      DATABASE_URL: postgresql://postgres:postgres@item-db:5432/item_db
      AUTH_SERVICE_URL: http://auth-service:8001
      CORS_ORIGINS: "http://localhost,http://localhost:5173"
    depends_on:
      item-db:
        condition: service_healthy
      auth-service:
        condition: service_started
    restart: unless-stopped

  # ================================
  # FRONTEND
  # ================================
  frontend:
    build: ./frontend
    environment:
      VITE_API_URL: http://localhost
    restart: unless-stopped

  # ================================
  # API GATEWAY
  # ================================
  gateway:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./services/gateway/nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - auth-service
      - item-service
      - frontend
    restart: unless-stopped

volumes:
  auth_db_data:
  item_db_data:
```

### Langkah 2: Visualisasi Arsitektur

```mermaid
flowchart TD
    subgraph DOCKER ["🐳 Docker Compose Network"]
        GW["🚪 Gateway<br/>Nginx :80"]
        
        subgraph AUTH ["🔐 Auth Domain"]
            AS["Auth Service<br/>:8001"]
            ADB[("auth_db<br/>PostgreSQL")]
            AS --> ADB
        end
        
        subgraph ITEM ["📦 Item Domain"]
            IS["Item Service<br/>:8002"]
            IDB[("item_db<br/>PostgreSQL")]
            IS --> IDB
        end
        
        FE["⚛️ Frontend<br/>:3000"]
        
        GW -->|"/auth/*"| AS
        GW -->|"/items/*"| IS
        GW -->|"/"| FE
        IS -.->|"GET /verify"| AS
    end

    USER["👤 Browser"] -->|"http://localhost"| GW

    style AUTH fill:#E2EFDA,stroke:#548235
    style ITEM fill:#DEEBF7,stroke:#2E75B6
    style GW fill:#FFF2CC,stroke:#BF8F00
```

### Langkah 3: Jalankan!

```bash
# Build dan jalankan semua services
docker compose up --build -d

# Lihat status semua containers
docker compose ps

# Lihat log semua services
docker compose logs -f
```

Output `docker compose ps` yang diharapkan:

```
NAME               SERVICE         STATUS
auth-db            auth-db         running (healthy)
item-db            item-db         running (healthy)
auth-service       auth-service    running
item-service       item-service    running
frontend           frontend        running
gateway            gateway         running
```

### Langkah 4: Test via Gateway

```bash
# Health check
curl http://localhost/health

# Register via gateway
curl -X POST http://localhost/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123","name":"Test User"}'

# Login via gateway
curl -X POST http://localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123"}'
# → Copy access_token dari response

# Create item via gateway (ganti TOKEN)
curl -X POST http://localhost/items \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name":"Laptop","price":15000000,"quantity":5}'

# Get items via gateway
curl http://localhost/items \
  -H "Authorization: Bearer TOKEN"
```

> ⚠️ **Jika ada error**, cek log per service:
> ```bash
> docker compose logs auth-service
> docker compose logs item-service
> docker compose logs gateway
> ```

> ✅ **Checkpoint:** Semua 6 containers running. Register, login, dan CRUD items berfungsi melalui gateway (http://localhost).

---

## Workshop 12.5: Update Frontend (15 menit)

### Update API Configuration

Frontend sekarang hanya perlu mengarah ke **gateway** (satu URL), bukan langsung ke services.

File: `frontend/.env`
```
VITE_API_URL=http://localhost
```

### Update API Calls

Jika sebelumnya frontend memanggil `http://localhost:8000/auth/login`, sekarang menjadi:

| Sebelum (Monolith) | Sesudah (Microservices via Gateway) |
|--------------------|------------------------------------|
| `${API_URL}/auth/register` | `${API_URL}/auth/register` ← sama! |
| `${API_URL}/auth/login` | `${API_URL}/auth/login` ← sama! |
| `${API_URL}/items` | `${API_URL}/items` ← sama! |

> 💡 **Keuntungan API Gateway:** Frontend tidak perlu tahu ada berapa service di belakang. URL tetap sama — gateway yang mengarahkan ke service yang tepat. Ini adalah prinsip **encapsulation** di level arsitektur.

> ✅ **Checkpoint:** Frontend berkomunikasi melalui gateway, semua CRUD berfungsi di browser.

---

## Workshop 12.6: Commit & Verify (15 menit)

### Commit

```bash
git checkout -b feature/microservices-decomposition

git add services/
git add docker-compose.yml
git add services/gateway/

git commit -m "feat: decompose monolith into Auth Service + Item Service

- Extract Auth Service (register, login, verify) with own database
- Extract Item Service (CRUD items) with own database
- Add auth_client.py for inter-service communication (HTTP)
- Add Nginx gateway for API routing
- Docker Compose: 6 services (2 DBs, 2 APIs, frontend, gateway)
- Database per service pattern: auth_db + item_db"

git push origin feature/microservices-decomposition
```

Buat PR → review → merge.

> ✅ **Checkpoint Akhir Workshop:** Arsitektur microservices berjalan lokal dengan 6 containers. Inter-service communication berfungsi.

---

# BAGIAN C: TUGAS TERSTRUKTUR (60 Menit)

> 📝 **Kumpulkan sebelum pertemuan 13** via Pull Request.

---

## Tugas 12: Lengkapi Microservices

### Pembagian Tugas

| Anggota | Branch Name | Tugas | Detail |
|---------|-------------|-------|--------|
| **Lead Backend** | `feature/item-stats-service` | Tambah endpoint stats di Item Service | Implementasi `GET /items/stats` di Item Service (total items, total value, termahal, termurah). Tambah test untuk endpoint ini. |
| **Lead Frontend** | `feature/frontend-gateway` | Sesuaikan semua API calls ke gateway | Pastikan semua fetch mengarah ke gateway URL. Handle error saat service unavailable (tampilkan "Service temporarily unavailable"). Test register → login → CRUD via browser. |
| **Lead DevOps** | `feature/compose-healthcheck` | Tambah health checks di Docker Compose | Tambahkan healthcheck untuk auth-service dan item-service. Gateway hanya start setelah semua service healthy. Buat `Makefile` target: `up`, `down`, `logs`, `restart`. |
| **Lead QA & Docs** | `docs/microservices-architecture` | Dokumentasi arsitektur microservices | Buat `docs/architecture.md`: diagram arsitektur (mermaid), daftar services + ports, API contract setiap service, cara menjalankan lokal, cara debug per service. |
| **Lead CI/CD** *(5 orang)* | `feature/ci-multi-service` | Update CI pipeline untuk multi-service | Update `.github/workflows/ci.yml`: build semua services, run tests per service, build Docker images per service. |

### Contoh: Health Check di Docker Compose

```yaml
  auth-service:
    build: ./services/auth-service
    # ...
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 15s
```

### Informasi Pengumpulan

| Item | Keterangan |
|------|------------|
| **Deadline** | Sebelum pertemuan 13 dimulai |
| **Format** | Pull Request ke repository tim — HARUS lulus CI |
| **Yang dinilai** | Stats endpoint, frontend terintegrasi, healthchecks, docs, semua anggota ≥1 PR |
| **Bonus** | Tim yang menambahkan `docker-compose.dev.yml` dengan hot-reload untuk development |

---

# BAGIAN D: BELAJAR MANDIRI (230 Menit)

> 📚 **Tidak dikumpulkan**, tetapi sangat penting untuk pemahaman.

---

## D1. Membaca Referensi (60 menit)

### Bacaan Wajib
1. **Microservices.io — Patterns**  
   https://microservices.io/patterns/index.html  
   (Database per service, API Gateway, Circuit Breaker)

2. **Docker Compose Networking**  
   https://docs.docker.com/compose/how-tos/networking/  
   (Bagaimana containers berkomunikasi di Docker Compose)

3. **Nginx Reverse Proxy Guide**  
   https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/  
   (Konfigurasi reverse proxy dengan Nginx)

### Bacaan Tambahan
- Martin Fowler — Microservices Prerequisites — https://martinfowler.com/bliki/MicroservicePrerequisites.html
- httpx Documentation (Python HTTP client) — https://www.python-httpx.org/
- FastAPI — Testing — https://fastapi.tiangolo.com/tutorial/testing/

---

## D2. Video Tutorial (60 menit)

1. **"Microservices with FastAPI"** — cari di YouTube (~20 min)
   - Tutorial membangun microservices dengan FastAPI

2. **"Nginx as API Gateway"** — cari di YouTube (~15 min)
   - Konfigurasi Nginx untuk reverse proxy ke multiple services

3. **"Docker Compose Multi-Service"** — TechWorld with Nana (YouTube, ~25 min)
   - Cara mengelola multiple services dengan Docker Compose

---

## D3. Latihan Mandiri (60 menit)

### Soal Pilihan Ganda

**1.** Prinsip "database per service" dalam microservices artinya:
- [ ] a. Semua service berbagi satu database besar
- [ ] b. Setiap service menggunakan database engine yang berbeda
- [ ] c. Database hanya boleh diakses oleh satu developer
- [ ] d. Setiap service memiliki database sendiri yang tidak diakses langsung oleh service lain

**2.** Jika Item Service ingin memverifikasi JWT token, ia harus:
- [ ] a. Melakukan HTTP call ke endpoint /verify di Auth Service
- [ ] b. Mengakses tabel users di auth_db secara langsung
- [ ] c. Mendekripsi token sendiri tanpa Auth Service
- [ ] d. Menghubungi frontend untuk verifikasi

**3.** API Gateway berfungsi untuk:
- [ ] a. Menyimpan data semua service
- [ ] b. Menjalankan business logic aplikasi
- [ ] c. Mengarahkan request ke service yang tepat berdasarkan URL path
- [ ] d. Menggantikan semua backend services

**4.** Keuntungan utama microservices dibanding monolith adalah:
- [ ] a. Selalu lebih murah untuk dijalankan
- [ ] b. Setiap service bisa di-deploy dan di-scale secara independen
- [ ] c. Lebih mudah untuk dibangun dari awal
- [ ] d. Tidak membutuhkan Docker

**5.** Di Docker Compose, container `item-service` bisa memanggil `auth-service` menggunakan:
- [ ] a. IP address yang di-hardcode
- [ ] b. localhost:8001
- [ ] c. Nama service sebagai hostname (http://auth-service:8001)
- [ ] d. Hanya bisa melalui port yang di-expose ke host

---

## D4. Persiapan Pertemuan Berikutnya (50 menit)

Pertemuan 13 akan melanjutkan **Microservices Implementation** — menambah fitur baru dan memastikan reliability. Persiapkan:

- Apa itu **Circuit Breaker pattern** dan mengapa penting di microservices?
- Apa itu **retry logic** dan **timeout** dalam inter-service communication?
- Bagaimana mengelola **data consistency** antar service (eventual consistency)?
- Bagaimana menulis **integration test** untuk microservices?
- Baca: https://microservices.io/patterns/reliability/circuit-breaker.html

> 💡 **Preview:** Minggu depan kita akan menambahkan: retry mechanism di auth_client.py, data migration dari monolith ke microservices, dan integration test yang memverifikasi komunikasi antar service.

---

---

*Modul ini disusun oleh Aidil Saputra Kirsan, Institut Teknologi Kalimantan.*
