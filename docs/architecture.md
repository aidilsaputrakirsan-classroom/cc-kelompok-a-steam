# 🏗️ Arsitektur & API Contract - Inti Rupa Cloud App

**Project**: Inti Rupa - Platform Asisten Cerdas Berbasis Cloud  
**Architecture**: Microservices  
**Version**: 1.0  
**Date**: June 2026

---

## 📊 Diagram Kontainer

Sistem **Inti Rupa** menggunakan arsitektur **Microservices** dengan 6 kontainer utama:

```mermaid
graph TB
    User["👤 User Browser"]
    
    subgraph "API Gateway"
        Gateway["🚪 Nginx Gateway<br/>(Port 80)"]
    end
    
    subgraph "Frontend"
        Frontend["🎨 Frontend Container<br/>(React SPA)"]
    end
    
    subgraph "Microservices"
        AuthService["🔐 Auth Service<br/>(Port 8001)<br/>FastAPI"]
        AIService["🤖 AI Service<br/>(Port 8002)<br/>FastAPI"]
    end
    
    subgraph "Databases"
        AuthDB["🗄️ Auth DB<br/>(auth_db)<br/>PostgreSQL<br/>External Port: 5433"]
        AIDB["🗄️ AI DB<br/>(ai_db)<br/>PostgreSQL<br/>External Port: 5435"]
    end
    
    User -->|HTTP/HTTPS| Gateway
    Gateway -->|Route /| Frontend
    Gateway -->|Route /auth/*| AuthService
    Gateway -->|Route /ai/*| AIService
    
    AuthService -->|Read/Write| AuthDB
    AIService -->|Read/Write| AIDB
    AIService -->|HTTP Call<br/>verify token| AuthService
    
    style User fill:#e1f5ff
    style Gateway fill:#fff3e0
    style Frontend fill:#f3e5f5
    style AuthService fill:#e8f5e9
    style AIService fill:#e8f5e9
    style AuthDB fill:#fce4ec
    style AIDB fill:#fce4ec
```

### Arsitektur Overview

| Komponen | Deskripsi |
|----------|-----------|
| **Nginx Gateway** | Single entry point untuk semua request eksternal (port 80) |
| **Frontend** | React SPA - User interface aplikasi |
| **Auth Service** | Mengelola autentikasi & otorisasi pengguna |
| **AI Service** | Fitur AI: Image generation & Text summarization |
| **Auth DB** | Database terpisah untuk Auth Service (PostgreSQL) |
| **AI DB** | Database terpisah untuk AI Service (PostgreSQL) |

### Prinsip Desain

- **Database per Service**: Setiap service memiliki database terpisah (tidak ada shared database)
- **Sync Communication**: AI Service → Auth Service via HTTP
- **Circuit Breaker**: Handling ketika Auth Service tidak tersedia
- **Service Discovery**: Via Docker networking (DNS by service name)

---

## 🔌 Tabel Pemetaan Port

### External Ports (Accessible dari Host)

| Container | Service | Internal Port | **External Port** | Akses |
|-----------|---------|---------------|-------------------|-------|
| `intirupa-gateway` | Nginx | 80 | **80** | `http://localhost` |
| `intirupa-auth-db` | PostgreSQL Auth | 5432 | **5433** | DBeaver/pgAdmin: localhost:5433 |
| `intirupa-ai-db` | PostgreSQL AI | 5432 | **5435** | DBeaver/pgAdmin: localhost:5435 |

### Internal Ports (Docker Network)

| Container | Service | Internal Port | Access From |
|-----------|---------|---------------|-------------|
| `intirupa-auth-service` | FastAPI | 8001 | `http://auth-service:8001` |
| `intirupa-ai-service` | FastAPI | 8002 | `http://ai-service:8002` |
| `intirupa-frontend` | React | 80 | `http://frontend` |

---

## 📡 API Contract

### 1️⃣ Register User

**Endpoint**: `POST /auth/register`  
**Gateway URL**: `http://localhost/auth/register`  
**Response**: `201 Created`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "full_name": "John Doe"
}
```

**Success Response** (201):
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

**Error Response** (400):
```json
{
  "detail": "Email already registered",
  "error_code": "EMAIL_EXISTS"
}
```

---

### 2️⃣ Login User

**Endpoint**: `POST /auth/login`  
**Gateway URL**: `http://localhost/auth/login`  
**Response**: `200 OK`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Success Response** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe"
  }
}
```

**Error Response** (401):
```json
{
  "detail": "Invalid email or password",
  "error_code": "INVALID_CREDENTIALS"
}
```

**Token Properties**:
- Algorithm: HS256
- Expiry: 30 minutes
- Storage: localStorage

---

### 3️⃣ Verify Token (Internal)

**Endpoint**: `POST /auth/verify`  
**Internal URL**: `http://auth-service:8001/auth/verify`  
**Response**: `200 OK` / `401 Unauthorized`

**Request Headers**:
```
Authorization: Bearer <access_token>
```

**Success Response** (200):
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "is_valid": true
}
```

**Error Response** (401):
```json
{
  "detail": "Invalid or expired token",
  "error_code": "INVALID_TOKEN"
}
```

---

### 4️⃣ Generate Image

**Endpoint**: `POST /ai/generate/image`  
**Gateway URL**: `http://localhost/ai/generate/image`  
**Response**: `200 OK` / `401 Unauthorized` / `503 Service Unavailable`

