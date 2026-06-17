# Dokumentasi Kontrak API (API Contract)

Dokumen ini mendefinisikan kontrak API lengkap untuk arsitektur mikroservis **Inti Rupa**. Seluruh request eksternal diarahkan melalui API Gateway (Nginx).

---

## 1. Informasi Umum

### Base URLs
*   **Development:** `http://localhost` (Port 80 via Gateway)
*   **Production:** `https://cc-kelompok-a-steam-production.up.railway.app`

### Keamanan & Autentikasi
Seluruh endpoint terproteksi memerlukan token JWT (JSON Web Token) yang dikirimkan melalui HTTP header:
```http
Authorization: Bearer <access_token>
```
Properti Token JWT:
*   **Algoritma:** HS256
*   **Masa Berlaku:** 30 Menit (dapat dikonfigurasi melalui `ACCESS_TOKEN_EXPIRE_MINUTES`)

---

## 2. Format Respon Error

Semua error response dari backend menggunakan format JSON standar:
```json
{
  "detail": "Pesan error detail yang human-readable"
}
```

### HTTP Status Codes
*   **200 OK:** Request sukses.
*   **201 Created:** Sesi baru atau data baru berhasil dibuat.
*   **204 No Content:** Penghapusan sukses (tidak mengembalikan body).
*   **400 Bad Request:** Validasi input gagal atau request salah format.
*   **401 Unauthorized:** Token JWT tidak disertakan, tidak valid, atau kadaluarsa.
*   **404 Not Found:** Resource yang diminta tidak ditemukan di database.
*   **429 Too Many Requests:** Terkena limitasi rate limiting Nginx Gateway.
*   **502 Bad Gateway / 503 Service Unavailable:** Service dependency down atau gagal terhubung.

---

## 3. Endpoint Auth Service (`/auth/*`)

Seluruh rute ini dipetakan oleh Gateway ke port internal `8001` milik `auth-service`.

### POST /auth/register
Mendaftarkan akun pengguna baru.
*   **Autentikasi:** Tidak
*   **Payload Request:**
    ```json
    {
      "email": "user@example.com",
      "password": "SecurePassword123",
      "full_name": "Nama Pengguna"
    }
    ```
*   **Aturan Validasi:**
    *   `email`: Format email valid, bersifat unik.
    *   `password`: Panjang 8 - 128 karakter, minimal 1 huruf besar dan 1 angka.
    *   `full_name`: Panjang 2 - 100 karakter, whitespace akan dibersihkan secara otomatis.
*   **Respon Sukses (201 Created):**
    ```json
    {
      "id": 1,
      "email": "user@example.com",
      "full_name": "Nama Pengguna",
      "api_used": 0,
      "created_at": "2026-06-14T12:00:00Z"
    }
    ```

---

### POST /auth/login
Melakukan autentikasi pengguna dan mengembalikan token JWT.
*   **Autentikasi:** Tidak
*   **Payload Request:**
    ```json
    {
      "username": "user@example.com",
      "password": "SecurePassword123"
    }
    ```
*   **Respon Sukses (200 OK):**
    ```json
    {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "bearer"
    }
    ```
*   **Respon Gagal (401 Unauthorized):**
    ```json
    {
      "detail": "Email/Username atau password salah"
    }
    ```

---

### GET /auth/users/me
Mendapatkan profil dan statistik kuota API pengguna aktif.
*   **Autentikasi:** Ya (Bearer Token)
*   **Respon Sukses (200 OK):**
    ```json
    {
      "id": 1,
      "email": "user@example.com",
      "full_name": "Nama Pengguna",
      "api_used": 12,
      "created_at": "2026-06-14T12:00:00Z"
    }
    ```

---

## 4. Endpoint AI Service (`/chat/*`)

Seluruh rute ini dipetakan oleh Gateway ke port internal `8002` milik `ai-service`.

### POST /chat/sessions
Membuat sesi interaksi AI baru (bisa berupa teks, gambar, atau OCR).
*   **Autentikasi:** Ya (Bearer Token)
*   **Payload Request:**
    ```json
    {
      "title": "Analisis Dokumen Penting",
      "session_type": "summarize",
      "first_message": "Tolong rangkum teks berikut...",
      "model": "gemini-3.1-flash-lite-preview",
      "negative_prompt": "noise, blur",
      "image_data": "data:image/jpeg;base64,..."
    }
    ```
*   **Aturan Validasi:**
    *   `session_type`: Harus bernilai `"summarize"`, `"image"`, atau `"ocr"`.
    *   `image_data`: Wajib dikirim dalam format Base64 jika `session_type` adalah `"ocr"`.
*   **Respon Sukses (201 Created):**
    ```json
    {
      "id": 5,
      "title": "Analisis Dokumen Penting",
      "session_type": "summarize",
      "user_id": 1,
      "created_at": "2026-06-14T12:05:00Z",
      "messages": [
        {
          "id": 10,
          "role": "user",
          "content": "Tolong rangkum teks berikut...",
          "content_type": "text",
          "created_at": "2026-06-14T12:05:00Z"
        },
        {
          "id": 11,
          "role": "assistant",
          "content": "Hasil rangkuman dokumen...",
          "content_type": "text",
          "created_at": "2026-06-14T12:05:02Z",
          "metadata": {
            "model": "gemini-3.1-flash-lite-preview",
            "processing_time": 1.45
          }
        }
      ]
    }
    ```

