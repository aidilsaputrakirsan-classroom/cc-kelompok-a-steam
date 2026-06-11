# API Contract Documentation

## Overview

This document defines the complete API contract for the Cloud App microservices architecture.

**Base URLs:**

- Development: `http://localhost`
- Production: `https://cc-kelompok-a-steam-production-51bf.up.railway.app`

---

## Authentication

### JWT Bearer Token

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer <access_token>
```

**Token Acquisition:**

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}

Response 200:
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

**Token Properties:**

- Issued by: Auth Service
- Algorithm: HS256
- Expiry: 30 minutes (configurable via TOKEN_EXPIRE_MINUTES)
- Stored client-side: localStorage under key `access_token`

---

## Error Response Format

All errors use consistent JSON format:

```json
{
  "detail": "Human-readable error message"
}
```

### Status Codes

| Code | Meaning                           | When to Retry      |
| ---- | --------------------------------- | ------------------ |
| 200  | OK                                | N/A                |
| 201  | Created                           | N/A                |
| 204  | No Content (Deleted)              | N/A                |
| 400  | Bad Request (validation)          | No                 |
| 401  | Unauthorized / Invalid Token      | Refresh token      |
| 404  | Not Found                         | No                 |
| 422  | Unprocessable Entity (validation) | No                 |
| 429  | Rate Limited                      | Yes (after delay)  |
| 500  | Internal Server Error             | Yes (with backoff) |
| 502  | Bad Gateway                       | Yes                |
| 503  | Service Unavailable               | Yes                |
| 504  | Gateway Timeout                   | Yes                |

---

## API Endpoints

### Auth Service (`/auth/*`)

#### POST /auth/register

Register new user account.

**Request:**

```bash
POST /auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Validation Rules:**

- `email`: Valid email format, unique
- `password`: Min 8 chars, at least 1 uppercase + 1 digit
- `name`: 2-200 characters

**Response 201:**

```json
{
  "id": 1,
  "email": "newuser@example.com",
  "name": "John Doe"
}
```

**Response 400:**

```json
{
  "detail": "Email already registered"
}
```

---

#### POST /auth/login

User login and get JWT token.

**Request:**

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123"
}
```

**Response 200:**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Response 401:**

```json
{
  "detail": "Invalid email or password"
}
```

---

#### GET /auth/verify

Internal endpoint (called by gateway). Verify JWT token validity.

**Request:**

```bash
GET /auth/verify
Authorization: Bearer <token>
X-Correlation-ID: abc-123-def
```

**Response 200:**

```json
{
  "user_id": 1,
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Response 401:**

```json
{
  "detail": "Invalid or expired token"
}
```

---

#### GET /auth/health

Health check endpoint (no auth required).

**Response 200:**

```json
{
  "status": "healthy",
  "service": "auth-service"
}
```

---

#### GET /auth/metrics

Retrieve service metrics (no auth required).

**Response 200:**

```json
{
  "service": "auth-service",
  "uptime_seconds": 1234.56,
  "total_requests": 150,
  "total_errors": 3,
  "error_rate_percent": 2.0,
  "status_codes": {
    "200": 145,
    "401": 3,
    "500": 2
  },
  "latency": {
    "p50_ms": 15.2,
    "p95_ms": 45.8,
    "p99_ms": 120.3,
    "avg_ms": 25.1
  },
  "endpoints": {
    "POST /register": {
      "count": 5,
      "errors": 0,
      "avg_latency_ms": 120.5
    },
    "POST /login": {
      "count": 15,
      "errors": 3,
      "avg_latency_ms": 45.2
    }
  }
}
```

---

### AI Service (`/items/*` or `/chat/*`)

#### GET /items

List items (requires authentication).

**Request:**

```bash
GET /items?search=&skip=0&limit=20
Authorization: Bearer <token>
X-Correlation-ID: abc-123-def
```

**Query Parameters:**

- `search` (optional): Search by name
- `skip` (optional): Pagination offset (default: 0)
- `limit` (optional): Page size (default: 20, max: 100)

**Response 200:**

```json
{
  "total": 45,
  "items": [
    {
      "id": 1,
      "name": "Item A",
      "description": "Description of item",
      "price": 50000.0,
      "quantity": 10,
      "owner_id": 1,
      "created_at": "2026-02-15T10:30:00Z"
    }
  ]
}
```

---

#### POST /items

Create new item (requires authentication).

**Request:**

```bash
POST /items
Authorization: Bearer <token>
Content-Type: application/json
X-Correlation-ID: abc-123-def

{
  "name": "New Item",
  "description": "Item description",
  "price": 75000.00,
  "quantity": 5
}
```

**Validation Rules:**

- `name`: 1-300 characters, required
- `description`: Max 2000 characters, optional
- `price`: Positive number, max 999,999,999
- `quantity`: Non-negative integer, optional

**Response 201:**

```json
{
  "id": 46,
  "name": "New Item",
  "description": "Item description",
  "price": 75000.0,
  "quantity": 5,
  "owner_id": 1,
  "created_at": "2026-02-15T11:00:00Z"
}
```

---

#### GET /items/{id}

Get single item by ID (requires authentication).

**Request:**

```bash
GET /items/46
Authorization: Bearer <token>
```

**Response 200:**

```json
{
  "id": 46,
  "name": "New Item",
  "price": 75000.0,
  "quantity": 5,
  "owner_id": 1
}
```

**Response 404:**

```json
{
  "detail": "Item not found"
}
```

---

#### PUT /items/{id}

Update item (requires authentication, owner only).

**Request:**

```bash
PUT /items/46
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Item",
  "price": 80000.00
}
```

**Response 200:**

```json
{
  "id": 46,
  "name": "Updated Item",
  "price": 80000.0,
  "quantity": 5
}
```

**Response 403:**

```json
{
  "detail": "Not authorized to update this item"
}
```

---

#### DELETE /items/{id}

Delete item (requires authentication, owner only).

**Request:**

```bash
DELETE /items/46
Authorization: Bearer <token>
```

**Response 204:**
(No content)

---

#### GET /items/health

Health check (no auth required).

**Response 200:**

```json
{
  "status": "healthy",
  "service": "ai-service"
}
```

---

#### GET /items/metrics

Retrieve service metrics (no auth required).

**Response 200:**
(Same format as Auth Service metrics)

---

### API Gateway

#### GET /health

Gateway health check (no auth required).

**Response 200:**

```json
{
  "status": "healthy",
  "service": "gateway"
}
```

---

#### GET /status

System status dashboard (frontend route).

Returns HTML page with real-time service status and metrics.

---

## Rate Limiting

Requests are rate-limited per IP address:

| Endpoint       | Rate     | Burst | Status |
| -------------- | -------- | ----- | ------ |
| `/auth/*`      | 5 req/s  | 10    | 429    |
| `/items/*`     | 20 req/s | 30    | 429    |
| `/` (frontend) | 30 req/s | 50    | 429    |

**When Rate Limited:**

```
HTTP 429 Too Many Requests
Content-Type: application/json

{
  "error": "Too many requests. Please try again later.",
  "retry_after": 60
}
```

---

## Headers

### Recommended Headers

```
X-Correlation-ID: <unique-request-id>  # Tracked across services
User-Agent: <your-app>                  # Identify clients
Content-Type: application/json          # For POST/PUT
```

### Response Headers

```
X-Correlation-ID: <request-id>         # Echoed back for tracking
Content-Type: application/json
```

---

## Pagination

List endpoints support cursor-based pagination:

```bash
# First page
GET /items?skip=0&limit=20

# Next page
GET /items?skip=20&limit=20
```

Response includes total count:

```json
{
  "total": 100,
  "items": [...]
}
```

---

## Versioning

Current API version: **v1** (implicit, no version prefix)

Future versions will use path prefix: `/v2/...`

---

## CORS Policy

Development:

- Allowed origins: `http://localhost*`
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization

Production:

- Allowed origins: `https://cc-kelompok-a-steam-production-51bf.up.railway.app`
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Content-Type, Authorization

---

## Backward Compatibility

All endpoints maintain backward compatibility. Breaking changes will:

1. Be announced with deprecation period (2 weeks minimum)
2. Include `/v2/*` path prefix for new versions
3. Support both old and new versions during transition

---

**Last Updated:** February 2026  
**API Version:** 1.0
