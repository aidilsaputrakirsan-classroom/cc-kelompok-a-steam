# MODUL 13: MICROSERVICES — IMPLEMENTASI & RELIABILITY

---

**Mata Kuliah:** Komputasi Awan  
**Program Studi:** Sistem Informasi - Institut Teknologi Kalimantan  
**SKS:** 3 (1 Kuliah + 2 Project)  
**Pertemuan:** 13 dari 16  
**Fase:** 🔵 Microservices & Production (Minggu 12-14)  

---

## Prasyarat

Sebelum memulai pertemuan ini, pastikan:
- [x] Modul 12 selesai: Auth Service + Item Service berjalan di Docker Compose
- [x] Docker Compose menjalankan 6 containers (2 DB, 2 services, frontend, gateway)
- [x] Inter-service communication berfungsi (Item Service memanggil Auth Service)
- [x] Sudah membaca tentang Circuit Breaker pattern (Modul 12 Bagian D4)

> ⚠️ **Pastikan semua containers running sebelum workshop dimulai!**
> ```bash
> docker compose up -d
> docker compose ps   # semua harus STATUS: running
> ```

---

## Capaian Pembelajaran

### Sub-CPMK
Setelah menyelesaikan pertemuan ini, mahasiswa mampu:
1. Mengimplementasikan retry logic dan timeout untuk inter-service communication
2. Menerapkan circuit breaker pattern untuk menangani service failure
3. Melakukan migrasi data dari monolith ke arsitektur microservices
4. Menulis integration test yang memverifikasi komunikasi antar service
5. Menangani graceful degradation saat salah satu service down

### Indikator Pencapaian
- Auth client memiliki retry logic (3 retry dengan exponential backoff)
- Circuit breaker mencegah cascading failure saat Auth Service down
- Data dari monolith berhasil dimigrasi ke database terpisah
- Minimal 5 integration test passing yang melibatkan 2+ services
- Item Service tetap bisa memberikan response (degraded) saat Auth Service down

---

## Pembagian Fokus Tim Pertemuan Ini

| Peran | Fokus Utama | Juga Membantu |
|-------|-------------|---------------|
| **Lead Backend** | Retry logic, circuit breaker, graceful degradation | — |
| **Lead Frontend** | Handle degraded state di UI, error messages | UX saat service down |
| **Lead DevOps** | Data migration script, Docker healthcheck improvement | Debug networking |
| **Lead QA & Docs** | Integration tests, test scenarios antar service | Dokumentasi reliability |
| **Lead CI/CD** *(5 orang)* | Update CI untuk integration test | Bantu test automation |

---

# BAGIAN A: PEMBEKALAN TEORI (50 Menit)

## 1. Masalah Reliability di Microservices (15 menit)

### 1.1 The Network is Unreliable

Di monolith, pemanggilan fungsi antar modul selalu berhasil (in-process call). Di microservices, setiap komunikasi antar service melewati **network** — dan network bisa gagal kapan saja.

```mermaid
flowchart TD
    subgraph MONOLITH ["🟦 Monolith — Function Call"]
        M_ITEMS["items.create()"] -->|"In-process<br/>Selalu berhasil"| M_AUTH["auth.verify()"]
    end

    subgraph MICRO ["🟢 Microservices — Network Call"]
        S_ITEMS["Item Service"] -->|"HTTP via network<br/>Bisa gagal!"| S_AUTH["Auth Service"]
    end

    S_AUTH --> FAIL1["❌ Auth Service down"]
    S_AUTH --> FAIL2["❌ Network timeout"]
    S_AUTH --> FAIL3["❌ Response lambat"]
    S_AUTH --> OK["✅ Berhasil"]

    style MONOLITH fill:#DEEBF7,stroke:#2E75B6
    style MICRO fill:#E2EFDA,stroke:#548235
    style FAIL1 fill:#FF6B6B,color:#fff
    style FAIL2 fill:#FF6B6B,color:#fff
    style FAIL3 fill:#FF6B6B,color:#fff
```

**Skenario failure di microservices:**
- Auth Service crash → Item Service tidak bisa verifikasi token → semua CRUD item gagal
- Network lambat → request timeout → user melihat error 504
- Auth Service overloaded → response lambat → Item Service menumpuk request → **cascading failure**

> 💡 **Analogi:**  
> Bayangkan Anda pesan makanan lewat GoFood. Jika restoran tutup (service down), kurir (Item Service) tidak bisa pickup — pesanan Anda gagal. Tapi app GoFood tetap bisa menampilkan menu (graceful degradation). Yang lebih bahaya: jika restoran terlalu lambat, banyak kurir menunggu di satu restoran → kurir habis untuk semua pesanan → **cascading failure** (seluruh sistem terdampak oleh satu restoran lambat).

### 1.2 Tiga Pilar Reliability

```mermaid
flowchart LR
    subgraph RELIABILITY ["🛡️ Tiga Pilar Reliability"]
        RETRY["🔄 Retry<br/>Coba lagi jika gagal"]
        CB["⚡ Circuit Breaker<br/>Berhenti coba jika<br/>sudah pasti gagal"]
        DEGRADE["📉 Graceful Degradation<br/>Tetap berfungsi walau<br/>terbatas"]
    end

    RETRY --> RESULT1["Menangani:<br/>Network glitch sementara"]
    CB --> RESULT2["Menangani:<br/>Service down berkepanjangan"]
    DEGRADE --> RESULT3["Menangani:<br/>User experience saat failure"]

    style RETRY fill:#E2EFDA,stroke:#548235
    style CB fill:#FFF2CC,stroke:#BF8F00
    style DEGRADE fill:#DEEBF7,stroke:#2E75B6
```

