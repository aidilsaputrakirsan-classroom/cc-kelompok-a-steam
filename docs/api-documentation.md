# 📚 API Documentation - Inti Rupa (STEAM)

Dokumentasi ini mencakup seluruh endpoint REST API yang tersedia pada sistem Inti Rupa.

```
Base URL: http://localhost:8000/docs
```

---

## 🔑 Authentication

Aplikasi ini menggunakan JWT (JSON Web Token). Tambahkan header berikut untuk endpoint yang membutuhkan autentikasi:

```
Authorization: Bearer <your_token>
```

---

## 📌 API Summary

### 1. Health & Team

| Method | Endpoint | Description | Auth Required? |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | Cek status server | No |
| `GET` | `/team` | Info tim | No |

---

### 2. Authentication

| Method | Endpoint | Description | Auth Required? |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Daftar akun | No |
| `POST` | `/auth/login` | Login & dapat token | No |
| `GET` | `/auth/me` | Profil user | Yes |

---

### 3. Generate

| Method | Endpoint | Description | Auth Required? |
| :--- | :--- | :--- | :--- |
| `GET` | `/generate/models` | Daftar model AI | Yes |
| `POST` | `/generate/image` | Generate gambar | Yes |
| `POST` | `/generate/summarize` | Rangkum teks | Yes |
| `POST` | `/generate/caption` | Caption/OCR gambar | Yes |

---

### 4. History

| Method | Endpoint | Description | Auth Required? |
| :--- | :--- | :--- | :--- |
| `GET` | `/history/images` | Lihat riwayat gambar | Yes |
| `GET` | `/history/images/{id}` | Detail gambar | Yes |
| `DELETE` | `/history/images/{id}` | Hapus gambar | Yes |
| `GET` | `/history/summaries` | Lihat riwayat rangkuman | Yes |
| `GET` | `/history/captions` | Lihat riwayat caption | Yes |

---

### 5. Statistics

| Method | Endpoint | Description | Auth Required? |
| :--- | :--- | :--- | :--- |
| `GET` | `/stats` | Statistik penggunaan | Yes |

---

## 🛠️ API Details

### A. Public Endpoints

#### 1. Health Check

- **URL:** `/health`
- **Method:** `GET`
- **Auth Required?** No
- **Request Body:** none
- **Response (200 OK):**

```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

- **curl:**
```bash
curl -X 'GET' \
  'http://localhost:8000/health' \
  -H 'accept: application/json'
```

- **request url:**
```
http://localhost:8000/health
```

---

#### 2. Team Information

- **URL:** `/team`
- **Method:** `GET`
- **Auth Required?** No
- **Request Body:** `none`
- **Response (200 OK):**

```json
{
  "team": "Steam",
  "members": [
    {
      "name": "Irfan Zaki Riyanto",
      "nim": "10231045",
      "role": "Lead Backend"
    },
    {
      "name": "Incha Raghil",
      "nim": "10231043",
      "role": "Lead Frontend"
    },
    {
      "name": "Jonathan Cristopher Jetro",
      "nim": "10231047",
      "role": "Lead DevOps"
    },
    {
      "name": "Jonathan Joseph Yudita Tampubolon",
      "nim": "10231048",
      "role": "Lead QA & Docs"
    }
  ]
}
```

- **curl:**
```bash
curl -X 'GET' \
  'http://localhost:8000/team' \
  -H 'accept: application/json'
```

- **request url:**
```
http://localhost:8000/team
```

---

### B. Authentication Endpoints

#### 1. Register

- **URL:** `/auth/register`
- **Method:** `POST`
- **Auth Required?** No
- **Request Body:**

```json
{
  "username": "aidil_saputra",
  "email": "aidil@student.itk.ac.id",
  "full_name": "Aidil Saputra",
  "password": "Password123"
}
```

- **Response (201 Created):**

```json
{
  "id": 1,
  "username": "aidil_saputra",
  "email": "aidil@student.itk.ac.id",
  "full_name": "Aidil Saputra",
  "api_quota": 100,
  "api_used": 0,
  "is_active": true,
  "created_at": "2026-04-16T10:30:00Z"
}
```

- **Response (400 Bad Request):**

```json
{
  "detail": "Email atau username sudah terdaftar."
}
```

- **curl:**
```bash
curl -X 'POST' \
  'http://localhost:8000/auth/register' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "username": "aidil_saputra",
  "email": "aidil@student.itk.ac.id",
  "full_name": "Aidil Saputra",
  "password": "Password123"
}'
```

- **request url:**
```
http://localhost:8000/auth/register
```

---

#### 2. Login

- **URL:** `/auth/login`
- **Method:** `POST`
- **Auth Required?** No
- **Request Body:**

```json
{
  "email": "aidil@student.itk.ac.id",
  "password": "Password123"
}
```

- **Response (200 OK):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzQ2MDAwMDAwfQ...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "aidil_saputra",
    "email": "aidil@student.itk.ac.id",
    "full_name": "Aidil Saputra",
    "api_quota": 100,
    "api_used": 0
  }
}
```

- **Response (401 Unauthorized):**

