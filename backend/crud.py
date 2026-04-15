from sqlalchemy.orm import Session
from sqlalchemy import or_
from models import User, ImageGeneration, TextSummarization, ImageCaption
from schemas import UserCreate, SummarizeRequest
from auth import hash_password, verify_password


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