**Request Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "prompt": "A futuristic city with flying cars",
  "model": "stable-diffusion-2",
  "steps": 50,
  "height": 768,
  "width": 768,
  "guidance_scale": 7.5
}
```

**Success Response** (200):
```json
{
  "id": "img_abc123",
  "user_id": 1,
  "prompt": "A futuristic city with flying cars",
  "image_url": "https://cdn.example.com/img_abc123.png",
  "model_used": "stable-diffusion-2",
  "created_at": "2024-01-15T10:45:30Z",
  "processing_time_ms": 8500
}
```

**Error Response** (401):
```json
{
  "detail": "Invalid or expired authentication token",
  "error_code": "UNAUTHORIZED"
}
```

**Error Response** (503 - Circuit Breaker):
```json
{
  "detail": "Auth service unavailable - circuit breaker opened",
  "error_code": "AUTH_SERVICE_UNAVAILABLE",
  "retry_after_seconds": 30
}
```

---

### 5️⃣ Summarize Text

**Endpoint**: `POST /ai/summarize/text`  
**Gateway URL**: `http://localhost/ai/summarize/text`  
**Response**: `200 OK` / `401 Unauthorized` / `503 Service Unavailable`

**Request Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "text": "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
  "max_length": 150,
  "min_length": 30,
  "language": "en"
}
```

**Success Response** (200):
```json
{
  "id": "summary_xyz789",
  "user_id": 1,
  "original_text": "Lorem ipsum dolor sit amet...",
  "summary": "Lorem ipsum dolor sit amet summary...",
  "original_length": 2500,
  "summary_length": 128,
  "model_used": "facebook/bart-large-cnn",
  "created_at": "2024-01-15T10:50:15Z",
  "processing_time_ms": 3200
}
```

**Error Response** (401):
```json
{
  "detail": "Invalid or expired authentication token",
  "error_code": "UNAUTHORIZED"
}
```

**Error Response** (503 - Circuit Breaker):
```json
{
  "detail": "Auth service unavailable - circuit breaker opened",
  "error_code": "AUTH_SERVICE_UNAVAILABLE",
  "retry_after_seconds": 30
}
```

---

## 🗄️ Database Schema

### Auth Database (auth_db - Port 5433)

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### AI Database (ai_db - Port 5435)

```sql
-- AI Results table
CREATE TABLE ai_results (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER NOT NULL,  -- NOT a foreign key - just user_id reference
  result_type VARCHAR(50),     -- 'image' or 'summary'
  input_text TEXT,
  output_url VARCHAR(255),
  model_used VARCHAR(255),
  processing_time_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- History/Cache table
CREATE TABLE history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  request_hash VARCHAR(255) UNIQUE,
  response JSONB,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Penting: Database Isolation

- **Auth DB** (5433): Berisi data pengguna (`users` table)
- **AI DB** (5435): Berisi hasil AI (`ai_results` table)
- **owner_id** di `ai_db.ai_results` **BUKAN foreign key** - hanya penyimpanan user_id untuk referensi
- Kedua database **sepenuhnya terpisah** - tidak ada cross-database queries

---

## 🔄 Service Communication Flow

```
1. User Request
   └─ POST http://localhost/auth/register
      └─ Nginx Gateway routes to Auth Service
         └─ Auth Service → auth_db

2. User Login
   └─ POST http://localhost/auth/login
      └─ Nginx Gateway routes to Auth Service
         └─ Returns JWT token

3. AI Service Request
   └─ POST http://localhost/ai/generate/image (with Bearer token)
      └─ Nginx Gateway routes to AI Service
         └─ AI Service verifies token
            └─ HTTP call: POST http://auth-service:8001/auth/verify
               └─ Auth Service validates JWT
                  └─ Returns user_id if valid
         └─ AI Service generates image
            └─ Stores result in ai_db with owner_id = user_id
            └─ Returns image_url to client
```

---

## 🔐 Authentication Flow

```
┌─────────────────────┐
│   Frontend/Client   │
└──────────┬──────────┘
           │
           │ POST /auth/login
           │ (email, password)
           ▼
┌─────────────────────────────┐
│   Nginx Gateway             │
│   (Port 80)                 │
└──────────┬──────────────────┘
           │
           │ Route to /auth/login
           ▼
┌─────────────────────────────┐
│   Auth Service              │
│   (Port 8001)               │
│                             │
│ 1. Verify credentials       │
│ 2. Generate JWT token       │
│ 3. Return access_token      │
└──────────┬──────────────────┘
           │
           │ Returns: {access_token, user}
           ▼
┌─────────────────────┐
│   Frontend/Client   │
│                     │
│ Store in localStorage
│ Use in future requests:
│ Authorization: Bearer <token>
└─────────────────────┘
```

---

## 🚀 Running the System

```bash
# Start all services
docker compose up -d

# Verify all containers healthy
docker compose ps

# Check logs
docker compose logs -f auth-service ai-service

# Stop services
docker compose down
```

---

**Last Updated**: June 2026  
**Status**: Production Ready