---

### POST /chat/sessions/{session_id}/continue
Melanjutkan interaksi (mengirimkan prompt lanjutan) pada sesi yang sudah ada.
*   **Autentikasi:** Ya (Bearer Token)
*   **Payload Request:**
    ```json
    {
      "message": "Apa kesimpulan dari poin kedua?",
      "model": "gemini-3.1-flash-lite-preview",
      "negative_prompt": null,
      "image_data": null
    }
    ```
*   **Respon Sukses (200 OK):**
    Mengembalikan data sesi lengkap (`ChatSessionResponse`) yang telah diperbarui dengan pesan baru dari user dan assistant.

---

### GET /chat/sessions
Mendapatkan semua daftar sesi interaksi milik user aktif.
*   **Autentikasi:** Ya (Bearer Token)
*   **Query Parameters:**
    *   `session_type` (opsional): Filter tipe sesi (`"summarize"`, `"image"`, atau `"ocr"`).
    *   `skip` (opsional): Offset paginasi (default `0`).
    *   `limit` (opsional): Jumlah data yang diambil (default `20`).
*   **Respon Sukses (200 OK):**
    ```json
    [
      {
        "id": 5,
        "title": "Analisis Dokumen Penting",
        "session_type": "summarize",
        "created_at": "2026-06-14T12:05:00Z"
      }
    ]
    ```

---

### PATCH /chat/sessions/{session_id}
Mengubah judul sesi interaksi AI.
*   **Autentikasi:** Ya (Bearer Token)
*   **Payload Request:**
    ```json
    {
      "title": "Judul Baru Sesi Rangkuman"
    }
    ```
*   **Respon Sukses (200 OK):**
    Mengembalikan data sesi lengkap yang telah diubah judulnya.

---

### DELETE /chat/sessions/{session_id}
Menghapus satu sesi interaksi beserta seluruh pesan di dalamnya.
*   **Autentikasi:** Ya (Bearer Token)
*   **Respon Sukses (204 No Content):**
    (Tidak mengembalikan body data)

---

### GET /stats
Mendapatkan statistik detail penggunaan AI milik user aktif yang sedang login.
*   **Autentikasi:** Ya (Bearer Token)
*   **Respon Sukses (200 OK):**
    ```json
    {
      "user": {
        "user_id": 1,
        "email": "user@example.com"
      },
      "usage": {
        "total_image_generations": 5,
        "total_text_summarizations": 7,
        "total_image_captions": 0,
        "total_api_calls": 12
      }
    }
    ```

---

## 5. Endpoints Publik & Monitoring

### GET /stats/public
Mendapatkan statistik agregat seluruh penggunaan platform (tanpa autentikasi).
*   **Autentikasi:** Tidak
*   **Respon Sukses (200 OK):**
    ```json
    {
      "platform": "Intirupa AI",
      "message": "Statistik penggunaan platform secara publik.",
      "stats": {
        "total_image_generations": 45,
        "total_text_summarizations": 82,
        "total_image_captions": 14,
        "total_chat_sessions": 30,
        "total_api_calls": 141,
        "total_users_served": 15
      }
    }
    ```

---

### GET /health
Menampilkan status kesehatan gateway.
*   **Respon Sukses (200 OK):**
    ```json
    {
      "status": "healthy",
      "service": "gateway"
    }
    ```

---

### GET /auth/health
Menampilkan status kesehatan dari `auth-service` dan koneksi database user.
*   **Respon Sukses (200 OK):**
    ```json
    {
      "status": "healthy",
      "service": "auth-service"
    }
    ```

---

### GET /chat/health
Menampilkan status kesehatan dari `ai-service`, database AI, dan status sirkuit breaker ke auth service.
*   **Respon Sukses (200 OK):**
    ```json
    {
      "status": "healthy",
      "service": "ai-service",
      "version": "2.1.0",
      "dependencies": {
        "auth-service": {
          "status": "available",
          "circuit_breaker": {
            "state": "CLOSED",
            "failure_count": 0
          }
        },
        "database": {
          "status": "connected"
        }
      }
    }
    ```

---

### GET /auth/metrics dan GET /chat/metrics
Menyediakan metrik operasional aplikasi (uptime, request count, error count, dan latensi p50/p95/p99).
*   **Autentikasi:** Tidak
*   **Respon Sukses (200 OK):**
    ```json
    {
      "service": "ai-service",
      "uptime_seconds": 3600.0,
      "total_requests": 250,
      "total_errors": 2,
      "error_rate_percent": 0.8,
      "latency": {
        "p50_ms": 12.5,
        "p95_ms": 85.0,
        "p99_ms": 340.2,
        "avg_ms": 22.1
      }
    }
    ```