---

## 2. Retry Pattern (10 menit)

### 2.1 Konsep Retry

Jika HTTP call gagal, **coba lagi** beberapa kali sebelum menyerah. Tapi tidak boleh retry sembarangan — perlu strategi:

| Strategi | Interval | Kapan Digunakan |
|----------|----------|-----------------|
| **Fixed interval** | 1s, 1s, 1s | Simple, tapi bisa overload target |
| **Exponential backoff** | 1s, 2s, 4s | Best practice — beri waktu service pulih |
| **Exponential + jitter** | 1.2s, 2.7s, 3.9s | Production-grade — hindari thundering herd |

```mermaid
sequenceDiagram
    participant IS as 📦 Item Service
    participant AS as 🔐 Auth Service

    Note over IS,AS: Exponential Backoff Retry
    IS->>AS: GET /verify (attempt 1)
    AS-->>IS: ❌ Connection refused
    Note right of IS: Wait 1 second
    IS->>AS: GET /verify (attempt 2)
    AS-->>IS: ❌ Timeout
    Note right of IS: Wait 2 seconds
    IS->>AS: GET /verify (attempt 3)
    AS-->>IS: ✅ 200 OK {user_id: 1}
    Note right of IS: Berhasil di percobaan ke-3!
```

### 2.2 Kapan Retry, Kapan Tidak

| Error | Retry? | Alasan |
|-------|--------|--------|
| Connection refused | ✅ Ya | Service mungkin sedang restart |
| Timeout | ✅ Ya | Network mungkin sementara lambat |
| 500 Internal Server Error | ✅ Ya | Bug sementara, mungkin berhasil di retry |
| 401 Unauthorized | ❌ Tidak | Token salah — retry tidak akan memperbaiki |
| 400 Bad Request | ❌ Tidak | Data salah — retry dengan data sama tetap gagal |
| 404 Not Found | ❌ Tidak | Resource memang tidak ada |

> 📝 **Aturan umum:** Retry hanya untuk error **transient** (sementara). Jangan retry untuk error **deterministic** (pasti gagal lagi).

---

## 3. Circuit Breaker Pattern (15 menit)

### 3.1 Masalah Tanpa Circuit Breaker

Tanpa circuit breaker, jika Auth Service down, Item Service terus mencoba menghubungi — setiap request menunggu timeout (misal 5 detik). Jika ada 100 request per detik, artinya 100 koneksi menunggu sia-sia → Item Service kehabisan resource → **cascading failure**.

### 3.2 Cara Kerja Circuit Breaker

```mermaid
stateDiagram-v2
    [*] --> Closed
    
    Closed --> Open: Failure threshold<br/>tercapai (misal: 5 gagal berturut)
    Open --> HalfOpen: Setelah cooldown<br/>(misal: 30 detik)
    HalfOpen --> Closed: Request berhasil ✅
    HalfOpen --> Open: Request gagal lagi ❌
    
    note right of Closed: NORMAL<br/>Semua request diteruskan<br/>ke Auth Service
    note right of Open: OPEN / TRIP<br/>Request langsung DITOLAK<br/>tanpa memanggil Auth Service<br/>(fail fast → 503)
    note right of HalfOpen: TESTING<br/>Coba 1 request<br/>untuk test apakah<br/>service sudah pulih
```

| State | Behavior | User Experience |
|-------|----------|----------------|
| **Closed** (Normal) | Semua request diteruskan ke Auth Service | Normal — login, CRUD bekerja |
| **Open** (Tripped) | Request langsung gagal tanpa memanggil Auth Service | Fast fail — error message dalam milidetik, bukan timeout |
| **Half-Open** (Testing) | Satu request dikirim untuk test — jika berhasil, kembali ke Closed | Satu user "test" — jika berhasil, semua pulih |

> 💡 **Analogi:**  
> Circuit breaker seperti **sekring listrik**. Jika arus berlebihan (banyak failure), sekring putus (open) — mencegah kerusakan lebih parah. Setelah beberapa saat, Anda coba nyalakan sekring lagi (half-open). Jika sudah aman, listrik menyala normal (closed).

### 3.3 Implementasi Sederhana

```python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, cooldown_seconds=30):
        self.failure_count = 0
        self.failure_threshold = failure_threshold
        self.cooldown_seconds = cooldown_seconds
        self.state = "CLOSED"      # CLOSED, OPEN, HALF_OPEN
        self.last_failure_time = None

    def can_execute(self):
        if self.state == "CLOSED":
            return True
        if self.state == "OPEN":
            # Cek apakah cooldown sudah lewat
            elapsed = time.time() - self.last_failure_time
            if elapsed >= self.cooldown_seconds:
                self.state = "HALF_OPEN"
                return True     # Izinkan 1 request untuk test
            return False        # Masih dalam cooldown
        if self.state == "HALF_OPEN":
            return True

    def record_success(self):
        self.failure_count = 0
        self.state = "CLOSED"

    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = "OPEN"
```

---

## 4. Graceful Degradation (10 menit)

### 4.1 Konsep

Saat Auth Service down, Item Service tidak harus 100% mati. Ia bisa memberikan **response terbatas** (degraded mode):

| Skenario | Full Mode (Auth OK) | Degraded Mode (Auth Down) |
|----------|---------------------|--------------------------|
| GET /items | ✅ Return items milik user | 📉 Return cached items / public items |
| POST /items | ✅ Buat item baru | ❌ 503 "Auth service unavailable" |
| GET /items/:id | ✅ Return item detail | 📉 Return jika item di-cache |
| GET /health | ✅ status: healthy | ⚠️ status: degraded, auth: unavailable |

