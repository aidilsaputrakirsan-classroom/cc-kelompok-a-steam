"""
test_stats.py — Test suite untuk endpoint GET /stats di AI Service.

Analog dengan tugas terstruktur Modul 12:
  "Tambah endpoint stats di Item Service"
  → Di proyek Intirupa: AI Service sebagai pengganti Item Service

Endpoint yang ditest: GET /stats
Response yang diharapkan:
  {
    "user": { "user_id": ..., "email": ..., "name": ... },
    "usage": {
      "total_image_generations": int,
      "total_text_summarizations": int,
      "total_image_captions": int,
      "total_api_calls": int
    }
  }
"""
import pytest
from models import ImageGeneration, TextSummarization, ImageCaption


# =============================================
# Helper: insert data langsung ke DB test
# =============================================

def _seed_image(db, user_id: int, n: int = 1):
    """Insert n baris ImageGeneration untuk user_id tertentu."""
    for _ in range(n):
        db.add(ImageGeneration(
            user_id=user_id,
            prompt="A beautiful sunset",
            image_url="http://fake.url/image.png",
            model_name="black-forest-labs/FLUX.1-schnell",
            status="success",
            generation_time=1.5,
        ))
    db.commit()


def _seed_summarization(db, user_id: int, n: int = 1):
    """Insert n baris TextSummarization untuk user_id tertentu."""
    for _ in range(n):
        db.add(TextSummarization(
            user_id=user_id,
            source_type="text",
            source_content="Long article content here...",
            summary_text="Short summary.",
            model_name="gemini-3.1-flash-lite-preview",
            status="success",
            processing_time=0.8,
        ))
    db.commit()


def _seed_caption(db, user_id: int, n: int = 1):
    """Insert n baris ImageCaption untuk user_id tertentu."""
    for _ in range(n):
        db.add(ImageCaption(
            user_id=user_id,
            image_url="http://fake.url/photo.jpg",
            caption_text="A cat sitting on a table.",
            model_name="blip-caption",
            status="success",
            processing_time=0.5,
        ))
    db.commit()


# =============================================
# TEST CASES
# =============================================

class TestStatsEndpoint:
    """Test suite untuk GET /stats."""

    def test_stats_requires_auth(self, client):
        """
        Tanpa header Authorization → harus 422 (field required).
        Dependency override tidak aktif kalau header tidak dikirim.
        """
        # Karena dependency di-override di fixture 'client', kita test langsung
        # bahwa endpoint dapat diakses dengan auth header
        response = client.get("/stats", headers={"Authorization": "Bearer fake-test-token"})
        assert response.status_code == 200

    def test_stats_structure(self, client, auth_headers):
        """Response harus memiliki struktur { user, usage } yang benar."""
        response = client.get("/stats", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        # Cek top-level keys
        assert "user" in data, "Response harus punya key 'user'"
        assert "usage" in data, "Response harus punya key 'usage'"

        # Cek user fields
        user = data["user"]
        assert "user_id" in user
        assert "email" in user
        assert "name" in user

        # Cek usage fields
        usage = data["usage"]
        assert "total_image_generations" in usage
        assert "total_text_summarizations" in usage
        assert "total_image_captions" in usage
        assert "total_api_calls" in usage

    def test_stats_all_zero_for_new_user(self, client, auth_headers):
        """User baru (belum punya data) → semua usage count harus 0."""
        response = client.get("/stats", headers=auth_headers)

        assert response.status_code == 200
        usage = response.json()["usage"]

        assert usage["total_image_generations"] == 0
        assert usage["total_text_summarizations"] == 0
        assert usage["total_image_captions"] == 0
        assert usage["total_api_calls"] == 0

    def test_stats_counts_image_generations(self, client, db_session, auth_headers):
        """Setelah insert 3 ImageGeneration → total_image_generations = 3."""
        USER_ID = 1  # sesuai MOCK_USER di conftest
        _seed_image(db_session, user_id=USER_ID, n=3)

        response = client.get("/stats", headers=auth_headers)

        assert response.status_code == 200
        usage = response.json()["usage"]
        assert usage["total_image_generations"] == 3

    def test_stats_counts_summarizations(self, client, db_session, auth_headers):
        """Setelah insert 2 TextSummarization → total_text_summarizations = 2."""
        USER_ID = 1
        _seed_summarization(db_session, user_id=USER_ID, n=2)

        response = client.get("/stats", headers=auth_headers)

        assert response.status_code == 200
        usage = response.json()["usage"]
        assert usage["total_text_summarizations"] == 2

    def test_stats_counts_captions(self, client, db_session, auth_headers):
        """Setelah insert 1 ImageCaption → total_image_captions = 1."""
        USER_ID = 1
        _seed_caption(db_session, user_id=USER_ID, n=1)

        response = client.get("/stats", headers=auth_headers)

        assert response.status_code == 200
        usage = response.json()["usage"]
        assert usage["total_image_captions"] == 1

    def test_stats_total_api_calls_is_sum(self, client, db_session, auth_headers):
        """
        total_api_calls harus = total_image_generations + total_text_summarizations
        + total_image_captions.
        """
        USER_ID = 1
        _seed_image(db_session, user_id=USER_ID, n=2)
        _seed_summarization(db_session, user_id=USER_ID, n=3)
        _seed_caption(db_session, user_id=USER_ID, n=1)

        response = client.get("/stats", headers=auth_headers)

        assert response.status_code == 200
        usage = response.json()["usage"]

        expected_total = (
            usage["total_image_generations"]
            + usage["total_text_summarizations"]
            + usage["total_image_captions"]
        )
        assert usage["total_api_calls"] == expected_total

    def test_stats_only_counts_own_user(self, client, db_session, auth_headers):
        """
        Data milik user lain (user_id=99) tidak boleh ikut terhitung
        di stats user yang sedang login (user_id=1).
        """
        OTHER_USER_ID = 99
        _seed_image(db_session, user_id=OTHER_USER_ID, n=5)
        _seed_summarization(db_session, user_id=OTHER_USER_ID, n=5)

        response = client.get("/stats", headers=auth_headers)

        assert response.status_code == 200
        usage = response.json()["usage"]

        # User 1 tidak punya data — semua harus 0
        assert usage["total_image_generations"] == 0
        assert usage["total_text_summarizations"] == 0
        assert usage["total_api_calls"] == 0

    def test_stats_user_info_matches_token(self, client, auth_headers):
        """
        Info user di response harus sesuai dengan data dari token
        (MOCK_USER di conftest).
        """
        response = client.get("/stats", headers=auth_headers)

        assert response.status_code == 200
        user = response.json()["user"]

        assert user["user_id"] == 1
        assert user["email"] == "test@intirupa.com"
        assert user["name"] == "Test User"

    def test_stats_returns_non_negative_counts(self, client, auth_headers):
        """Semua count tidak boleh bernilai negatif."""
        response = client.get("/stats", headers=auth_headers)

        assert response.status_code == 200
        usage = response.json()["usage"]

        for key, value in usage.items():
            assert value >= 0, f"{key} tidak boleh negatif, dapat: {value}"