```json
{
  "detail": "Email atau password tidak cocok."
}
```

- **curl:**
```bash
curl -X 'POST' \
  'http://localhost:8000/auth/login' \
  -H 'accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "aidil@student.itk.ac.id",
  "password": "Password123"
}'
```

- **request url:**
```
http://localhost:8000/auth/login
```

---

#### 3. Get Current User Profile

- **URL:** `/auth/me`
- **Method:** `GET`
- **Auth Required?** Yes
- **Request Body:** `none`
- **Response (200 OK):**

```json
{
  "id": 1,
  "username": "aidil_saputra",
  "email": "aidil@student.itk.ac.id",
  "full_name": "Aidil Saputra",
  "api_quota": 100,
  "api_used": 45,
  "is_active": true,
  "created_at": "2026-04-16T10:30:00Z"
}
```

- **curl:**
```bash
curl -X 'GET' \
  'http://localhost:8000/auth/me' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

- **request url:**
```
http://localhost:8000/auth/me
```

---

### C. AI Image Generator Endpoints

#### 1. Get Available Models

- **URL:** `/generate/models`
- **Method:** `GET`
- **Auth Required?** Yes
- **Request Body:** `none`
- **Response (200 OK):**

```json
{
  "models": [
    "black-forest-labs/FLUX.1-dev",
    "stabilityai/stable-diffusion-xl-base-1.0"
  ]
}
```

- **curl:**
```bash
curl -X 'GET' \
  'http://localhost:8000/generate/models' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

- **request url:**
```
http://localhost:8000/generate/models
```

---

#### 2. Generate Image

- **URL:** `/generate/image`
- **Method:** `POST`
- **Auth Required?** Yes
- **Request Body:**

```json
{
  "prompt": "A futuristic city with flying cars and neon lights",
  "model": "stabilityai/black-forest-labs/FLUX.1-dev",
  "negative_prompt": "blurry, low quality, distorted",
  "guidance_scale": 7.5,
  "num_inference_steps": 20,
  "width": 512,
  "height": 512,
  "seed": 42
}
```

- **Response (200 OK):**

```json
{
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAA...",
  "prompt": "A futuristic city with flying cars and neon lights",
  "model": "stabilityai/black-forest-labs/FLUX.1-dev"
}
```

- **curl:**
```bash
curl -X 'POST' \
  'http://localhost:8000/generate/image' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
  "prompt": "A futuristic city with flying cars and neon lights",
  "model": "stabilityai/black-forest-labs/FLUX.1-dev",
  "negative_prompt": "blurry, low quality",
  "guidance_scale": 7.5,
  "num_inference_steps": 20,
  "width": 512,
  "height": 512
}'
```

- **request url:**
```
http://localhost:8000/generate/image
```

---

### D. AI Text Summarizer Endpoint

#### 1. Summarize Text

- **URL:** `/generate/summarize`
- **Method:** `POST`
- **Auth Required?** Yes
- **Request Body:**

```json
{
  "source_type": "text",
  "source_content": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua..."
}
```

- **Response (200 OK):**

```json
{
  "summary": "Ringkasan singkat dari teks yang di-input",
  "source": "Lorem ipsum dolor sit amet...",
  "model": "gemini-2.5-flash"
}
```

- **curl:**
```bash
curl -X 'POST' \
  'http://localhost:8000/generate/summarize' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
  "source_type": "text",
  "source_content": "Lorem ipsum dolor sit amet, consectetur adipiscing elit..."
}'
```

- **request url:**
```
http://localhost:8000/generate/summarize
```

---

### E. AI Image Caption (OCR) Endpoint

#### 1. Generate Caption / Extract Text from Image

- **URL:** `/generate/caption`
- **Method:** `POST`
- **Auth Required?** Yes
- **Content-Type:** `multipart/form-data`
- **Request Parameters:** image (File)

- **Response (200 OK):**

```json
{
  "caption": "Deskripsi gambar: Ini adalah foto makanan soto ayam tradisional...\n\nTeks yang terlihat di gambar: 'WARUNG SOTO AYAM ORIGINAL'",
  "filename": "photo.jpg",
  "model": "gemini-2.5-flash"
}
```

- **Response (400 Bad Request):**

```json
{
  "detail": "Format gambar harus JPEG, PNG, atau WEBP"
}
```

- **curl:**
```bash
curl -X 'POST' \
  'http://localhost:8000/generate/caption' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -F 'image=@/path/to/photo.jpg;type=image/jpeg'
```

- **request url:**
```
http://localhost:8000/generate/caption
```

---

### F. History Management Endpoints

#### 1. Get Image Generation History

- **URL:** `/history/images`
- **Method:** `GET`
- **Auth Required?** Yes
- **Request Body:** none

- **Response (200 OK):**

