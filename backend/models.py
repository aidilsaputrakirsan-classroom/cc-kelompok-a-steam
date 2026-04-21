from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    """
    Model untuk tabel 'users'.
    Menyimpan data akun user beserta kuota penggunaan API-nya.
    """
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    api_quota = Column(Integer, default=100)
    api_used = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships ke tabel history
    image_generations = relationship("ImageGeneration", back_populates="user", cascade="all, delete-orphan")
    summarizations = relationship("TextSummarization", back_populates="user", cascade="all, delete-orphan")
    captions = relationship("ImageCaption", back_populates="user", cascade="all, delete-orphan")
    chat_sessions = relationship("ChatSession", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(id={self.id}, username='{self.username}', email='{self.email}')>"


class ImageGeneration(Base):
    """
    Model untuk tabel 'image_generations'.
    Menyimpan riwayat hasil generate gambar dari teks prompt (AI Image Generator).
    """
    __tablename__ = "image_generations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    prompt = Column(Text, nullable=False)
    negative_prompt = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=False)
    model_name = Column(String(100), default="stable-diffusion")
    status = Column(String(20), default="pending")   # pending | completed | failed
    error_message = Column(Text, nullable=True)
    generation_time = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationship balik ke User
    user = relationship("User", back_populates="image_generations")

    def __repr__(self):
        return f"<ImageGeneration(id={self.id}, user_id={self.user_id}, status='{self.status}')>"


class TextSummarization(Base):
    """
    Model untuk tabel 'text_summarizations'.
    Menyimpan riwayat hasil summarisasi teks (Text Summarizer).
    """
    __tablename__ = "text_summarizations"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    source_type = Column(String(20), nullable=False)       # 'url' | 'text' | 'file'
    source_content = Column(Text, nullable=False)
    summary_text = Column(Text, nullable=False)
    model_name = Column(String(100), default="bart-summarizer")
    original_length = Column(Integer, nullable=True)
    summary_length = Column(Integer, nullable=True)
    compression_ratio = Column(Float, nullable=True)
    status = Column(String(20), default="pending")   # pending | completed | failed
    error_message = Column(Text, nullable=True)
    processing_time = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationship balik ke User
    user = relationship("User", back_populates="summarizations")

    def __repr__(self):
        return f"<TextSummarization(id={self.id}, user_id={self.user_id}, source_type='{self.source_type}')>"


class ImageCaption(Base):
    """
    Model untuk tabel 'image_captions'.
    Menyimpan riwayat hasil generate caption dari gambar (Image-to-Text).
    """
    __tablename__ = "image_captions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(String(500), nullable=False)
    caption_text = Column(Text, nullable=False)
    model_name = Column(String(100), default="blip-caption")
    confidence_score = Column(Float, nullable=True)
    status = Column(String(20), default="pending")   # pending | completed | failed
    error_message = Column(Text, nullable=True)
    processing_time = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Relationship balik ke User
    user = relationship("User", back_populates="captions")

    def __repr__(self):
        return f"<ImageCaption(id={self.id}, user_id={self.user_id}, status='{self.status}')>"


class ChatSession(Base):
    """
    Model untuk tabel 'chat_sessions'.
    Menyimpan sesi percakapan user — setiap sesi berisi kumpulan aktivitas
    (generate gambar atau rangkum teks) yang dikelompokkan bersama.
    Session type: 'image' | 'summarize'
    """
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False, default="New Chat")
    session_type = Column(String(20), nullable=False)   # 'image' | 'summarize'
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="chat_sessions")
    messages = relationship(
        "ChatMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="ChatMessage.created_at",
    )

    def __repr__(self):
        return f"<ChatSession(id={self.id}, user_id={self.user_id}, type='{self.session_type}', title='{self.title}')>"


class ChatMessage(Base):
    """
    Model untuk tabel 'chat_messages'.
    Menyimpan setiap pesan dalam sebuah sesi — baik dari user maupun dari AI.
    role: 'user' | 'assistant'
    content_type: 'text' | 'image_base64'
    metadata_json: string JSON untuk info tambahan (model_name, prompt asli, dll)
    """
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(10), nullable=False)            # 'user' | 'assistant'
    content_type = Column(String(20), default="text")   # 'text' | 'image_base64'
    content = Column(Text, nullable=False)
    metadata_json = Column(Text, nullable=True)          # JSON: {"model": ..., "generation_time": ...}
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship balik ke ChatSession
    session = relationship("ChatSession", back_populates="messages")

    def __repr__(self):
        return f"<ChatMessage(id={self.id}, session_id={self.session_id}, role='{self.role}')>"