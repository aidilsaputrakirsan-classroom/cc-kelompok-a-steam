"""
Auth Client — HTTP client untuk berkomunikasi dengan Auth Service.
Dilengkapi dengan retry logic dan circuit breaker.
"""
import os
import asyncio
import logging
import httpx
from fastapi import HTTPException, Header
from circuit_breaker import CircuitBreaker

logger = logging.getLogger(__name__)

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001")

# =====================
# RETRY CONFIG
# =====================
MAX_RETRIES = 3
BASE_DELAY = 0.5           # Jeda awal 0.5 detik
TIMEOUT_SECONDS = 5.0      # Timeout request ke auth service
RETRYABLE_STATUS_CODES = {500, 502, 503, 504}

# =====================
# CIRCUIT BREAKER INSTANCE
# =====================
auth_circuit = CircuitBreaker(
    name="auth-service",
    failure_threshold=5,
    cooldown_seconds=30,
)


async def _call_auth_service(authorization: str) -> dict:
    """
    Mengirim request verifikasi token ke Auth Service dengan Circuit Breaker + Retry.
    """
    # Periksa kondisi circuit breaker
    if not auth_circuit.can_execute():
        raise HTTPException(
            status_code=503,
            detail="Auth Service circuit breaker is OPEN. Please try again later."
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

            # Jika sukses (200 OK)
            if response.status_code == 200:
                auth_circuit.record_success()
                logger.info(f"Auth verified (attempt {attempt})")
                return response.json()

            # Error deterministik (tidak layak di-retry, tapi membuktikan service responsif)
            if response.status_code == 401:
                auth_circuit.record_success()
                raise HTTPException(status_code=401, detail="Invalid or expired token")
            if response.status_code == 400:
                auth_circuit.record_success()
                raise HTTPException(status_code=400, detail="Bad auth request")

            # Error dari server (layak di-retry)
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
            last_exception = HTTPException(
                status_code=503,
                detail="Cannot connect to Auth Service. Is it running?"
            )

        except httpx.TimeoutException as e:
            logger.warning(
                f"Auth Service timeout (attempt {attempt}/{MAX_RETRIES}): {e}"
            )
            last_exception = HTTPException(
                status_code=504,
                detail="Auth Service timeout"
            )

        # Lakukan jeda backoff jika masih ada kesempatan retry
        if attempt < MAX_RETRIES:
            delay = BASE_DELAY * (2 ** (attempt - 1))
            logger.info(f"Retrying in {delay}s...")
            await asyncio.sleep(delay)

    # Jika semua percobaan retry gagal, catat kegagalan ke circuit breaker
    auth_circuit.record_failure()
    logger.error(f"Auth Service unreachable after {MAX_RETRIES} attempts")
    raise last_exception or HTTPException(
        status_code=503,
        detail="Auth Service unavailable. Please try again later."
    )


async def verify_token_with_auth_service(authorization: str = Header(...)) -> dict:
    """
    FastAPI Dependency: Memverifikasi token via Auth Service.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    return await _call_auth_service(authorization)


async def increment_api_used_in_auth_service(user_id: int) -> None:
    """
    Internal API: Menambahkan hitungan kuota penggunaan API untuk user.
    """
    # Jika circuit breaker terbuka, jangan kirim request untuk menghemat resource
    if not auth_circuit.can_execute():
        logger.warning(f"Skipping usage increment for user {user_id} because auth-service circuit is OPEN.")
        return

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AUTH_SERVICE_URL}/users/{user_id}/increment-usage",
                timeout=TIMEOUT_SECONDS,
            )
            if response.status_code == 200:
                auth_circuit.record_success()
            elif response.status_code >= 500:
                auth_circuit.record_failure()
    except Exception as e:
        auth_circuit.record_failure()
        logger.error(f"Failed to increment API usage for user {user_id}: {e}")
