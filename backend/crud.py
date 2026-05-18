from sqlalchemy.orm import Session
from sqlalchemy import or_
from models import User, ImageGeneration, TextSummarization, ImageCaption, ChatSession, ChatMessage
from schemas import UserCreate
from auth import hash_password, verify_password
from typing import Any
import json


# ==================== USER CRUD ====================

def create_user(db: Session, user_data: UserCreate) -> User | None:
    """Buat user baru dengan password yang di-hash."""
    # Cek apakah email sudah terdaftar
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        return None  # Email sudah dipakai

    # Cek apakah username sudah dipakai
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        return None  # Username sudah dipakai

    db_user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hash_password(user_data.password),
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """Autentikasi user: cek email/username & password."""
    user = db.query(User).filter(or_(User.email == email, User.username == email.lower())).first()
    if not user:
        return None
    if not verify_password(password, str(user.hashed_password)):
        return None
    return user


def increment_api_used(db: Session, user_id: int | Any) -> None:
    """Tambah counter api_used milik user sebesar 1."""
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.api_used = (user.api_used or 0) + 1  # type: ignore[assignment]
        db.commit()





# ==================== CHAT SESSION CRUD ====================

def create_chat_session(
    db: Session,
    user_id: int | Any,
    title: str,
    session_type: str,
) -> ChatSession:
    """Buat sesi percakapan baru."""
    session = ChatSession(
        user_id=user_id,
        title=title,
        session_type=session_type,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def add_chat_message(
    db: Session,
    session_id: int | Any,
    role: str,
    content: str,
    content_type: str = "text",
    metadata: dict | None = None,
) -> ChatMessage:
    """Tambah pesan baru ke dalam sesi percakapan."""
    message = ChatMessage(
        session_id=session_id,
        role=role,
        content_type=content_type,
        content=content,
        metadata_json=json.dumps(metadata) if metadata else None,
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def get_chat_sessions(
    db: Session,
    user_id: int | Any,
    session_type: str | None = None,
    skip: int = 0,
    limit: int = 20,
) -> list[dict]:
    """
    Ambil daftar sesi percakapan milik user (terbaru duluan).
    Bisa di-filter berdasarkan session_type.
    Mengembalikan list dict karena perlu menghitung message_count dan last_message_at.
    """
    from sqlalchemy import func
    
    query = db.query(ChatSession).filter(ChatSession.user_id == user_id)
    
    if session_type:
        query = query.filter(ChatSession.session_type == session_type)
        
    sessions = (
        query.order_by(ChatSession.updated_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    result = []
    for s in sessions:
        msg_count = db.query(func.count(ChatMessage.id)).filter(ChatMessage.session_id == s.id).scalar() or 0
        last_msg = (
            db.query(ChatMessage.created_at)
            .filter(ChatMessage.session_id == s.id)
            .order_by(ChatMessage.created_at.desc())
            .first()
        )
        result.append({
            "id": s.id,
            "title": s.title,
            "session_type": s.session_type,
            "message_count": msg_count,
            "last_message_at": last_msg[0] if last_msg else None,
            "created_at": s.created_at,
            "updated_at": s.updated_at,
        })
    return result


def get_chat_session_by_id(
    db: Session, user_id: int | Any, session_id: int | Any
) -> ChatSession | None:
    """Ambil satu sesi percakapan beserta semua pesannya (harus milik user)."""
    return (
        db.query(ChatSession)
        .filter(
            ChatSession.id == session_id,
            ChatSession.user_id == user_id,
        )
        .first()
    )


def delete_chat_session(
    db: Session, user_id: int | Any, session_id: int | Any
) -> bool:
    """Hapus sesi percakapan beserta semua pesannya. Return True jika berhasil."""
    session = get_chat_session_by_id(db, user_id, session_id)
    if not session:
        return False
    db.delete(session)
    db.commit()
    return True


def update_chat_session_title(
    db: Session, user_id: int | Any, session_id: int | Any, title: str
) -> ChatSession | None:
    """Update judul sesi percakapan. Return sesi yang diupdate atau None jika tidak ditemukan."""
    session = get_chat_session_by_id(db, user_id, session_id)
    if not session:
        return None
    session.title = title  # type: ignore[assignment]
    db.commit()
    db.refresh(session)
    return session


