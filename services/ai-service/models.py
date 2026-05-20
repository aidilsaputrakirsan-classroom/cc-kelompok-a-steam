from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class ImageGeneration(Base):
    __tablename__ = "image_generations"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)
    prompt = Column(Text, nullable=False)
    negative_prompt = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=False)
    model_name = Column(String(100), default="stable-diffusion")
    status = Column(String(20), default="pending")
    error_message = Column(Text, nullable=True)
    generation_time = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class TextSummarization(Base):
    __tablename__ = "text_summarizations"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)
    source_type = Column(String(20), nullable=False)
    source_content = Column(Text, nullable=False)
    summary_text = Column(Text, nullable=False)
    model_name = Column(String(100), default="bart-summarizer")
    original_length = Column(Integer, nullable=True)
    summary_length = Column(Integer, nullable=True)
    compression_ratio = Column(Float, nullable=True)
    status = Column(String(20), default="pending")
    error_message = Column(Text, nullable=True)
    processing_time = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class ImageCaption(Base):
    __tablename__ = "image_captions"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)
    image_url = Column(String(500), nullable=False)
    caption_text = Column(Text, nullable=False)
    model_name = Column(String(100), default="blip-caption")
    confidence_score = Column(Float, nullable=True)
    status = Column(String(20), default="pending")
    error_message = Column(Text, nullable=True)
    processing_time = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)
    title = Column(String(255), nullable=False, default="New Chat")
    session_type = Column(String(20), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    messages = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan", order_by="ChatMessage.created_at")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(10), nullable=False)
    content_type = Column(String(20), default="text")
    content = Column(Text, nullable=False)
    metadata_json = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    session = relationship("ChatSession", back_populates="messages")