```mermaid
flowchart TD
    REQ["📦 Request ke Item Service"] --> CHECK{"Circuit Breaker<br/>state?"}
    CHECK -->|CLOSED| CALL["Panggil Auth Service"]
    CALL -->|✅ OK| FULL["🟢 Full Mode<br/>Return data lengkap"]
    CALL -->|❌ Fail| RETRY["Retry (max 3x)"]
    RETRY -->|Masih fail| DEGRADE["📉 Degraded Mode<br/>Return limited response"]
    CHECK -->|OPEN| FAST_FAIL["⚡ Fast Fail<br/>Langsung degraded"]
    FAST_FAIL --> DEGRADE

    style FULL fill:#70AD47,color:#fff
    style DEGRADE fill:#FFF2CC,stroke:#BF8F00
    style FAST_FAIL fill:#FF6B6B,color:#fff
```

---

# BAGIAN B: WORKSHOP LAB (170 Menit)

## Workshop 13.1: Implementasi Retry dengan Exponential Backoff (35 menit)

### Langkah 1: Update auth_client.py di Item Service

Replace seluruh file `services/item-service/auth_client.py`:

```python
"""
Auth Client — HTTP client untuk berkomunikasi dengan Auth Service.
Dilengkapi dengan retry logic dan circuit breaker.
"""
import os
import time
import asyncio
import logging
import httpx
from fastapi import HTTPException, Header

logger = logging.getLogger(__name__)

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001")

# =====================
# RETRY CONFIG
# =====================
MAX_RETRIES = 3
BASE_DELAY = 0.5           # 0.5 detik delay awal
TIMEOUT_SECONDS = 5.0      # Timeout per request

# Error yang layak di-retry (transient errors)
RETRYABLE_STATUS_CODES = {500, 502, 503, 504}


async def _call_auth_service(authorization: str) -> dict:
    """
    Internal: Panggil Auth Service dengan retry + exponential backoff.
    """
    last_exception = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{AUTH_SERVICE_URL}/verify",
                    headers={"Authorization": authorization},
                    timeout=TIMEOUT_SECONDS,
                )

            # Success
            if response.status_code == 200:
                logger.info(f"Auth verified (attempt {attempt})")
                return response.json()

            # Non-retryable errors — gagalkan langsung
            if response.status_code == 401:
                raise HTTPException(status_code=401, detail="Invalid or expired token")
            if response.status_code == 400:
                raise HTTPException(status_code=400, detail="Bad auth request")

            # Retryable server errors
            if response.status_code in RETRYABLE_STATUS_CODES:
                logger.warning(
                    f"Auth service returned {response.status_code} "
                    f"(attempt {attempt}/{MAX_RETRIES})"
                )
                last_exception = HTTPException(
                    status_code=response.status_code,
                    detail=f"Auth service error: {response.status_code}"
                )
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Unexpected auth response: {response.status_code}"
                )

        except httpx.ConnectError as e:
            logger.warning(
                f"Cannot connect to Auth Service (attempt {attempt}/{MAX_RETRIES}): {e}"
            )
            last_exception = e

        except httpx.TimeoutException as e:
            logger.warning(
                f"Auth Service timeout (attempt {attempt}/{MAX_RETRIES}): {e}"
            )
            last_exception = e

        # Exponential backoff (hanya jika akan retry)
        if attempt < MAX_RETRIES:
            delay = BASE_DELAY * (2 ** (attempt - 1))  # 0.5s, 1s, 2s
            logger.info(f"Retrying in {delay}s...")
            await asyncio.sleep(delay)

    # Semua retry gagal
    logger.error(f"Auth Service unreachable after {MAX_RETRIES} attempts")
    raise HTTPException(
        status_code=503,
        detail="Auth Service unavailable. Please try again later."
    )


async def verify_token_with_auth_service(
    authorization: str = Header(...)
) -> dict:
    """
    FastAPI Dependency: Verifikasi token via Auth Service.
    Dengan retry logic dan proper error handling.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    return await _call_auth_service(authorization)
```

### Langkah 2: Test Retry Logic

```bash
# 1. Pastikan semua container running
docker compose up -d

# 2. Login untuk dapat token
TOKEN=$(curl -s -X POST http://localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Pass123"}' | \
  python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")

# 3. Test normal (Auth Service up)
curl -X GET http://localhost/items \
  -H "Authorization: Bearer $TOKEN"
# → Harus berhasil ✅

# 4. Stop Auth Service
docker compose stop auth-service

# 5. Test saat Auth Service down
curl -X GET http://localhost/items \
  -H "Authorization: Bearer $TOKEN"
# → Harus gagal setelah retry: 503 "Auth Service unavailable"

# 6. Lihat retry logs di Item Service
docker compose logs item-service --tail=20
# → Akan muncul: "Cannot connect... attempt 1/3", "Retrying in 0.5s...", dst.

# 7. Nyalakan kembali Auth Service
docker compose start auth-service

# 8. Test lagi
curl -X GET http://localhost/items \
  -H "Authorization: Bearer $TOKEN"
# → Harus berhasil kembali ✅
```

> ✅ **Checkpoint:** Log menunjukkan retry attempts saat Auth Service down. Request berhasil kembali setelah Auth Service dinyalakan.

---

## Workshop 13.2: Implementasi Circuit Breaker (35 menit)

### Langkah 1: Buat Circuit Breaker Module

