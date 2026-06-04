"""
conftest.py — Shared test fixtures for AI Service tests.

Strategi testing:
- Gunakan SQLite in-memory sebagai pengganti PostgreSQL (tidak perlu DB nyata)
- Mock `verify_token_with_auth_service` agar test tidak bergantung Auth Service
- TestClient dari FastAPI/Starlette untuk simulasi HTTP request
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Set env vars SEBELUM import app agar lifespan tidak create_all ke postgres
import os
os.environ["TESTING"] = "true"
os.environ["DATABASE_URL"] = "sqlite:///./test_ai.db"
os.environ["AUTH_SERVICE_URL"] = "http://fake-auth:8001"

from database import Base, get_db
from main import app
from auth_client import verify_token_with_auth_service

# =====================
# Test Database Setup
# =====================
TEST_DATABASE_URL = "sqlite:///./test_ai.db"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},  # SQLite perlu ini untuk threading
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    """Buat semua tabel di SQLite test DB sebelum test dimulai."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    # Dispose semua koneksi sebelum hapus file (penting di Windows)
    engine.dispose()
    try:
        if os.path.exists("./test_ai.db"):
            os.remove("./test_ai.db")
    except PermissionError:
        pass  # Di Windows kadang file masih locked, CI Linux tidak ada masalah ini


@pytest.fixture()
def db_session():
    """Sediakan fresh DB session per test, rollback setelah selesai."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db_session):
    """
    TestClient dengan dependency override:
    - DB → SQLite test session
    - Auth → mock user (tidak perlu token nyata)
    """
    MOCK_USER = {"user_id": 1, "email": "test@intirupa.com", "name": "Test User"}

    def override_get_db():
        yield db_session

    async def override_verify_token(authorization: str = "Bearer fake-token"):
        return MOCK_USER

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[verify_token_with_auth_service] = override_verify_token

    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()


@pytest.fixture()
def auth_headers():
    """Header Authorization dummy untuk dipakai di request test."""
    return {"Authorization": "Bearer fake-test-token"}
