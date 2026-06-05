"""
Integration Test Configuration — Intirupa
==========================================
Test ini membutuhkan SEMUA container berjalan (docker compose up -d).
Berbeda dari unit test, integration test menguji komunikasi nyata antar service.

Cara menjalankan:
    docker compose up -d
    pytest tests/integration/ -v

Routing via gateway (nginx):
    /auth/*         → auth-service:8001
    /chat/*         → ai-service:8002
    /stats          → ai-service:8002
    /stats/*        → ai-service:8002
    /health         → gateway (langsung, bukan proxy)
"""
import os
import time
import pytest
import httpx

GATEWAY_URL = os.getenv("GATEWAY_URL", "http://localhost")


@pytest.fixture(scope="session")
def gateway_url():
    """Base URL gateway (Nginx)."""
    return GATEWAY_URL


@pytest.fixture(scope="session")
def test_user(gateway_url):
    """
    Daftarkan user test sekali untuk seluruh sesi pengujian.
    Return credentials + token yang bisa dipakai semua test.
    """
    timestamp = int(time.time())
    email = f"integration-test-{timestamp}@intirupa.com"
    password = "IntegrationTest123"
    username = f"testuser{timestamp}"
    full_name = "Integration Test User"

    # Register user baru
    response = httpx.post(
        f"{gateway_url}/auth/register",
        json={
            "email": email,
            "password": password,
            "username": username,
            "full_name": full_name,
        },
        timeout=15.0,
    )
    assert response.status_code == 201, (
        f"Register gagal (status {response.status_code}): {response.text}"
    )

    # Login untuk dapatkan token
    response = httpx.post(
        f"{gateway_url}/auth/login",
        json={"email": email, "password": password},
        timeout=15.0,
    )
    assert response.status_code == 200, (
        f"Login gagal (status {response.status_code}): {response.text}"
    )

    token = response.json()["access_token"]

    return {
        "email": email,
        "password": password,
        "username": username,
        "full_name": full_name,
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
    }