File: `services/item-service/circuit_breaker.py`

```python
"""
Circuit Breaker — mencegah cascading failure.
Jika Auth Service gagal berkali-kali, berhenti mencoba (fail fast).
"""
import time
import logging

logger = logging.getLogger(__name__)


class CircuitBreaker:
    """
    Simple circuit breaker implementation.

    States:
    - CLOSED:    Normal. Requests diteruskan.
    - OPEN:      Tripped. Requests langsung ditolak (fail fast).
    - HALF_OPEN: Testing. 1 request diizinkan untuk test recovery.
    """

    def __init__(
        self,
        name: str = "default",
        failure_threshold: int = 5,
        cooldown_seconds: int = 30,
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.cooldown_seconds = cooldown_seconds
        self.failure_count = 0
        self.success_count = 0
        self.state = "CLOSED"
        self.last_failure_time = None
        self.total_rejected = 0

    def can_execute(self) -> bool:
        """Periksa apakah request boleh diteruskan."""
        if self.state == "CLOSED":
            return True

        if self.state == "OPEN":
            elapsed = time.time() - self.last_failure_time
            if elapsed >= self.cooldown_seconds:
                logger.info(
                    f"[CircuitBreaker:{self.name}] "
                    f"Cooldown selesai ({self.cooldown_seconds}s). "
                    f"State: OPEN → HALF_OPEN"
                )
                self.state = "HALF_OPEN"
                return True
            else:
                self.total_rejected += 1
                remaining = int(self.cooldown_seconds - elapsed)
                logger.debug(
                    f"[CircuitBreaker:{self.name}] "
                    f"OPEN — request ditolak. "
                    f"Cooldown remaining: {remaining}s"
                )
                return False

        # HALF_OPEN — izinkan untuk test
        return True

    def record_success(self):
        """Catat keberhasilan."""
        if self.state == "HALF_OPEN":
            logger.info(
                f"[CircuitBreaker:{self.name}] "
                f"Test berhasil! State: HALF_OPEN → CLOSED"
            )
        self.failure_count = 0
        self.success_count += 1
        self.state = "CLOSED"

    def record_failure(self):
        """Catat kegagalan."""
        self.failure_count += 1
        self.last_failure_time = time.time()

        if self.state == "HALF_OPEN":
            logger.warning(
                f"[CircuitBreaker:{self.name}] "
                f"Test gagal. State: HALF_OPEN → OPEN"
            )
            self.state = "OPEN"
        elif self.failure_count >= self.failure_threshold:
            logger.error(
                f"[CircuitBreaker:{self.name}] "
                f"Threshold tercapai ({self.failure_count}/{self.failure_threshold}). "
                f"State: CLOSED → OPEN"
            )
            self.state = "OPEN"

    def get_status(self) -> dict:
        """Return status circuit breaker untuk health check."""
        return {
            "name": self.name,
            "state": self.state,
            "failure_count": self.failure_count,
            "failure_threshold": self.failure_threshold,
            "total_rejected": self.total_rejected,
            "cooldown_seconds": self.cooldown_seconds,
        }
```

### Langkah 2: Integrasikan Circuit Breaker ke Auth Client

Update `services/item-service/auth_client.py` — tambahkan circuit breaker:

Di bagian atas file, setelah import, tambahkan:

```python
from circuit_breaker import CircuitBreaker

# Circuit breaker instance (global — shared di seluruh app)
auth_circuit = CircuitBreaker(
    name="auth-service",
    failure_threshold=5,
    cooldown_seconds=30,
)
```

Lalu update fungsi `_call_auth_service`:

```python
async def _call_auth_service(authorization: str) -> dict:
    """
    Panggil Auth Service dengan Circuit Breaker + Retry.
    """
    # Circuit breaker check
    if not auth_circuit.can_execute():
        raise HTTPException(
            status_code=503,
            detail="Auth Service circuit breaker OPEN. Try again later."
        )

    last_exception = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{AUTH_SERVICE_URL}/verify",
                    headers={"Authorization": authorization},
                    timeout=TIMEOUT_SECONDS,
                )

            if response.status_code == 200:
                auth_circuit.record_success()
                logger.info(f"Auth verified (attempt {attempt})")
                return response.json()

            if response.status_code == 401:
                auth_circuit.record_success()  # Service responsif, token salah
                raise HTTPException(status_code=401, detail="Invalid or expired token")
            if response.status_code == 400:
                auth_circuit.record_success()
                raise HTTPException(status_code=400, detail="Bad auth request")

            if response.status_code in RETRYABLE_STATUS_CODES:
                logger.warning(
                    f"Auth service returned {response.status_code} "
                    f"(attempt {attempt}/{MAX_RETRIES})"
                )
                last_exception = HTTPException(
                    status_code=response.status_code,
                    detail=f"Auth service error: {response.status_code}"
                )
            else:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"Unexpected auth response: {response.status_code}"
                )

        except httpx.ConnectError as e:
            logger.warning(
                f"Cannot connect to Auth Service (attempt {attempt}/{MAX_RETRIES})"
            )
            last_exception = e

        except httpx.TimeoutException as e:
            logger.warning(
                f"Auth Service timeout (attempt {attempt}/{MAX_RETRIES})"
            )
            last_exception = e

        if attempt < MAX_RETRIES:
            delay = BASE_DELAY * (2 ** (attempt - 1))
            await asyncio.sleep(delay)

    # Semua retry gagal → record failure di circuit breaker
    auth_circuit.record_failure()
    logger.error(f"Auth Service unreachable after {MAX_RETRIES} attempts")
    raise HTTPException(
        status_code=503,
        detail="Auth Service unavailable. Please try again later."
    )
```

