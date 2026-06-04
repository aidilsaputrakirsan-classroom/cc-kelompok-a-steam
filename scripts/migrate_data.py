"""
Data Migration Script — Intirupa
Migrasi data dari database monolith ke 2 database microservices terpisah.

Arsitektur lama (Monolith):
    1 DB: cloudapp (semua tabel dalam satu database)
    └─ users
    └─ image_generations
    └─ text_summarizations
    └─ image_captions
    └─ chat_sessions
    └─ chat_messages

Arsitektur baru (Microservices):
    auth_db (port 5433):  → users
    ai_db   (port 5435):  → image_generations, text_summarizations,
                             image_captions, chat_sessions, chat_messages

Usage:
    # Jalankan saat SEMUA container sedang running (docker compose up -d)
    python scripts/migrate_data.py

Environment Variables (opsional, sudah ada default-nya):
    MONOLITH_DB_URL  → URL database monolith lama
    AUTH_DB_URL      → URL database auth-service baru
    AI_DB_URL        → URL database ai-service baru
"""
import os
import sys
from sqlalchemy import create_engine, text

# =====================
# DATABASE URLs
# =====================
# Monolith: port default 5432, db 'cloudapp'
MONOLITH_DB_URL = os.getenv(
    "MONOLITH_DB_URL",
    "postgresql://postgres:postgres@localhost:5432/cloudapp"
)
# Auth Service DB: port 5433 (sesuai docker-compose.yml Intirupa)
AUTH_DB_URL = os.getenv(
    "AUTH_DB_URL",
    "postgresql://postgres:postgres@localhost:5433/auth_db"
)
# AI Service DB: port 5435 (sesuai docker-compose.yml Intirupa)
AI_DB_URL = os.getenv(
    "AI_DB_URL",
    "postgresql://postgres:postgres@localhost:5435/ai_db"
)


