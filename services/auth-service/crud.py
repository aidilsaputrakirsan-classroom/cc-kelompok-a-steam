"""Database CRUD operations for Auth Service."""
from sqlalchemy.orm import Session
from sqlalchemy import or_
from models import User
from schemas import UserCreate
from auth import hash_password, verify_password

def create_user(db: Session, user_data: UserCreate) -> User | None:
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email: return None
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username: return None

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
    user = db.query(User).filter(or_(User.email == email, User.username == email.lower())).first()
    if not user: return None
    if not verify_password(password, str(user.hashed_password)): return None
    return user

def increment_api_used(db: Session, user_id: int) -> bool:
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.api_used = (user.api_used or 0) + 1
        db.commit()
        return True
    return False