### Langkah 3: Tambah Circuit Breaker Status ke Health Check

Update `services/item-service/main.py` — import circuit breaker dan update health endpoint:

```python
from auth_client import auth_circuit  # Import circuit breaker instance

@app.get("/health")
def health_check():
    cb_status = auth_circuit.get_status()
    overall = "healthy" if cb_status["state"] == "CLOSED" else "degraded"

    return {
        "status": overall,
        "service": "item-service",
        "version": "2.1.0",
        "dependencies": {
            "auth-service": cb_status,
        },
    }
```

### Langkah 4: Test Circuit Breaker

```bash
# 1. Rebuild item-service
docker compose up -d --build item-service

# 2. Check health (CLOSED state)
curl http://localhost/items/health 2>/dev/null | python3 -m json.tool

# 3. Stop Auth Service
docker compose stop auth-service

# 4. Kirim 6 request (failure threshold = 5)
for i in $(seq 1 6); do
  echo "--- Request $i ---"
  curl -s http://localhost/items \
    -H "Authorization: Bearer dummy-token" | head -c 100
  echo ""
done

# 5. Check health (harus OPEN state sekarang)
curl http://localhost/items/health 2>/dev/null | python3 -m json.tool

# 6. Request berikutnya langsung fail (fast fail, tanpa menunggu timeout)
time curl -s http://localhost/items \
  -H "Authorization: Bearer dummy-token"
# → Harus sangat cepat (<100ms) karena circuit breaker langsung menolak

# 7. Nyalakan Auth Service
docker compose start auth-service

# 8. Tunggu cooldown (30 detik), lalu test
sleep 35
curl http://localhost/items/health 2>/dev/null | python3 -m json.tool
# → State harus kembali ke HALF_OPEN atau CLOSED
```

> ✅ **Checkpoint:** Circuit breaker berpindah state: CLOSED → OPEN (setelah 5 failures) → HALF_OPEN (setelah 30s cooldown) → CLOSED (setelah Auth Service pulih). Fast fail saat OPEN (<100ms vs timeout 5s).

---

## Workshop 13.3: Data Migration dari Monolith (25 menit)

### Langkah 1: Buat Migration Script

Jika tim masih punya data di database monolith, kita perlu memigrasikan data ke database terpisah.

File: `scripts/migrate_data.py`

```python
"""
Data Migration Script
Migrasi data dari monolith (1 database) ke microservices (2 database).

Usage:
    python scripts/migrate_data.py

Prerequisite:
    - Monolith database accessible
    - auth_db dan item_db sudah running (via Docker Compose)
"""
import os
import sys
from sqlalchemy import create_engine, text

# Database URLs
MONOLITH_DB_URL = os.getenv(
    "MONOLITH_DB_URL",
    "postgresql://postgres:postgres@localhost:5432/cloudapp"
)
AUTH_DB_URL = os.getenv(
    "AUTH_DB_URL",
    "postgresql://postgres:postgres@localhost:5433/auth_db"
)
ITEM_DB_URL = os.getenv(
    "ITEM_DB_URL",
    "postgresql://postgres:postgres@localhost:5434/item_db"
)


def migrate():
    print("=" * 50)
    print("DATA MIGRATION: Monolith → Microservices")
    print("=" * 50)

    monolith = create_engine(MONOLITH_DB_URL)
    auth_db = create_engine(AUTH_DB_URL)
    item_db = create_engine(ITEM_DB_URL)

    # Step 1: Migrate users to auth_db
    print("\n[1/2] Migrating users → auth_db...")
    with monolith.connect() as src:
        users = src.execute(text("SELECT * FROM users")).fetchall()
        print(f"     Found {len(users)} users in monolith")

    with auth_db.connect() as dst:
        for user in users:
            dst.execute(
                text("""
                    INSERT INTO users (id, email, name, hashed_password, created_at)
                    VALUES (:id, :email, :name, :hashed_password, :created_at)
                    ON CONFLICT (id) DO NOTHING
                """),
                {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "hashed_password": user.hashed_password,
                    "created_at": user.created_at,
                }
            )
        dst.commit()
    print(f"     ✅ Migrated {len(users)} users")

    # Step 2: Migrate items to item_db
    print("\n[2/2] Migrating items → item_db...")
    with monolith.connect() as src:
        items = src.execute(text("SELECT * FROM items")).fetchall()
        print(f"     Found {len(items)} items in monolith")

    with item_db.connect() as dst:
        for item in items:
            dst.execute(
                text("""
                    INSERT INTO items (id, name, description, price, quantity,
                                       owner_id, created_at)
                    VALUES (:id, :name, :description, :price, :quantity,
                            :owner_id, :created_at)
                    ON CONFLICT (id) DO NOTHING
                """),
                {
                    "id": item.id,
                    "name": item.name,
                    "description": item.description,
                    "price": item.price,
                    "quantity": item.quantity,
                    "owner_id": item.owner_id,
                    "created_at": item.created_at,
                }
            )
        dst.commit()
    print(f"     ✅ Migrated {len(items)} items")

    print("\n" + "=" * 50)
    print("MIGRATION COMPLETE!")
    print("=" * 50)


if __name__ == "__main__":
    try:
        migrate()
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        print("Pastikan semua database accessible dan tabel sudah dibuat.")
        sys.exit(1)
```

### Langkah 2: Jalankan Migration (Jika Ada Data Monolith)

