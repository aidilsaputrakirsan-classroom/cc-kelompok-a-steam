"""Test CRUD Chat Session endpoints."""
from unittest.mock import patch, MagicMock


class MockGeminiResponse:
    """Mock response object dari Gemini API."""
    text = "Ini adalah ringkasan percobaan yang dibuat oleh AI mock untuk keperluan testing."


@patch("google.generativeai.GenerativeModel.generate_content", return_value=MockGeminiResponse())
def test_chat_crud_flow(mock_gemini, client, auth_headers):
    """
    Satu alur pengujian lengkap (Create, Read, Update, Delete).
    Menggunakan mock AI agar tidak bergantung pada API key eksternal.
    """
    # Pastikan mock siap dipakai (return_value sudah di-set di decorator)
    # ---------------------------------------------------------
    # 1. CREATE (POST) - Menggunakan mock Gemini
    # ---------------------------------------------------------
    response = client.post("/chat/sessions", json={
        "title": "Test CRUD AI",
        "session_type": "summarize",
        "first_message": "Ini adalah teks percobaan untuk memastikan AI merespons dengan benar."
    }, headers=auth_headers)

    assert response.status_code == 201, f"Gagal membuat sesi: {response.json()}"
    data = response.json()
    assert data["title"] == "Test CRUD AI"
    assert data["session_type"] == "summarize"
    assert "id" in data

    session_id = data["id"]

    # ---------------------------------------------------------
    # 2. VERIFIKASI BALASAN AI (MOCK)
    # ---------------------------------------------------------
    messages = data["messages"]
    assert len(messages) == 2  # 1 Pesan user, 1 Pesan balasan AI
    assert messages[0]["role"] == "user"
    assert messages[1]["role"] == "assistant"

    # ---------------------------------------------------------
    # 3. READ ALL (GET)
    # ---------------------------------------------------------
    get_all_resp = client.get("/chat/sessions", headers=auth_headers)
    assert get_all_resp.status_code == 200
    assert len(get_all_resp.json()) >= 1

    # ---------------------------------------------------------
    # 4. READ ONE (GET)
    # ---------------------------------------------------------
    get_one_resp = client.get(f"/chat/sessions/{session_id}", headers=auth_headers)
    assert get_one_resp.status_code == 200
    assert get_one_resp.json()["id"] == session_id

    # ---------------------------------------------------------
    # 4.5. CONTINUE CHAT (POST)
    # ---------------------------------------------------------
    continue_resp = client.post(f"/chat/sessions/{session_id}/continue", json={
        "message": "Tolong berikan kesimpulannya dalam 1 kalimat pendek saja."
    }, headers=auth_headers)
    assert continue_resp.status_code == 200
    assert len(continue_resp.json()["messages"]) == 4
    assert continue_resp.json()["messages"][2]["role"] == "user"
    assert continue_resp.json()["messages"][3]["role"] == "assistant"

    # ---------------------------------------------------------
    # 5. UPDATE (PATCH)
    # ---------------------------------------------------------
    update_resp = client.patch(f"/chat/sessions/{session_id}", json={
        "title": "Judul Baru Test AI"
    }, headers=auth_headers)
    assert update_resp.status_code == 200
    assert update_resp.json()["title"] == "Judul Baru Test AI"

    # ---------------------------------------------------------
    # 6. DELETE (DELETE)
    # ---------------------------------------------------------
    del_resp = client.delete(f"/chat/sessions/{session_id}", headers=auth_headers)
    assert del_resp.status_code == 204

    # Verifikasi sudah terhapus
    check_del_resp = client.get(f"/chat/sessions/{session_id}", headers=auth_headers)
    assert check_del_resp.status_code == 404

def test_create_chat_unauthorized(client):
    """Test membuat chat tanpa login → 403 (FastAPI HTTPBearer default)."""
    response = client.post("/chat/sessions", json={
        "title": "Hacker",
        "session_type": "summarize",
        "first_message": "Bypass!"
    })
    assert response.status_code == 403

def test_chat_invalid_session_type(client, auth_headers):
    """Test (Edge Case): Input session_type tidak valid -> 422."""
    response = client.post("/chat/sessions", json={
        "title": "Invalid Type",
        "session_type": "video_call", # Invalid, seharusnya 'image' atau 'summarize'
        "first_message": "Hello world"
    }, headers=auth_headers)
    assert response.status_code == 422

def test_chat_empty_message(client, auth_headers):
    """Test (Edge Case): Pesan terlalu pendek/kosong -> 422."""
    response = client.post("/chat/sessions", json={
        "title": "Short Message",
        "session_type": "summarize",
        "first_message": "hi" # Pydantic min_length=3
    }, headers=auth_headers)
    assert response.status_code == 422

from unittest.mock import patch, AsyncMock
@patch("google.generativeai.GenerativeModel.generate_content_async", new_callable=AsyncMock)
def test_chat_pagination(mock_gemini, client, auth_headers):
    """Test (Pagination): Endpoint list chat dengan ?skip=0&limit=2."""
    # Setup Mock AI
    class MockResponse:
        text = "Mock summary"
    mock_gemini.return_value = MockResponse()
    
    # Buat 3 sesi chat
    for i in range(3):
        client.post("/chat/sessions", json={
            "title": f"Chat {i}",
            "session_type": "summarize",
            "first_message": f"Message {i}"
        }, headers=auth_headers)
    
    # Ambil dengan limit=2
    response = client.get("/chat/sessions?skip=0&limit=2", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 2 # Pastikan hanya 2 item yang kembali

def test_get_chat_not_found(client, auth_headers):
    """Test (Data Not Found): Akses chat ID yang tidak ada -> 404."""
    response = client.get("/chat/sessions/999999", headers=auth_headers)
    assert response.status_code == 404
