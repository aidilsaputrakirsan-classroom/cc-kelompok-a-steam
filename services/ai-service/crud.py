from sqlalchemy.orm import Session
from sqlalchemy import func
from models import ChatSession, ChatMessage, ImageGeneration, TextSummarization, ImageCaption
from typing import Any
import json

def create_chat_session(db: Session, user_id: int, title: str, session_type: str) -> ChatSession:
    session = ChatSession(user_id=user_id, title=title, session_type=session_type)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session

def add_chat_message(db: Session, session_id: int, role: str, content: str, content_type: str = "text", metadata: dict | None = None) -> ChatMessage:
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

def get_chat_sessions(db: Session, user_id: int, session_type: str | None = None, skip: int = 0, limit: int = 20) -> list[dict]:
    query = db.query(ChatSession).filter(ChatSession.user_id == user_id)
    if session_type:
        query = query.filter(ChatSession.session_type == session_type)
        
    sessions = query.order_by(ChatSession.updated_at.desc()).offset(skip).limit(limit).all()
    result = []
    for s in sessions:
        msg_count = db.query(func.count(ChatMessage.id)).filter(ChatMessage.session_id == s.id).scalar() or 0
        last_msg = db.query(ChatMessage.created_at).filter(ChatMessage.session_id == s.id).order_by(ChatMessage.created_at.desc()).first()
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

def get_chat_session_by_id(db: Session, user_id: int, session_id: int) -> ChatSession | None:
    return db.query(ChatSession).filter(ChatSession.id == session_id, ChatSession.user_id == user_id).first()

def delete_chat_session(db: Session, user_id: int, session_id: int) -> bool:
    session = get_chat_session_by_id(db, user_id, session_id)
    if not session: return False
    db.delete(session)
    db.commit()
    return True

def update_chat_session_title(db: Session, user_id: int, session_id: int, title: str) -> ChatSession | None:
    session = get_chat_session_by_id(db, user_id, session_id)
    if not session: return None
    session.title = title
    db.commit()
    db.refresh(session)
    return session