```bash
# Install SQLAlchemy dan psycopg2 di host (jika belum)
pip install sqlalchemy psycopg2-binary

# Jalankan migration
python scripts/migrate_data.py
```

> 📝 **Catatan:** Jika tim memulai langsung dengan microservices (tanpa data monolith), script ini menjadi referensi untuk migrasi data di masa depan. Pahami polanya — karena di dunia kerja, migrasi data adalah bagian paling kritis dalam transisi ke microservices.

> ✅ **Checkpoint:** Memahami konsep data migration. Script tersedia di `scripts/migrate_data.py`.

---

## Workshop 13.4: Integration Tests (40 menit)

### Langkah 1: Setup Test Environment

Integration test membutuhkan **semua services berjalan** — berbeda dari unit test yang terisolasi.

File: `tests/integration/conftest.py`

```python
"""
Integration Test Configuration.
Tests ini membutuhkan semua services running di Docker Compose.
"""
import os
import pytest
import httpx

GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost")


@pytest.fixture(scope="session")
def gateway_url():
    """Base URL gateway."""
    return GATEWAY_URL


@pytest.fixture(scope="session")
def test_user():
    """Register test user dan return credentials + token."""
    import time
    email = f"integration-test-{int(time.time())}@example.com"
    password = "IntegrationTestPass123"
    name = "Integration Test User"

    # Register
    response = httpx.post(
        f"{GATEWAY_URL}/auth/register",
        json={"email": email, "password": password, "name": name},
    )
    assert response.status_code == 201, f"Register failed: {response.text}"

    # Login
    response = httpx.post(
        f"{GATEWAY_URL}/auth/login",
        json={"email": email, "password": password},
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    token = response.json()["access_token"]

    return {
        "email": email,
        "password": password,
        "name": name,
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
    }
```

### Langkah 2: Tulis Integration Tests

File: `tests/integration/test_cross_service.py`

```python
"""
Integration Tests — Verifikasi komunikasi antar services.
Jalankan dengan: pytest tests/integration/ -v
Syarat: docker compose up -d (semua services running)
"""
import httpx
import pytest


def test_gateway_health(gateway_url):
    """Test 1: Gateway bisa diakses."""
    response = httpx.get(f"{gateway_url}/health")
    assert response.status_code == 200


def test_auth_service_health(gateway_url):
    """Test 2: Auth Service health check via gateway."""
    response = httpx.get(f"{gateway_url}/auth/health")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "auth-service"
    assert data["status"] == "healthy"


def test_item_service_health(gateway_url):
    """Test 3: Item Service health check via gateway."""
    # Item service health route: depends on nginx config
    response = httpx.get(f"{gateway_url}/items/health")
    # Accept 200 or handle that /items/health might not be routed
    assert response.status_code in [200, 404]


def test_register_login_flow(gateway_url):
    """Test 4: Full flow register → login → get token."""
    import time
    email = f"flow-test-{int(time.time())}@example.com"

    # Register
    resp = httpx.post(f"{gateway_url}/auth/register", json={
        "email": email, "password": "FlowTest123", "name": "Flow User"
    })
    assert resp.status_code == 201
    assert resp.json()["email"] == email

    # Login
    resp = httpx.post(f"{gateway_url}/auth/login", json={
        "email": email, "password": "FlowTest123"
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_cross_service_auth_verification(gateway_url, test_user):
    """Test 5: Item Service verifikasi token via Auth Service (cross-service)."""
    # Create item (requires auth verification across services)
    resp = httpx.post(
        f"{gateway_url}/items",
        json={"name": "Integration Test Item", "price": 99000, "quantity": 1},
        headers=test_user["headers"],
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Integration Test Item"
    assert "owner_id" in data


def test_crud_via_gateway(gateway_url, test_user):
    """Test 6: Full CRUD melalui gateway (melibatkan semua services)."""
    headers = test_user["headers"]

    # Create
    resp = httpx.post(f"{gateway_url}/items", json={
        "name": "CRUD Test", "price": 50000, "quantity": 3
    }, headers=headers)
    assert resp.status_code == 201
    item_id = resp.json()["id"]

    # Read
    resp = httpx.get(f"{gateway_url}/items/{item_id}", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["name"] == "CRUD Test"

    # Update
    resp = httpx.put(f"{gateway_url}/items/{item_id}", json={
        "price": 45000
    }, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["price"] == 45000

    # Delete
    resp = httpx.delete(f"{gateway_url}/items/{item_id}", headers=headers)
    assert resp.status_code == 204

    # Verify deleted
    resp = httpx.get(f"{gateway_url}/items/{item_id}", headers=headers)
    assert resp.status_code == 404


def test_unauthorized_without_token(gateway_url):
    """Test 7: Request tanpa token harus ditolak oleh Item Service."""
    resp = httpx.post(f"{gateway_url}/items", json={
        "name": "Should Fail", "price": 100, "quantity": 1
    })
    assert resp.status_code in [401, 422]


def test_invalid_token_rejected(gateway_url):
    """Test 8: Token invalid harus ditolak."""
    resp = httpx.get(
        f"{gateway_url}/items",
        headers={"Authorization": "Bearer invalid-fake-token"}
    )
    assert resp.status_code == 401
```

### Langkah 3: Jalankan Integration Tests

```bash
# Pastikan semua services running
docker compose up -d

# Tunggu services ready
sleep 5

# Jalankan integration tests
pip install httpx pytest
pytest tests/integration/ -v
```

