"""Test health check and team endpoints."""

def test_health_check(client):
    """Test health endpoint → 200 dan status healthy."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "1.0.0"  # ✅ Disesuaikan dengan struktur API-mu

def test_team_info(client):
    """Test team endpoint → 200 dan memeriksa nama tim."""
    response = client.get("/team")
    assert response.status_code == 200
    data = response.json()
    assert data["team"] == "Steam"     # ✅ Otomatis aku tambahkan untuk endpoint /team milikmu!
    assert "members" in data
    assert len(data["members"]) == 4
