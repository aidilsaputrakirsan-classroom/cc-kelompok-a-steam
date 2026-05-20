import os
import httpx
from fastapi import HTTPException, Header

AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001")

async def verify_token_with_auth_service(authorization: str = Header(...)) -> dict:
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{AUTH_SERVICE_URL}/verify",
                headers={"Authorization": authorization},
                timeout=5.0,
            )

        if response.status_code == 200:
            return response.json()
        elif response.status_code == 401:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        else:
            raise HTTPException(status_code=503, detail="Auth service unavailable")

    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Cannot connect to Auth Service. Is it running?")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Auth Service timeout")

async def increment_api_used_in_auth_service(user_id: int) -> None:
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{AUTH_SERVICE_URL}/users/{user_id}/increment-usage",
                timeout=5.0,
            )
    except Exception as e:
        print(f"Failed to increment API usage for user {user_id}: {e}")
