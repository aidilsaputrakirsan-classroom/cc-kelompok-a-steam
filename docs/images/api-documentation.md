# API Documentation — Cloud App (FastAPI + JWT)

Dokumentasi ini menjelaskan endpoint backend untuk aplikasi Cloud App, termasuk autentikasi JWT dan endpoint CRUD item.

---

## Base URL

- Local development: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`

---

## Authentication

API menggunakan **JWT Bearer Token** untuk endpoint protected.

Header yang dipakai:

```http
Authorization: Bearer <access_token>
```

Token didapat dari endpoint `POST /auth/login`.

---

## Ringkasan Endpoint

### Public (tanpa token)

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /team` *(jika endpoint tersedia di backend)*

### Protected (wajib token)

- `GET /auth/me`
- `POST /items`
- `GET /items`
- `GET /items/{item_id}`
- `PUT /items/{item_id}`
- `DELETE /items/{item_id}`
- `GET /items/stats` *(jika endpoint tersedia di backend)*

---

## 1) Health Check

### `GET /health`

Cek status service backend.

- **Auth required:** No

#### Success Response (200)

```json
{
  "status": "healthy",
  "version": "0.4.0"
}
```

#### cURL

```bash
curl -X GET "http://localhost:8000/health"
```

---

## 2) Register User

### `POST /auth/register`

Mendaftarkan user baru.

- **Auth required:** No
- **Content-Type:** `application/json`

#### Request Body

```json
{
  "email": "user@student.itk.ac.id",
  "name": "Nama User",
  "password": "password123"
}
```

#### Success Response (201)

```json
{
  "id": 1,
  "email": "user@student.itk.ac.id",
  "name": "Nama User",
  "is_active": true,
  "created_at": "2026-03-19T08:00:00.000000Z"
}
```

#### Error Response

- `400` — email sudah terdaftar
- `422` — validasi input gagal

#### cURL

```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@student.itk.ac.id\",\"name\":\"Nama User\",\"password\":\"password123\"}"
```

---

## 3) Login User

### `POST /auth/login`

Login user dan menghasilkan JWT token.

- **Auth required:** No
- **Content-Type:** `application/json`

#### Request Body

```json
{
  "email": "user@student.itk.ac.id",
  "password": "password123"
}
```

#### Success Response (200)

```json
{
  "access_token": "<JWT_TOKEN>",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@student.itk.ac.id",
    "name": "Nama User",
    "is_active": true,
    "created_at": "2026-03-19T08:00:00.000000Z"
  }
}
```

#### Error Response

- `401` — email atau password salah
- `422` — format request tidak valid

#### cURL

```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"user@student.itk.ac.id\",\"password\":\"password123\"}"
```

---

## 4) Get Current User

### `GET /auth/me`

Mengambil profil user yang sedang login.

- **Auth required:** Yes (Bearer token)

#### Success Response (200)

```json
{
  "id": 1,
  "email": "user@student.itk.ac.id",
  "name": "Nama User",
  "is_active": true,
  "created_at": "2026-03-19T08:00:00.000000Z"
}
```

#### Error Response

- `401` — token tidak valid / expired / tidak dikirim
- `403` — akun tidak aktif

#### cURL

