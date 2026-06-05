"""
Integration Tests — Verifikasi komunikasi antar service Intirupa
================================================================
Jalankan dengan: pytest tests/integration/ -v
Syarat: docker compose up -d (semua service harus running)

Mapping endpoint di modul 13 ke Intirupa:
  test_gateway_health            → GET /health (gateway)
  test_auth_service_health       → GET /auth/health (auth-service)
  test_ai_service_health         → GET /stats/public (ai-service, tanpa auth)
  test_register_login_flow       → POST /auth/register + POST /auth/login
  test_cross_service_token_verify → GET /stats (ai-service memanggil auth-service)
  test_public_stats_no_auth      → GET /stats/public (tidak perlu token)
  test_unauthorized_without_token → GET /stats tanpa token → ditolak
  test_invalid_token_rejected    → GET /stats dengan token palsu → ditolak
"""
import httpx
import pytest


# =============================================
# TEST 1: Gateway Health Check
# =============================================
def test_gateway_health(gateway_url):
    """Gateway (Nginx) dapat diakses dan mengembalikan status healthy."""
    response = httpx.get(f"{gateway_url}/health", timeout=10.0)
    assert response.status_code == 200
    data = response.json()
    assert data.get("status") == "healthy"
    assert data.get("service") == "gateway"


# =============================================
# TEST 2: Auth Service Health Check
# =============================================
def test_auth_service_health(gateway_url):
    """Auth Service dapat diakses via gateway dan statusnya healthy."""
    response = httpx.get(f"{gateway_url}/auth/health", timeout=10.0)
    assert response.status_code == 200
    data = response.json()
    assert data.get("service") == "auth-service"
    assert data.get("status") == "healthy"


# =============================================
# TEST 3: AI Service Health Check
# =============================================
def test_ai_service_health(gateway_url):
    """
    AI Service dapat diakses via /stats/public (endpoint publik, tanpa auth).
    Kita gunakan ini sebagai proxy health check AI service.
    """
    response = httpx.get(f"{gateway_url}/stats/public", timeout=10.0)
    # Harus 200 karena /stats/public tidak butuh token
    assert response.status_code == 200
    data = response.json()
    assert "platform" in data
    assert "stats" in data


# =============================================
# TEST 4: Full Register → Login Flow
# =============================================
def test_register_login_flow(gateway_url):
    """Alur lengkap register → login → dapat token JWT yang valid."""
    import time
    email = f"flow-test-{int(time.time())}@intirupa.com"

    # Register
    resp = httpx.post(
        f"{gateway_url}/auth/register",
        json={
            "email": email,
            "password": "FlowTest123",
            "username": f"flowuser{int(time.time())}",
            "full_name": "Flow Test User",
        },
        timeout=15.0,
    )
    assert resp.status_code == 201, f"Register gagal: {resp.text}"
    assert resp.json()["email"] == email

    # Login
    resp = httpx.post(
        f"{gateway_url}/auth/login",
        json={"email": email, "password": "FlowTest123"},
        timeout=15.0,
    )
    assert resp.status_code == 200, f"Login gagal: {resp.text}"
    assert "access_token" in resp.json()
    assert resp.json()["token_type"] == "bearer"


# =============================================
# TEST 5: Cross-Service Token Verification
# =============================================
def test_cross_service_token_verify(gateway_url, test_user):
    """
    AI Service berhasil memverifikasi token via Auth Service (cross-service call).
    GET /stats membutuhkan token valid → ai-service panggil auth-service /verify.
    """
    resp = httpx.get(
        f"{gateway_url}/stats",
        headers=test_user["headers"],
        timeout=15.0,
    )
    assert resp.status_code == 200, f"Stats gagal: {resp.text}"
    data = resp.json()

    # Verifikasi struktur response
    assert "user" in data
    assert "usage" in data
    assert data["user"]["email"] == test_user["email"]

    # Verifikasi semua field usage ada
    usage = data["usage"]
    assert "total_image_generations" in usage
    assert "total_text_summarizations" in usage
    assert "total_image_captions" in usage
    assert "total_api_calls" in usage


# =============================================
# TEST 6: Public Stats (Tanpa Auth)
# =============================================
def test_public_stats_no_auth(gateway_url):
    """
    GET /stats/public dapat diakses tanpa token apapun.
    Analog dengan GET /items/public di modul 13.
    """
    resp = httpx.get(f"{gateway_url}/stats/public", timeout=10.0)
    assert resp.status_code == 200
    data = resp.json()

    assert data.get("platform") == "Intirupa AI"
    stats = data.get("stats", {})
    assert "total_image_generations" in stats
    assert "total_api_calls" in stats
    assert "total_users_served" in stats
    # Semua nilai harus non-negatif
    for key, val in stats.items():
        assert val >= 0, f"{key} tidak boleh negatif"


# =============================================
# TEST 7: Unauthorized Tanpa Token
# =============================================
def test_unauthorized_without_token(gateway_url):
    """Request ke /stats tanpa Authorization header harus ditolak (401 atau 422)."""
    resp = httpx.get(f"{gateway_url}/stats", timeout=10.0)
    assert resp.status_code in [401, 422], (
        f"Harusnya ditolak, tapi dapat: {resp.status_code}"
    )


# =============================================
# TEST 8: Token Palsu Ditolak
# =============================================
def test_invalid_token_rejected(gateway_url):
    """Request dengan token palsu harus ditolak dengan 401 Unauthorized."""
    resp = httpx.get(
        f"{gateway_url}/stats",
        headers={"Authorization": "Bearer ini-token-palsu-tidak-valid"},
        timeout=10.0,
    )
    assert resp.status_code == 401, (
        f"Token palsu harusnya ditolak (401), tapi dapat: {resp.status_code}"
    )
