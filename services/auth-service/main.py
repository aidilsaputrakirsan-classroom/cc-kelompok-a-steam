import os
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager

from database import engine, get_db, Base
from models import User
from schemas import (
    UserCreate, UserResponse, LoginRequest, TokenResponse, TokenVerifyResponse
)
from auth import create_access_token, get_current_user, decode_access_token
import crud

@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.getenv("TESTING") != "true":
        Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Auth Service",
    description="Authentication microservice untuk Inti Rupa",
    version="2.0.0",
    lifespan=lifespan,
)

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "auth-service", "version": "2.0.0"}

@app.post("/auth/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    user = crud.create_user(db=db, user_data=user_data)
    if not user:
        raise HTTPException(status_code=400, detail="Email atau username sudah terdaftar.")
    return user

@app.post("/auth/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = crud.authenticate_user(db=db, email=login_data.email, password=login_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Email atau password tidak cocok.")
    token = create_access_token(data={"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer", "user": user}

@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.get("/verify", response_model=TokenVerifyResponse)
def verify_token(authorization: str = Header(...), db: Session = Depends(get_db)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.split("Bearer ")[1]
    payload = decode_access_token(token)
    user_id = int(payload["sub"])
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User tidak valid.")
        
    return {
        "user_id": user.id,
        "username": user.username,
        "email": user.email,
        "api_quota": user.api_quota,
        "api_used": user.api_used
    }

@app.post("/users/{user_id}/increment-usage")
def increment_usage(user_id: int, db: Session = Depends(get_db)):
    """Internal API dipanggil oleh AI service untuk increment usage"""
    success = crud.increment_api_used(db=db, user_id=user_id)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success"}