Output yang diharapkan:
```
tests/integration/test_cross_service.py::test_gateway_health PASSED
tests/integration/test_cross_service.py::test_auth_service_health PASSED
tests/integration/test_cross_service.py::test_item_service_health PASSED
tests/integration/test_cross_service.py::test_register_login_flow PASSED
tests/integration/test_cross_service.py::test_cross_service_auth_verification PASSED
tests/integration/test_cross_service.py::test_crud_via_gateway PASSED
tests/integration/test_cross_service.py::test_unauthorized_without_token PASSED
tests/integration/test_cross_service.py::test_invalid_token_rejected PASSED

========================= 8 passed in 3.45s ==========================
```

> ✅ **Checkpoint:** Minimal 6 dari 8 integration tests passing. Tests memverifikasi komunikasi antar Auth Service dan Item Service melalui gateway.

---

## Workshop 13.5: Update Health Endpoint (Aggregated) (15 menit)

### Membuat Health Check Aggregator

Tambahkan endpoint di **gateway level** atau di **Item Service** yang menampilkan status semua dependencies:

Update `services/item-service/main.py`:

```python
@app.get("/health")
async def health_check():
    """Health check dengan dependency status."""
    # Check Auth Service
    auth_status = auth_circuit.get_status()

    # Check database
    db_status = "connected"
    try:
        db = next(get_db())
        db.execute(text("SELECT 1"))
        db.close()
    except Exception:
        db_status = "disconnected"

    overall = "healthy"
    if auth_status["state"] != "CLOSED":
        overall = "degraded"
    if db_status != "connected":
        overall = "unhealthy"

    return {
        "status": overall,
        "service": "item-service",
        "version": "2.1.0",
        "dependencies": {
            "auth-service": {
                "status": "available" if auth_status["state"] == "CLOSED" else "unavailable",
                "circuit_breaker": auth_status,
            },
            "database": {
                "status": db_status,
            },
        },
    }
```

Tambahkan import yang diperlukan di bagian atas main.py:
```python
from sqlalchemy import text
from database import get_db
from auth_client import auth_circuit
```

> ✅ **Checkpoint:** `/health` menunjukkan status dependencies (auth-service + database) dan overall status.

---

## Workshop 13.6: Commit & Verify (20 menit)

### Struktur Repository Akhir

```
cloud-team-XX/
├── services/
│   ├── auth-service/
│   │   ├── main.py
│   │   ├── models.py, schemas.py, database.py
│   │   ├── requirements.txt, Dockerfile
│   │   └── tests/
│   ├── item-service/
│   │   ├── main.py                    ← Updated (health check)
│   │   ├── auth_client.py             ← Updated (retry + circuit breaker)
│   │   ├── circuit_breaker.py         ← Baru
│   │   ├── models.py, schemas.py, database.py
│   │   ├── requirements.txt, Dockerfile
│   │   └── tests/
│   └── gateway/
│       └── nginx.conf
├── tests/
│   └── integration/                   ← Baru
│       ├── conftest.py
│       └── test_cross_service.py
├── scripts/
│   └── migrate_data.py                ← Baru
├── frontend/
├── docker-compose.yml
└── README.md
```

### Commit

```bash
git checkout -b feature/microservices-reliability

git add services/item-service/auth_client.py
git add services/item-service/circuit_breaker.py
git add services/item-service/main.py
git add tests/integration/
git add scripts/migrate_data.py

git commit -m "feat: add reliability patterns to microservices

- Implement retry with exponential backoff (3 retries, 0.5/1/2s delay)
- Implement circuit breaker (5 failures → open, 30s cooldown)
- Add aggregated health check with dependency status
- Add 8 integration tests (cross-service verification)
- Add data migration script (monolith → microservices)"

git push origin feature/microservices-reliability
```

> ✅ **Checkpoint Akhir Workshop:** Retry, circuit breaker, dan integration tests berfungsi. Health check menunjukkan dependency status.

---

# BAGIAN C: TUGAS TERSTRUKTUR (60 Menit)

> 📝 **Kumpulkan sebelum pertemuan 14** via Pull Request.

---

## Tugas 13: Hardening & Documentation

### Pembagian Tugas

| Anggota | Branch Name | Tugas | Detail |
|---------|-------------|-------|--------|
| **Lead Backend** | `feature/graceful-degradation` | Implementasi degraded mode di Item Service | Saat Auth Service down (circuit breaker OPEN), endpoint `GET /items/stats` tetap bisa diakses (return data tanpa auth). Tambah endpoint `GET /items/public` yang tidak membutuhkan auth (return daftar item publik). |
| **Lead Frontend** | `feature/error-handling-ui` | Handle service unavailable di frontend | Tampilkan user-friendly error message saat API return 503. Tambah retry button. Jika auth down, tampilkan banner "Some features temporarily unavailable". |
| **Lead DevOps** | `feature/compose-resilience` | Tambah restart policy dan resource limits | Set `restart: unless-stopped` di semua services. Tambah `deploy.resources.limits` (CPU, memory) di Docker Compose. Buat `docker-compose.dev.yml` override untuk development (hot-reload). |
| **Lead QA & Docs** | `docs/reliability-testing` | Dokumentasi reliability testing | Buat `docs/reliability-testing.md`: skenario test (service down, timeout, recovery), expected behavior, cara reproduce, hasil test. Update `docs/architecture.md` dengan diagram terbaru. |
| **Lead CI/CD** *(5 orang)* | `feature/ci-integration-test` | Tambah integration test di CI | Update GitHub Actions: setelah unit test, jalankan `docker compose up -d`, tunggu services ready, jalankan `pytest tests/integration/`, lalu `docker compose down`. |