```bash
curl -X GET "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 5) Create Item

### `POST /items`

Membuat item baru.

- **Auth required:** Yes
- **Content-Type:** `application/json`

#### Request Body

```json
{
  "name": "Laptop",
  "description": "Laptop untuk cloud computing",
  "price": 15000000,
  "quantity": 5
}
```

#### Success Response (201)

```json
{
  "id": 4,
  "name": "Laptop",
  "description": "Laptop untuk cloud computing",
  "price": 15000000,
  "quantity": 5,
  "created_at": "2026-03-19T08:10:00.000000Z",
  "updated_at": null
}
```

#### Error Response

- `401` — unauthorized
- `422` — validasi input gagal

#### cURL

```bash
curl -X POST "http://localhost:8000/items" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Laptop\",\"description\":\"Laptop untuk cloud computing\",\"price\":15000000,\"quantity\":5}"
```

---

## 6) Get Items (List + Search + Pagination)

### `GET /items`

Mengambil daftar item.

- **Auth required:** Yes
- **Query params (opsional):**
  - `skip` (default: 0)
  - `limit` (default: 20)
  - `search` (contoh: `laptop`)

#### Contoh URL

- `/items`
- `/items?skip=0&limit=20`
- `/items?search=laptop`

#### Success Response (200)

```json
{
  "items": [
    {
      "id": 4,
      "name": "Laptop",
      "description": "Laptop untuk cloud computing",
      "price": 15000000,
      "quantity": 5,
      "created_at": "2026-03-19T08:10:00.000000Z",
      "updated_at": null
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 20
}
```

#### Error Response

- `401` — unauthorized

#### cURL

```bash
curl -X GET "http://localhost:8000/items?search=laptop&skip=0&limit=20" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 7) Get Item by ID

### `GET /items/{item_id}`

Mengambil satu item berdasarkan ID.

- **Auth required:** Yes

#### Success Response (200)

```json
{
  "id": 4,
  "name": "Laptop",
  "description": "Laptop untuk cloud computing",
  "price": 15000000,
  "quantity": 5,
  "created_at": "2026-03-19T08:10:00.000000Z",
  "updated_at": null
}
```

#### Error Response

- `401` — unauthorized
- `404` — item tidak ditemukan

#### cURL

```bash
curl -X GET "http://localhost:8000/items/4" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 8) Update Item

### `PUT /items/{item_id}`

Update data item berdasarkan ID.

- **Auth required:** Yes
- **Content-Type:** `application/json`

#### Request Body (contoh)

```json
{
  "name": "Laptop",
  "description": "Laptop untuk cloud computing",
  "price": 14000000,
  "quantity": 5
}
```

#### Success Response (200)

```json
{
  "id": 4,
  "name": "Laptop",
  "description": "Laptop untuk cloud computing",
  "price": 14000000,
  "quantity": 5,
  "created_at": "2026-03-19T08:10:00.000000Z",
  "updated_at": "2026-03-19T08:20:00.000000Z"
}
```

#### Error Response

- `401` — unauthorized
- `404` — item tidak ditemukan
- `422` — validasi gagal

#### cURL

```bash
curl -X PUT "http://localhost:8000/items/4" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Laptop\",\"description\":\"Laptop untuk cloud computing\",\"price\":14000000,\"quantity\":5}"
```

---

## 9) Delete Item

### `DELETE /items/{item_id}`

Menghapus item berdasarkan ID.

- **Auth required:** Yes

#### Success Response

- `204 No Content`

#### Error Response

- `401` — unauthorized
- `404` — item tidak ditemukan

#### cURL

```bash
curl -i -X DELETE "http://localhost:8000/items/4" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 10) Item Statistics *(Jika Diimplementasikan)*

### `GET /items/stats`

Mengambil ringkasan statistik item.

- **Auth required:** Biasanya Yes (sesuaikan implementasi backend)

#### Contoh Success Response (200)

```json
{
  "total_item": 3,
  "total_value": 45000000,
  "most_expensive": {
    "id": 6,
    "name": "Server",
    "price": 20000000
  },
  "cheapest": {
    "id": 7,
    "name": "Mouse",
    "price": 150000
  }
}
```

#### cURL

```bash
curl -X GET "http://localhost:8000/items/stats" \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

---

## 11) Team Info *(Jika Endpoint Tersedia)*

### `GET /team`

Informasi anggota tim.

- **Auth required:** No

#### cURL

```bash
curl -X GET "http://localhost:8000/team"
```

---

## HTTP Status Code Referensi

- `200` — OK
- `201` — Created
- `204` — No Content
- `400` — Bad Request
- `401` — Unauthorized
- `403` — Forbidden
- `404` — Not Found
- `422` — Validation Error
- `500` — Internal Server Error

---

## Alur Test End-to-End (Disarankan)

1. `POST /auth/register`
2. `POST /auth/login` → ambil `access_token`
3. `GET /auth/me` dengan header Bearer
4. `POST /items`
5. `GET /items`
6. `GET /items/{id}`
7. `PUT /items/{id}`
8. `DELETE /items/{id}`
9. `GET /items/{id}` (pastikan `404`)

---

## Catatan

- Simpan secret di `.env`, jangan di-hardcode.
- Jangan commit file `.env` ke repository.
- Untuk production, gunakan CORS whitelist spesifik (bukan `*`).