```json
[
  {
    "id": 1,
    "user_id": 1,
    "prompt": "A futuristic city with flying cars",
    "negative_prompt": "blurry",
    "image_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhE...",
    "model_name": "stabilityai/black-forest-labs/FLUX.1-dev",
    "generation_time": 45.23,
    "status": "completed",
    "error_message": null,
    "created_at": "2026-04-16T10:30:00Z"
  },
  {
    "id": 2,
    "user_id": 1,
    "prompt": "Beautiful sunset",
    "negative_prompt": null,
    "image_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhE...",
    "model_name": "black-forest-labs/FLUX.1-dev",
    "generation_time": 52.10,
    "status": "completed",
    "error_message": null,
    "created_at": "2026-04-16T09:15:00Z"
  }
]
```

- **curl:**
```bash
curl -X 'GET' \
  'http://localhost:8000/history/images?skip=0&limit=10' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

- **request url:**
```
http://localhost:8000/history/images?skip=0&limit=10
```

---

#### 2. Get Single Image Generation Detail

- **URL:** `/history/images/{generation_id}`
- **Method:** `GET`
- **Auth Required?** Yes
- **Path Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| generation_id | Integer | ID unik image generation (Contoh: 1) |

- **Request Body:** `none`
- **Response (200 OK):** (Single object seperti array di atas)

```json
{
  "id": 1,
  "user_id": 1,
  "prompt": "A futuristic city with flying cars",
  "model_name": "stabilityai/black-forest-labs/FLUX.1-dev",
  "generation_time": 45.23,
  "status": "completed",
  "created_at": "2026-04-16T10:30:00Z"
}
```

- **Response (404 Not Found):**

```json
{
  "detail": "Riwayat tidak ditemukan."
}
```

- **curl:**
```bash
curl -X 'GET' \
  'http://localhost:8000/history/images/1' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

- **request url:**
```
http://localhost:8000/history/images/1
```

---

#### 3. Delete Image Generation History

- **URL:** `/history/images/{generation_id}`
- **Method:** `DELETE`
- **Auth Required?** Yes
- **Path Parameters:**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| generation_id | Integer | ID unik image generation (Contoh: 1) |

- **Request Body:** `none`
- **Response (204 No Content):** Kosong

- **Response (404 Not Found):**

```json
{
  "detail": "Riwayat tidak ditemukan."
}
```

- **curl:**
```bash
curl -X 'DELETE' \
  'http://localhost:8000/history/images/1' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

- **request url:**
```
http://localhost:8000/history/images/1
```

---

#### 4. Get Text Summarization History

- **URL:** `/history/summaries`
- **Method:** `GET`
- **Auth Required?** Yes
- **Request Body:** none

- **Response (200 OK):**

```json
[
  {
    "id": 1,
    "user_id": 1,
    "source_type": "text",
    "source_content": "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
    "summary_text": "Ringkasan singkat dari article...",
    "model_name": "gemini-2.5-flash",
    "original_length": 5000,
    "summary_length": 500,
    "compression_ratio": 0.1,
    "processing_time": 8.5,
    "status": "completed",
    "error_message": null,
    "created_at": "2026-04-16T10:30:00Z"
  }
]
```

- **curl:**
```bash
curl -X 'GET' \
  'http://localhost:8000/history/summaries?skip=0&limit=10' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

- **request url:**
```
http://localhost:8000/history/summaries?skip=0&limit=10
```

---

#### 5. Get Image Caption History

- **URL:** `/history/captions`
- **Method:** `GET`
- **Auth Required?** Yes
- **Request Body:** none

- **Response (200 OK):**

```json
[
  {
    "id": 1,
    "user_id": 1,
    "image_url": "uploaded_photo_1713258600",
    "caption_text": "Deskripsi gambar: menunjukkan makanan tradisional...",
    "model_name": "gemini-2.5-flash",
    "processing_time": 7.2,
    "status": "completed",
    "error_message": null,
    "created_at": "2026-04-16T10:30:00Z"
  }
]
```

- **curl:**
```bash
curl -X 'GET' \
  'http://localhost:8000/history/captions?skip=0&limit=10' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

- **request url:**
```
http://localhost:8000/history/captions?skip=0&limit=10
```

---

### G. Analytics Endpoint

#### 1. Get User Statistics

- **URL:** `/stats`
- **Method:** `GET`
- **Auth Required?** Yes
- **Request Body:** `none`
- **Response (200 OK):**

```json
{
  "user": {
    "id": 1,
    "username": "aidil_saputra",
    "email": "aidil@student.itk.ac.id",
    "api_quota": 100,
    "api_used": 45
  },
  "usage": {
    "total_image_generations": 15,
    "total_text_summarizations": 20,
    "total_image_captions": 10,
    "total_api_calls": 45
  }
}
```

**Interpretation:**
- `api_quota`: Total API calls yang bisa dipakai (100 per user)
- `api_used`: API calls yang sudah dipakai (45)
- `remaining`: 100 - 45 = 55 API calls tersisa
- `total_image_generations`: Jumlah gambar yang sudah di-generate
- `total_text_summarizations`: Jumlah teks yang sudah di-rangkum
- `total_image_captions`: Jumlah gambar yang sudah di-caption
- `total_api_calls`: Total dari ketiga fitur di atas

- **curl:**
```bash
curl -X 'GET' \
  'http://localhost:8000/stats' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

- **request url:**
```
http://localhost:8000/stats
```

---

---