def check_connection(engine, name: str) -> bool:
    """Cek apakah database dapat diakses sebelum migrasi dimulai."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print(f"  ✅ Koneksi ke {name} berhasil.")
        return True
    except Exception as e:
        print(f"  ❌ Gagal terhubung ke {name}: {e}")
        return False


def migrate_users(monolith_engine, auth_engine) -> int:
    """
    [Step 1] Migrasikan data tabel 'users' dari monolith → auth_db.
    Kolom yang dimigrasikan:
      id, username, email, hashed_password, full_name,
      api_quota, api_used, is_active, created_at, updated_at
    """
    print("\n[1/3] Migrasikan tabel 'users' → auth_db...")

    with monolith_engine.connect() as src:
        try:
            users = src.execute(text("SELECT * FROM users")).mappings().fetchall()
        except Exception as e:
            print(f"  ⚠️  Tabel 'users' tidak ditemukan di monolith: {e}")
            return 0

    if not users:
        print("  ⚠️  Tidak ada data users di monolith. Melewati step ini.")
        return 0

    print(f"  Ditemukan {len(users)} user di monolith.")

    migrated = 0
    with auth_engine.connect() as dst:
        for user in users:
            try:
                dst.execute(
                    text("""
                        INSERT INTO users (
                            id, username, email, hashed_password, full_name,
                            api_quota, api_used, is_active, created_at, updated_at
                        )
                        VALUES (
                            :id, :username, :email, :hashed_password, :full_name,
                            :api_quota, :api_used, :is_active, :created_at, :updated_at
                        )
                        ON CONFLICT (id) DO NOTHING
                    """),
                    {
                        "id": user["id"],
                        "username": user["username"],
                        "email": user["email"],
                        "hashed_password": user["hashed_password"],
                        "full_name": user["full_name"],
                        "api_quota": user.get("api_quota", 100),
                        "api_used": user.get("api_used", 0),
                        "is_active": user.get("is_active", True),
                        "created_at": user.get("created_at"),
                        "updated_at": user.get("updated_at"),
                    }
                )
                migrated += 1
            except Exception as e:
                print(f"  ⚠️  Gagal migrasikan user id={user['id']}: {e}")

        dst.commit()

    print(f"  ✅ Berhasil migrasikan {migrated}/{len(users)} users.")
    return migrated


def migrate_ai_history(monolith_engine, ai_engine) -> dict:
    """
    [Step 2] Migrasikan tabel riwayat AI dari monolith → ai_db.
    Tabel yang dimigrasikan:
      - image_generations
      - text_summarizations
      - image_captions
      - chat_sessions + chat_messages (dengan urutan yang benar agar FK tidak error)
    """
    results = {}

    tables_simple = [
        {
            "name": "image_generations",
            "columns": [
                "id", "user_id", "prompt", "negative_prompt", "image_url",
                "model_name", "status", "error_message", "generation_time", "created_at"
            ]
        },
        {
            "name": "text_summarizations",
            "columns": [
                "id", "user_id", "source_type", "source_content", "summary_text",
                "model_name", "original_length", "summary_length", "compression_ratio",
                "status", "error_message", "processing_time", "created_at"
            ]
        },
        {
            "name": "image_captions",
            "columns": [
                "id", "user_id", "image_url", "caption_text", "model_name",
                "confidence_score", "status", "error_message", "processing_time", "created_at"
            ]
        },
    ]

    print("\n[2/3] Migrasikan tabel riwayat AI → ai_db...")
    with monolith_engine.connect() as src, ai_engine.connect() as dst:
        for table_info in tables_simple:
            table = table_info["name"]
            cols = table_info["columns"]
            try:
                rows = src.execute(text(f"SELECT * FROM {table}")).mappings().fetchall()
            except Exception as e:
                print(f"  ⚠️  Tabel '{table}' tidak ditemukan di monolith: {e}")
                results[table] = 0
                continue

            if not rows:
                print(f"  ⚠️  Tidak ada data di tabel '{table}'. Melewati.")
                results[table] = 0
                continue

            migrated = 0
            col_str = ", ".join(cols)
            val_str = ", ".join(f":{c}" for c in cols)

            for row in rows:
                try:
                    dst.execute(
                        text(f"""
                            INSERT INTO {table} ({col_str})
                            VALUES ({val_str})
                            ON CONFLICT (id) DO NOTHING
                        """),
                        {c: row.get(c) for c in cols}
                    )
                    migrated += 1
                except Exception as e:
                    print(f"  ⚠️  Gagal migrasikan baris id={row.get('id')} di '{table}': {e}")

            dst.commit()
            print(f"  ✅ '{table}': {migrated}/{len(rows)} baris berhasil dimigrasikan.")
            results[table] = migrated

    # Migrasikan chat_sessions dulu, baru chat_messages (karena ada FK)
    print("\n[3/3] Migrasikan chat_sessions dan chat_messages → ai_db...")
    with monolith_engine.connect() as src, ai_engine.connect() as dst:
        for table in ["chat_sessions", "chat_messages"]:
            try:
                rows = src.execute(text(f"SELECT * FROM {table}")).mappings().fetchall()
            except Exception as e:
                print(f"  ⚠️  Tabel '{table}' tidak ditemukan: {e}")
                results[table] = 0
                continue

            if not rows:
                print(f"  ⚠️  Tidak ada data di '{table}'. Melewati.")
                results[table] = 0
                continue

            migrated = 0
            # Ambil kolom dinamis dari baris pertama
            cols = list(rows[0].keys())
            col_str = ", ".join(cols)
            val_str = ", ".join(f":{c}" for c in cols)

            for row in rows:
                try:
                    dst.execute(
                        text(f"""
                            INSERT INTO {table} ({col_str})
                            VALUES ({val_str})
                            ON CONFLICT (id) DO NOTHING
                        """),
                        dict(row)
                    )
                    migrated += 1
                except Exception as e:
                    print(f"  ⚠️  Gagal migrasikan baris id={row.get('id')} di '{table}': {e}")

            dst.commit()
            print(f"  ✅ '{table}': {migrated}/{len(rows)} baris berhasil dimigrasikan.")
            results[table] = migrated

    return results


def main():
    print("=" * 60)
    print("  DATA MIGRATION: Monolith → Microservices (Intirupa)")
    print("=" * 60)
    print(f"\n  Monolith DB : {MONOLITH_DB_URL.split('@')[-1]}")
    print(f"  Auth DB     : {AUTH_DB_URL.split('@')[-1]}")
    print(f"  AI DB       : {AI_DB_URL.split('@')[-1]}")

    # Buat koneksi engine
    monolith_engine = create_engine(MONOLITH_DB_URL)
    auth_engine = create_engine(AUTH_DB_URL)
    ai_engine = create_engine(AI_DB_URL)

    # Verifikasi koneksi sebelum mulai
    print("\n[Pre-check] Memeriksa koneksi ke semua database...")
    ok_monolith = check_connection(monolith_engine, "Monolith DB")
    ok_auth = check_connection(auth_engine, "Auth DB")
    ok_ai = check_connection(ai_engine, "AI DB")

    if not (ok_monolith and ok_auth and ok_ai):
        print("\n❌ MIGRASI DIBATALKAN. Pastikan semua container running:")
        print("   docker compose up -d")
        sys.exit(1)

    # Mulai migrasi
    user_count = migrate_users(monolith_engine, auth_engine)
    ai_results = migrate_ai_history(monolith_engine, ai_engine)

    # Ringkasan akhir
    print("\n" + "=" * 60)
    print("  RINGKASAN MIGRASI")
    print("=" * 60)
    print(f"  users (→ auth_db)              : {user_count} baris")
    for table, count in ai_results.items():
        print(f"  {table:<30} : {count} baris")
    print("\n  ✅ MIGRASI SELESAI!")
    print("=" * 60)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Migrasi dibatalkan oleh pengguna.")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Migrasi gagal dengan error tidak terduga: {e}")
        print("   Pastikan semua database accessible dan tabel sudah dibuat.")
        sys.exit(1)
