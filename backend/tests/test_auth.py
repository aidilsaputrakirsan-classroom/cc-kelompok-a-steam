"""Test authentication endpoints."""

def test_register_success(client):
    """Test register user baru berhasil."""
    response = client.post("/auth/register", json={
        "username": "newuser",           # ✅ Harus ada username tanpa spasi
        "email": "newuser@example.com",
        "password": "SecurePass123",
        "full_name": "New User"          # ✅ Ubah name jadi full_name
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["full_name"] == "New User"  # ✅ Cek full_name
    assert data["username"] == "newuser"    # ✅ Cek username
    assert "id" in data
    # Password TIDAK boleh ada di response
    assert "password" not in data
    assert "hashed_password" not in data

def test_register_duplicate_email(client):
    """Test register dengan email yang sudah ada → 400."""
    # Register pertama
    client.post("/auth/register", json={
        "username": "user1",             # ✅ Tambah username
        "email": "duplicate@example.com",
        "password": "Password123",       # ✅ Password minimal 8 karakter agar tidak 422
        "full_name": "User 1"            # ✅ Ubah ke full_name
    })
    # Register kedua dengan email sama (tapi username berbeda agar murni nge-test duplikat email)
    response = client.post("/auth/register", json={
        "username": "user2",             
        "email": "duplicate@example.com",
        "password": "Password456",       # ✅ Pastikan minimal 8 karakter
        "full_name": "User 2"
    })
    assert response.status_code == 400

def test_login_success(client):
    """Test login dengan kredensial benar → return token."""
    # Register dulu
    client.post("/auth/register", json={
        "username": "loginuser",         # ✅ Tambah username
        "email": "login@example.com",
        "password": "MyPassword123",
        "full_name": "Login User"        # ✅ Ubah ke full_name
    })
    # Login
    response = client.post("/auth/login", json={
        "email": "login@example.com",
        "password": "MyPassword123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_wrong_password(client):
    """Test login dengan password salah → 401."""
    # Register
    client.post("/auth/register", json={
        "username": "wronguser",         # ✅ Tambah username
        "email": "wrongpass@example.com",
        "password": "CorrectPass123",
        "full_name": "User"              # ✅ Ubah ke full_name
    })
    # Login dengan password salah
    response = client.post("/auth/login", json={
        "email": "wrongpass@example.com",
        "password": "WrongPassword123"
    })
    assert response.status_code == 401

def test_get_me_success(client, auth_headers):
    """Test get current user profile."""
    response = client.get("/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "username" in data
    assert "email" in data
    assert "api_quota" in data

def test_get_me_unauthorized(client):
    """Test get current user profile tanpa token → 403."""
    response = client.get("/auth/me")
    assert response.status_code == 403

def test_get_stats_success(client, auth_headers):
    """Test get user stats."""
    response = client.get("/stats", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "user" in data
    assert "usage" in data
    assert "total_api_calls" in data["usage"]