### Contoh: CI Integration Test Job

```yaml
  integration-test:
    name: 🔗 Integration Tests
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend]

    steps:
      - uses: actions/checkout@v4

      - name: 🐳 Start all services
        run: docker compose up -d --build

      - name: ⏳ Wait for services
        run: |
          echo "Waiting for services to be ready..."
          sleep 15
          curl --retry 5 --retry-delay 3 http://localhost/health

      - name: 🧪 Run integration tests
        run: |
          pip install httpx pytest
          pytest tests/integration/ -v

      - name: 🛑 Stop services
        if: always()
        run: docker compose down -v
```

### Informasi Pengumpulan

| Item | Keterangan |
|------|------------|
| **Deadline** | Sebelum pertemuan 14 dimulai |
| **Format** | Pull Request ke repository tim — HARUS lulus CI |
| **Yang dinilai** | Graceful degradation, error handling UI, resilience config, docs, semua anggota ≥1 PR |
| **Bonus** | Tim yang menambahkan rate limiting di gateway (Nginx) |

---

# BAGIAN D: BELAJAR MANDIRI (230 Menit)

> 📚 **Tidak dikumpulkan**, tetapi sangat penting untuk pemahaman.

---

## D1. Membaca Referensi (60 menit)

### Bacaan Wajib
1. **Microservices.io — Circuit Breaker**  
   https://microservices.io/patterns/reliability/circuit-breaker.html  
   (Pattern circuit breaker dan implementasinya)

2. **Google SRE Book — Monitoring**  
   https://sre.google/sre-book/monitoring-distributed-systems/  
   (Prinsip monitoring di distributed systems — persiapan minggu 14)

3. **Python Logging — Best Practices**  
   https://docs.python.org/3/howto/logging.html  
   (Structured logging di Python)

### Bacaan Tambahan
- httpx Documentation — Retry and Timeout — https://www.python-httpx.org/advanced/timeouts/
- Nginx Rate Limiting — https://docs.nginx.com/nginx/admin-guide/security-controls/controlling-access-proxied-http/
- Resilience4j Circuit Breaker (Java, tapi konsepnya universal) — https://resilience4j.readme.io/docs/circuitbreaker

---

## D2. Video Tutorial (60 menit)

1. **"Circuit Breaker Pattern"** — cari di YouTube (~15 min)
   - Penjelasan visual circuit breaker di microservices

2. **"Monitoring Microservices"** — IBM Technology (YouTube, ~10 min)
   - Overview monitoring dan observability

3. **"Docker Compose Health Checks"** — cari di YouTube (~10 min)
   - Konfigurasi health check di Docker Compose

4. **"Structured Logging in Python"** — cari di YouTube (~15 min)
   - Best practices logging di Python

---

## D3. Latihan Mandiri (60 menit)

### Soal Pilihan Ganda

**1.** Exponential backoff retry dengan delay 1s, 2s, 4s artinya:
- [ ] a. Delay antar retry berlipat ganda untuk memberi waktu service pulih
- [ ] b. Total waktu retry adalah 7 detik
- [ ] c. Retry dilakukan setiap 1 detik
- [ ] d. Retry berhenti setelah 4 detik

**2.** Circuit breaker berpindah dari CLOSED ke OPEN saat:
- [ ] a. Satu request pertama gagal
- [ ] b. Tidak ada request selama 30 detik
- [ ] c. Jumlah kegagalan mencapai threshold (misal 5 kali berturut-turut)
- [ ] d. Admin menekan tombol reset

**3.** Mengapa kita tidak boleh retry untuk error 401 Unauthorized?
- [ ] a. Karena 401 tidak pernah terjadi di microservices
- [ ] b. Karena retry akan membuat token menjadi valid
- [ ] c. Karena Auth Service tidak mendukung retry
- [ ] d. Karena token yang salah akan tetap salah meskipun dicoba berkali-kali

**4.** Graceful degradation di microservices artinya:
- [ ] a. Aplikasi mati total saat satu service down
- [ ] b. Aplikasi tetap berfungsi dengan kemampuan terbatas saat ada service yang bermasalah
- [ ] c. Semua data dihapus saat terjadi error
- [ ] d. Aplikasi otomatis kembali ke arsitektur monolith

**5.** Integration test berbeda dari unit test karena:
- [ ] a. Integration test lebih cepat dari unit test
- [ ] b. Integration test hanya menguji satu fungsi
- [ ] c. Integration test tidak membutuhkan database
- [ ] d. Integration test memverifikasi komunikasi antar komponen yang berjalan bersamaan

---

## D4. Persiapan Pertemuan Berikutnya (50 menit)

Pertemuan 14 akan membahas **Monitoring, Logging & Observability** — bagaimana memantau kesehatan microservices di production. Persiapkan:

- Apa itu **structured logging** dan mengapa lebih baik dari `print()`?
- Apa itu **metrics** (counter, gauge, histogram)?
- Apa perbedaan **monitoring** vs **observability**?
- Apa itu **centralized logging** dan toolnya (ELK Stack, Grafana Loki)?
- Baca: https://sre.google/sre-book/monitoring-distributed-systems/
- Baca: https://opentelemetry.io/docs/what-is-opentelemetry/

> 💡 **Preview:** Minggu depan kita akan menambahkan structured logging (JSON logs), request tracing (correlation ID), dan health dashboard sederhana. Tujuannya: bisa menjawab "apa yang terjadi?" saat ada masalah di production.

---

---

*Modul ini disusun oleh Aidil Saputra Kirsan, Institut Teknologi Kalimantan.*
