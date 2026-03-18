import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, get_db
from models import Base, User
from schemas import (
    ItemCreate, ItemUpdate, ItemResponse, ItemListResponse,
    UserCreate, UserResponse, LoginRequest, TokenResponse,
)
from sqlalchemy import func
from auth import create_access_token, get_current_user
import crud

load_dotenv()

# Buat semua tabel
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cloud App API",
    description="REST API untuk mata kuliah Komputasi Awan — SI ITK",
    version="0.4.0",
)

# ==================== CORS (FIXED) ====================
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173")
origins_list = [origin.strip() for origin in allowed_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== HEALTH CHECK ====================

@app.get("/health")
def health_check():
    return {"status": "healthy", "version": "0.4.0"}


# ==================== AUTH ENDPOINTS (PUBLIC) ====================

@app.post("/auth/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Registrasi user baru.

    - **email**: Harus format email yang valid (contoh: nama@domain.com)
    - **name**: Nama lengkap (2-100 karakter)
    - **password**: Minimal 8 karakter, wajib ada huruf besar, huruf kecil, dan angka
    """
    user = crud.create_user(db=db, user_data=user_data)
    if not user:
        raise HTTPException(
            status_code=400,
            detail=f"Email '{user_data.email}' sudah terdaftar. Gunakan email lain atau langsung login."
        )
    return user


@app.post("/auth/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Login dan dapatkan JWT token.
    
    Token berlaku selama 60 menit (default).
    Gunakan token di header: `Authorization: Bearer <token>`
    """
    user = crud.authenticate_user(db=db, email=login_data.email, password=login_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Email atau password tidak cocok. Pastikan email dan password yang Anda masukkan benar."
        )

    token = create_access_token(data={"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user,
    }


@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """Ambil profil user yang sedang login."""
    return current_user


# ==================== ITEM ENDPOINTS (PROTECTED) ====================

@app.post("/items", response_model=ItemResponse, status_code=201)
def create_item(
    item: ItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Buat item baru. **Membutuhkan autentikasi.**"""
    return crud.create_item(db=db, item_data=item)


@app.get("/items", response_model=ItemListResponse)
def list_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ambil daftar items. **Membutuhkan autentikasi.**"""
    return crud.get_items(db=db, skip=skip, limit=limit, search=search)


@app.get("/items/stats")
def get_items_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Statistik ringkasan semua items. **Membutuhkan autentikasi.**

    - **total_items**: Jumlah item unik di database
    - **total_value**: Total nilai aset (sum of price × quantity)
    - **avg_price**: Rata-rata harga semua item
    - **most_expensive**: Item dengan harga tertinggi
    - **cheapest**: Item dengan harga terendah
    """
    from models import Item

    total_items = db.query(func.count(Item.id)).scalar() or 0
    total_value = db.query(func.sum(Item.price * Item.quantity)).scalar() or 0
    avg_price = db.query(func.avg(Item.price)).scalar() or 0
    most_expensive = db.query(Item).order_by(Item.price.desc()).first()
    cheapest = db.query(Item).order_by(Item.price.asc()).first()

    return {
        "total_items": total_items,
        "total_value": round(float(total_value), 2),
        "avg_price": round(float(avg_price), 2),
        "most_expensive": {
            "id": most_expensive.id,
            "name": most_expensive.name,
            "price": most_expensive.price,
        } if most_expensive else None,
        "cheapest": {
            "id": cheapest.id,
            "name": cheapest.name,
            "price": cheapest.price,
        } if cheapest else None,
    }


@app.get("/items/{item_id}", response_model=ItemResponse)
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ambil satu item berdasarkan ID. **Membutuhkan autentikasi.**"""
    item = crud.get_item(db=db, item_id=item_id)
    if not item:
        raise HTTPException(
            status_code=404,
            detail=f"Item dengan ID {item_id} tidak ditemukan. Pastikan ID yang Anda masukkan benar."
        )
    return item


@app.put("/items/{item_id}", response_model=ItemResponse)
def update_item(
    item_id: int,
    item: ItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update item berdasarkan ID. **Membutuhkan autentikasi.**"""
    updated = crud.update_item(db=db, item_id=item_id, item_data=item)
    if not updated:
        raise HTTPException(
            status_code=404,
            detail=f"Item dengan ID {item_id} tidak ditemukan. Tidak ada data yang diubah."
        )
    return updated


@app.delete("/items/{item_id}", status_code=204)
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Hapus item berdasarkan ID. **Membutuhkan autentikasi.**"""
    success = crud.delete_item(db=db, item_id=item_id)
    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"Item dengan ID {item_id} tidak ditemukan. Tidak ada data yang dihapus."
        )
    return None


# ==================== TEAM INFO ====================

@app.get("/team")
def team_info():
    return {
        "team": "Steam",
        "members": [
            # TODO: Isi dengan data tim Anda
            {"name": "Irfan Zaki Riyanto", "nim": "10231045", "role": "Lead Backend"},
            {"name": "Incha Raghil", "nim": "10231043", "role": "Lead Frontend"},
            {"name": "Jonathan Cristopher Jetro", "nim": "10231047", "role": "Lead DevOps"},
            {"name": "Jonathan Joseph Yudita Tampubolon", "nim": "10231048", "role": "Lead QA & Docs"},
        ]
    }