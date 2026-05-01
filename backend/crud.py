from sqlalchemy.orm import Session
from sqlalchemy import or_
from models import User, ImageGeneration, TextSummarization, ImageCaption, ChatSession, ChatMessage
from schemas import UserCreate, SummarizeRequest
from auth import hash_password, verify_password
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
    """Autentikasi user: cek email & password."""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


def increment_api_used(db: Session, user_id: int) -> None:
    """Tambah counter api_used milik user sebesar 1."""
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.api_used += 1
        db.commit()


# ==================== IMAGE GENERATION CRUD ====================

def create_image_generation(
    db: Session,
    user_id: int,
    prompt: str,
    image_url: str,
    model_name: str,
    generation_time: float,
    negative_prompt: str = None,
    status: str = "completed",
) -> ImageGeneration:
    """Simpan riwayat generate gambar ke database."""
    record = ImageGeneration(
        user_id=user_id,
        prompt=prompt,
        negative_prompt=negative_prompt,
        image_url=image_url,
        model_name=model_name,
        status=status,
        generation_time=generation_time,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_image_generations(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 20,
) -> list[ImageGeneration]:
    """Ambil riwayat generate gambar milik user (terbaru duluan)."""
    return (
        db.query(ImageGeneration)
        .filter(ImageGeneration.user_id == user_id)
        .order_by(ImageGeneration.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_image_generation_by_id(
    db: Session, user_id: int, generation_id: int
) -> ImageGeneration | None:
    """Ambil satu riwayat generate gambar berdasarkan ID (harus milik user)."""
    return (
        db.query(ImageGeneration)
        .filter(
            ImageGeneration.id == generation_id,
            ImageGeneration.user_id == user_id,
        )
        .first()
    )


def delete_image_generation(
    db: Session, user_id: int, generation_id: int
) -> bool:
    """Hapus satu riwayat generate gambar. Return True jika berhasil."""
    record = get_image_generation_by_id(db, user_id, generation_id)
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True


# ==================== TEXT SUMMARIZATION CRUD ====================

def create_summarization(
    db: Session,
    user_id: int,
    source_type: str,
    source_content: str,
    summary_text: str,
    model_name: str,
    processing_time: float,
    original_length: int = None,
    summary_length: int = None,
    compression_ratio: float = None,
    status: str = "completed",
    error_message: str = None,
) -> TextSummarization:
    """Simpan riwayat summarisasi ke database."""
    record = TextSummarization(
        user_id=user_id,
        source_type=source_type,
        source_content=source_content,
        summary_text=summary_text,
        model_name=model_name,
        original_length=original_length,
        summary_length=summary_length,
        compression_ratio=compression_ratio,
        status=status,
        error_message=error_message,
        processing_time=processing_time,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_summarizations(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 20,
) -> list[TextSummarization]:
    """Ambil riwayat summarisasi milik user (terbaru duluan)."""
    return (
        db.query(TextSummarization)
        .filter(TextSummarization.user_id == user_id)
        .order_by(TextSummarization.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


# ==================== IMAGE CAPTION CRUD ====================

def create_image_caption(
    db: Session,
    user_id: int,
    image_url: str,
    caption_text: str,
    model_name: str,
    processing_time: float,
    confidence_score: float = None,
    status: str = "completed",
    error_message: str = None,
) -> ImageCaption:
    """Simpan riwayat caption gambar ke database."""
    record = ImageCaption(
        user_id=user_id,
        image_url=image_url,
        caption_text=caption_text,
        model_name=model_name,
        confidence_score=confidence_score,
        status=status,
        error_message=error_message,
        processing_time=processing_time,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_image_captions(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 20,
) -> list[ImageCaption]:
    """Ambil riwayat caption gambar milik user (terbaru duluan)."""
    return (
        db.query(ImageCaption)
        .filter(ImageCaption.user_id == user_id)
        .order_by(ImageCaption.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_image_caption_by_id(
    db: Session, user_id: int, caption_id: int
) -> ImageCaption | None:
    """Ambil satu riwayat caption gambar berdasarkan ID (harus milik user)."""
    return (
        db.query(ImageCaption)
        .filter(
            ImageCaption.id == caption_id,
            ImageCaption.user_id == user_id,
        )
        .first()
    )


def delete_image_caption(
    db: Session, user_id: int, caption_id: int
) -> bool:
    """Hapus satu riwayat caption gambar. Return True jika berhasil."""
    record = get_image_caption_by_id(db, user_id, caption_id)
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True


# ==================== TEXT SUMMARIZATION DETAIL & DELETE ====================

def get_summarization_by_id(
    db: Session, user_id: int, summarization_id: int
) -> TextSummarization | None:
    """Ambil satu riwayat summarisasi berdasarkan ID (harus milik user)."""
    return (
        db.query(TextSummarization)
        .filter(
            TextSummarization.id == summarization_id,
            TextSummarization.user_id == user_id,
        )
        .first()
    )


def delete_summarization(
    db: Session, user_id: int, summarization_id: int
) -> bool:
    """Hapus satu riwayat summarisasi. Return True jika berhasil."""
    record = get_summarization_by_id(db, user_id, summarization_id)
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True


# ==================== CHAT SESSION CRUD ====================

def create_chat_session(
    db: Session,
    user_id: int,
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
    session_id: int,
    role: str,
    content: str,
    content_type: str = "text",
    metadata: dict = None,
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
    user_id: int,
    session_type: str = None,
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
    db: Session, user_id: int, session_id: int
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
    db: Session, user_id: int, session_id: int
) -> bool:
    """Hapus sesi percakapan beserta semua pesannya. Return True jika berhasil."""
    session = get_chat_session_by_id(db, user_id, session_id)
    if not session:
        return False
    db.delete(session)
    db.commit()
    return True


def update_chat_session_title(
    db: Session, user_id: int, session_id: int, title: str
) -> ChatSession | None:
    """Update judul sesi percakapan. Return sesi yang diupdate atau None jika tidak ditemukan."""
    session = get_chat_session_by_id(db, user_id, session_id)
    if not session:
        return None
    session.title = title
    db.commit()
    db.refresh(session)
    return session


# ==================== UNIFIED HISTORY ====================

def get_unified_history(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 50,
) -> list[dict]:
    """
    Ambil riwayat gabungan dari semua jenis aktivitas user,
    diurutkan dari yang terbaru. Mengembalikan list dict seragam.
    """
    items = []

    # Image generations
    image_gens = (
        db.query(ImageGeneration)
        .filter(ImageGeneration.user_id == user_id)
        .all()
    )
    for r in image_gens:
        items.append({
            "id": r.id,
            "type": "image_generation",
            "title": r.prompt[:80] + ("..." if len(r.prompt) > 80 else ""),
            "status": r.status,
            "session_type": None,
            "created_at": r.created_at,
        })

    # Text summarizations
    summaries = (
        db.query(TextSummarization)
        .filter(TextSummarization.user_id == user_id)
        .all()
    )
    for r in summaries:
        items.append({
            "id": r.id,
            "type": "text_summarization",
            "title": r.source_content[:80] + ("..." if len(r.source_content) > 80 else ""),
            "status": r.status,
            "session_type": None,
            "created_at": r.created_at,
        })

    # Image captions
    captions = (
        db.query(ImageCaption)
        .filter(ImageCaption.user_id == user_id)
        .all()
    )
    for r in captions:
        items.append({
            "id": r.id,
            "type": "image_caption",
            "title": r.image_url[:80] + ("..." if len(r.image_url) > 80 else ""),
            "status": r.status,
            "session_type": None,
            "created_at": r.created_at,
        })

    # Chat sessions
    chat_sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == user_id)
        .all()
    )
    for s in chat_sessions:
        items.append({
            "id": s.id,
            "type": "chat_session",
            "title": s.title,
            "status": None,
            "session_type": s.session_type,
            "created_at": s.created_at,
        })

    # Urutkan semua berdasarkan created_at descending lalu paginate
    items.sort(key=lambda x: x["created_at"], reverse=True)
    return items[skip: skip + limit]