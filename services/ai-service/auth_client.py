"""
Auth Client — HTTP client untuk berkomunikasi dengan Auth Service.
Dilengkapi dengan retry logic dan circuit breaker.
"""
import os
import asyncio
import logging
import httpx
from fastapi import HTTPException, Header, Request
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


async def _call_auth_service(authorization: str, correlation_id: str = None) -> dict:
    """
    Mengirim request verifikasi token ke Auth Service dengan Circuit Breaker + Retry + Correlation ID.
    """
    # Periksa kondisi circuit breaker
    if not auth_circuit.can_execute():
        raise HTTPException(
            status_code=503,
            detail="Auth Service circuit breaker is OPEN. Please try again later."
        )

    headers = {"Authorization": authorization}
    if correlation_id:
        headers["X-Correlation-ID"] = correlation_id

    last_exception = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{AUTH_SERVICE_URL}/verify",
                    headers=headers,
                    timeout=TIMEOUT_SECONDS,
                )

            # Jika sukses (200 OK)
            if response.status_code == 200:
                auth_circuit.record_success()
                logger.info(
                    f"Auth verified (attempt {attempt})",
                    extra={"correlation_id": correlation_id}
                )
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
                    f"(attempt {attempt}/{MAX_RETRIES})",
                    extra={"correlation_id": correlation_id}
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
                f"Cannot connect to Auth Service (attempt {attempt}/{MAX_RETRIES}): {e}",
                extra={"correlation_id": correlation_id}
            )
            last_exception = HTTPException(
                status_code=503,
                detail="Cannot connect to Auth Service. Is it running?"
            )

        except httpx.TimeoutException as e:
            logger.warning(
                f"Auth Service timeout (attempt {attempt}/{MAX_RETRIES}): {e}",
                extra={"correlation_id": correlation_id}
            )
            last_exception = HTTPException(
                status_code=504,
                detail="Auth Service timeout"
            )

        # Lakukan jeda backoff jika masih ada kesempatan retry
        if attempt < MAX_RETRIES:
            delay = BASE_DELAY * (2 ** (attempt - 1))
            logger.info(f"Retrying in {delay}s...", extra={"correlation_id": correlation_id})
            await asyncio.sleep(delay)

    # Jika semua percobaan retry gagal, catat kegagalan ke circuit breaker
    auth_circuit.record_failure()
    logger.error(
        f"Auth Service unreachable after {MAX_RETRIES} attempts",
        extra={"correlation_id": correlation_id}
    )
    raise last_exception or HTTPException(
        status_code=503,
        detail="Auth Service unavailable. Please try again later."
    )


async def verify_token_with_auth_service(
    request: Request,
    authorization: str = Header(...),
) -> dict:
    """
    FastAPI Dependency: Memverifikasi token via Auth Service dengan correlation ID.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    correlation_id = getattr(request.state, "correlation_id", None)
    return await _call_auth_service(authorization, correlation_id)



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
