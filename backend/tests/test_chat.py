"""Test CRUD Chat Session endpoints (Real API Integration)."""

def test_chat_crud_flow(client, auth_headers):
    """
    Satu alur pengujian lengkap (Create, Read, Update, Delete).
    Menggunakan API asli namun digabungkan menjadi 1 alur (End-to-End) 
    agar hanya memanggil AI 1x saja, menghemat kuota, dan mencegah error Rate Limit.
    """
    # ---------------------------------------------------------
    # 1. CREATE (POST) - Memanggil AI asli (Gemini)
    # ---------------------------------------------------------
    response = client.post("/chat/sessions", json={
        "title": "Test CRUD AI",
        "session_type": "summarize", # Menggunakan Gemini karena responnya lebih cepat dari HuggingFace
        "first_message": "Ini adalah teks percobaan untuk memastikan AI merespons dengan benar."
    }, headers=auth_headers)
    
    assert response.status_code == 201, f"Gagal membuat sesi: {response.json()}"
    data = response.json()
    assert data["title"] == "Test CRUD AI"
    assert data["session_type"] == "summarize"
    assert "id" in data
    
    session_id = data["id"]
    
    # ---------------------------------------------------------
    # 2. VERIFIKASI BALASAN AI ASLI
    # ---------------------------------------------------------
    # Jika koneksi API gagal, proses tidak akan sampai ke sini (akan error 502/503 di atas)
    # Mari kita pastikan pesan AI benar-benar ada di database
    messages = data["messages"]
    assert len(messages) == 2  # 1 Pesan user, 1 Pesan balasan AI
    assert messages[0]["role"] == "user"
    assert messages[1]["role"] == "assistant"  # Ini adalah bukti nyata AI berhasil merespons!
    
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
    # 4.5. CONTINUE CHAT (POST) - Membalas pesan di sesi yang sama
    # ---------------------------------------------------------
    continue_resp = client.post(f"/chat/sessions/{session_id}/continue", json={
        "message": "Tolong berikan kesimpulannya dalam 1 kalimat pendek saja."
    }, headers=auth_headers)
    assert continue_resp.status_code == 200
    
    # Verifikasi jumlah pesan bertambah jadi 4 (Pesan user awal, balasan awal, pesan baru, balasan baru)
    assert len(continue_resp.json()["messages"]) == 4
    assert continue_resp.json()["messages"][2]["role"] == "user"
    assert continue_resp.json()["messages"][3]["role"] == "assistant"

    
    # ---------------------------------------------------------
    # 5. UPDATE (PATCH) - Ubah judul
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
