# 🏗️ Arsitektur Sistem & API Swagger — Inti Rupa Cloud App

Dokumen ini menjelaskan arsitektur microservices akhir dari platform **Inti Rupa** beserta panduan dokumentasi API interaktif menggunakan Swagger UI.

---

## 📊 Diagram Arsitektur Mikroservis

Sistem **Inti Rupa** menggunakan arsitektur microservices terdesentralisasi dengan 5 kontainer utama yang terhubung dalam satu jaringan internal Docker bridge (`intirupa`):

```mermaid
graph TD
    %% Nodes
    User([👤 User Browser / React UI])
    
    subgraph "API Gateway (Port 80)"
        Gateway["🚪 Nginx Gateway<br/>(Reverse Proxy & Rate Limiter)"]
    end
    
    subgraph "Frontend Static Server"
        Frontend["🎨 Frontend SPA<br/>(React Static / Port 80)"]
    end
    
    subgraph "Microservices Layer"
        AuthService["🔐 Auth Service<br/>(FastAPI / Port 8001)"]
        AIService["🤖 AI Service<br/>(FastAPI / Port 8002)"]
    end
    
    subgraph "Databases Layer (Database per Service)"
        AuthDB[("🗄️ Auth DB<br/>PostgreSQL<br/>Port: 5433 (External)")]
        AIDB[("🗄️ AI DB<br/>PostgreSQL<br/>Port: 5435 (External)")]
    end
    
    subgraph "External Integration"
        GeminiSDK["Google Gemini API<br/>(Text Summary & OCR)"]
        HFClient["HuggingFace Hub API<br/>(Flux Image Generation)"]
    end

    %% Connections
    User -->|HTTP Requests| Gateway
    Gateway -->|Route: /| Frontend
    Gateway -->|Route: /auth/*| AuthService
    Gateway -->|Route: /chat/* atau /stats| AIService
    
    AuthService -->|Read/Write| AuthDB
    AIService -->|Read/Write| AIDB
    
    %% Inter-service
    AIService -->|1. Stateless Token Verification| SharedSecret["Shared SECRET_KEY"]
    AIService -->|2. Asynchronous Call<br/>PUT /auth/users/me/increment-api<br/>(Circuit Breaker)| AuthService
    
    %% External Calls
    AIService -->|SDK API Call| GeminiSDK
    AIService -->|Inference Call| HFClient

    %% Styling
    style User fill:#e1f5ff,stroke:#03a9f4,stroke-width:2px
    style Gateway fill:#fff3e0,stroke:#ff9800,stroke-width:2px
    style Frontend fill:#f3e5f5,stroke:#9c27b0,stroke-width:1px
    style AuthService fill:#e8f5e9,stroke:#4caf50,stroke-width:2px
    style AIService fill:#e8f5e9,stroke:#4caf50,stroke-width:2px
    style AuthDB fill:#ffebee,stroke:#e91e63,stroke-width:1px
    style AIDB fill:#ffebee,stroke:#e91e63,stroke-width:1px
    style SharedSecret fill:#eceff1,stroke:#607d8b,stroke-width:1px
```

### Penjelasan Diagram:
1.  **Nginx API Gateway:** Bertindak sebagai entry point tunggal. Semua request dari browser diarahkan melalui port `80`. Nginx melakukan routing berdasarkan path prefix dan memproteksi endpoint dari brute-force melalui modul rate limiting.
2.  **Stateless JWT Verification:** Saat user mengakses endpoint terproteksi di `ai-service`, service ini tidak melakukan query/request verifikasi ke `auth-service`. Verifikasi token dilakukan secara stateless langsung di `ai-service` menggunakan kunci simetris `SECRET_KEY` yang sama (Shared Secret).
3.  **Circuit Breaker & Inter-service Communication:** Panggilan sinkron dari `ai-service` ke `auth-service` untuk pencatatan kuota API (`PUT /auth/users/me/increment-api`) dibungkus dengan Circuit Breaker. Jika `auth-service` mengalami downtime, sirkuit akan terbuka (OPEN state) dan request AI tetap dapat diproses (Graceful Degradation).

---

## 🔌 Pemetaan Port Layanan

| Nama Kontainer | Peran Kontainer | Port Internal | Port Eksternal | URL Akses |
| :--- | :--- | :--- | :--- | :--- |
| **intirupa-gateway** | Nginx Gateway | 80 | **80** | `http://localhost/` |
| **intirupa-frontend** | React Frontend SPA | 80 | - | Hanya via Gateway |
| **intirupa-auth-service** | FastAPI Auth Service | 8001 | - | `http://localhost/auth/` |
| **intirupa-ai-service** | FastAPI AI Service | 8002 | - | `http://localhost/chat/` |
| **intirupa-auth-db** | PostgreSQL Auth Database | 5432 | **5433** | `localhost:5433` |
| **intirupa-ai-db** | PostgreSQL AI Database | 5432 | **5435** | `localhost:5435` |

---

## 📖 API Documentation (Swagger)

FastAPI secara otomatis menghasilkan dokumentasi API interaktif yang mematuhi spesifikasi OpenAPI. Dokumentasi ini dapat digunakan untuk menguji fungsionalitas endpoint secara langsung dari browser.

### 1. Auth Service Swagger UI
Digunakan untuk interaksi & testing endpoint pendaftaran user, login, dan profile:
*   **URL Akses:** `http://localhost/auth/docs`
*   **Endpoint Utama:**
    *   `POST /auth/register` - Mendaftarkan akun baru.
    *   `POST /auth/login` - Autentikasi user & generate JWT Token.
    *   `GET /auth/users/me` - Mengambil detail profil user aktif.
    *   `PUT /auth/users/me/increment-api` - Increment counter kuota API user.
    *   `GET /auth/health` - Health check status service.

### 2. AI Service Swagger UI
Digunakan untuk interaksi & testing sesi AI Chat, OCR, Gambar, dan monitoring metrik:
*   **URL Akses:** `http://localhost/chat/docs`
*   **Endpoint Utama:**
    *   `POST /chat/sessions` - Membuat sesi interaksi AI baru.
    *   `GET /chat/sessions` - Mengambil daftar sesi interaksi user.
    *   `POST /chat/sessions/{session_id}/continue` - Mengirim prompt lanjutan dalam sesi.
    *   `PATCH /chat/sessions/{session_id}` - Mengupdate judul sesi AI.
    *   `DELETE /chat/sessions/{session_id}` - Menghapus sesi AI.
    *   `GET /stats` - Mengambil statistik detail penggunaan AI user login.
    *   `GET /stats/degraded` - Mengambil statistik global jika auth service down (mode degraded).
    *   `GET /stats/public` - Mengambil statistik publik agregat platform.
    *   `GET /health` - Health check AI service.
