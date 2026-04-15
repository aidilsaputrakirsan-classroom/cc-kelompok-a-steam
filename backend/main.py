import os
import io
import base64
import time
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import engine, get_db
from models import Base, User
from schemas import (
    UserCreate, UserResponse, LoginRequest, TokenResponse,
    ImageGenerateRequest, ImageGenerateResponse, AVAILABLE_MODELS,
    ImageGenerationHistoryResponse,
    SummarizeRequest, SummarizationHistoryResponse,
    ImageCaptionHistoryResponse,
)
from auth import create_access_token, get_current_user
import crud
from huggingface_hub import AsyncInferenceClient

load_dotenv()

# Buat semua tabel secara otomatis
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inti Rupa API",
    description="REST API untuk platform AI — Komputasi Awan SI ITK",
    version="1.0.0",
)

# ==================== CORS ====================
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
    return {"status": "healthy", "version": "1.0.0"}


# ==================== TEAM INFO ====================

@app.get("/team")
def team_info():
    return {
        "team": "Steam",
        "members": [
            {"name": "Irfan Zaki Riyanto", "nim": "10231045", "role": "Lead Backend"},
            {"name": "Incha Raghil", "nim": "10231043", "role": "Lead Frontend"},
            {"name": "Jonathan Cristopher Jetro", "nim": "10231047", "role": "Lead DevOps"},
            {"name": "Jonathan Joseph Yudita Tampubolon", "nim": "10231048", "role": "Lead QA & Docs"},
        ]
    }


# ==================== AUTH ENDPOINTS ====================

@app.post("/auth/register", response_model=UserResponse, status_code=201)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Registrasi user baru.

    - **username**: Username unik, minimal 3 karakter, tanpa spasi
    - **email**: Harus format email yang valid
    - **full_name**: Nama lengkap (2-100 karakter)
    - **password**: Minimal 8 karakter, wajib ada huruf besar, huruf kecil, dan angka
    """
    user = crud.create_user(db=db, user_data=user_data)
    if not user:
        raise HTTPException(
            status_code=400,
            detail=f"Email '{user_data.email}' atau username '{user_data.username}' sudah terdaftar."
        )
    return user


@app.post("/auth/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """
    Login dan dapatkan JWT token.

    Token berlaku selama 60 menit.
    Gunakan token di header: `Authorization: Bearer <token>`
    """
    user = crud.authenticate_user(db=db, email=login_data.email, password=login_data.password)
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Email atau password tidak cocok."
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


# ==================== AI IMAGE GENERATOR ====================

@app.get("/generate/models")
def get_available_models(current_user: User = Depends(get_current_user)):
    """Daftar model AI yang tersedia. **Membutuhkan autentikasi.**"""
    return {"models": AVAILABLE_MODELS}


@app.post("/generate/image", response_model=ImageGenerateResponse)
async def generate_image(
    request: ImageGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate gambar dari teks prompt menggunakan Hugging Face AI.
    Riwayat generate akan otomatis disimpan ke database.
    **Membutuhkan autentikasi.**
    """
    if request.model not in AVAILABLE_MODELS:
        raise HTTPException(
            status_code=400,
            detail=f"Model '{request.model}' tidak tersedia. Pilih dari: {', '.join(AVAILABLE_MODELS)}"
        )

    hf_api_key = os.getenv("HUGGINGFACE_API_KEY")
    if not hf_api_key:
        raise HTTPException(
            status_code=503,
            detail="Hugging Face API Key belum dikonfigurasi."
        )

    start_time = time.time()

    try:
        client = AsyncInferenceClient(
            api_key=hf_api_key,
            provider="auto",
        )

        kwargs = {
            "prompt": request.prompt,
            "model": request.model,
            "guidance_scale": request.guidance_scale,
            "num_inference_steps": request.num_inference_steps,
        }

        if request.negative_prompt:
            kwargs["negative_prompt"] = request.negative_prompt
        if request.seed is not None:
            kwargs["seed"] = request.seed
        if "flux" not in request.model.lower() and "turbo" not in request.model.lower():
            kwargs["width"] = request.width
            kwargs["height"] = request.height

        image = await client.text_to_image(**kwargs)

        # Konversi PIL Image ke base64
        buffer = io.BytesIO()
        image.save(buffer, format="PNG")
        image_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        generation_time = round(time.time() - start_time, 2)

        # Simpan riwayat ke database
        crud.create_image_generation(
            db=db,
            user_id=current_user.id,
            prompt=request.prompt,
            negative_prompt=request.negative_prompt,
            image_url=f"data:image/png;base64,{image_base64[:50]}...",  # simpan referensi singkat
            model_name=request.model,
            generation_time=generation_time,
            status="completed",
        )
        crud.increment_api_used(db=db, user_id=current_user.id)

    except Exception as e:
        error_str = str(e)

        # Simpan riwayat gagal ke database (jangan biarkan kegagalan logging menyembunyikan error asli)
        try:
            crud.create_image_generation(
                db=db,
                user_id=current_user.id,
                prompt=request.prompt,
                image_url="failed",
                model_name=request.model,
                generation_time=round(time.time() - start_time, 2),
                status="failed",
                error_message=error_str[:300],
            )
        except Exception:
            pass  # Abaikan error logging DB — jangan sampai menutupi error asli

        if "402" in error_str or "payment" in error_str.lower():
            raise HTTPException(status_code=402, detail="Model ini membutuhkan kredit berbayar.")
        if "503" in error_str or "loading" in error_str.lower():
            raise HTTPException(status_code=503, detail="Model sedang loading. Tunggu 20-30 detik lalu coba lagi.")
        if "timeout" in error_str.lower():
            raise HTTPException(status_code=504, detail="Request timeout. Coba beberapa saat lagi.")
        if "429" in error_str or "rate" in error_str.lower():
            raise HTTPException(status_code=429, detail="Terlalu banyak request ke Hugging Face. Tunggu beberapa menit lalu coba lagi.")
        raise HTTPException(
            status_code=502,
            detail=f"Hugging Face API error: {error_str[:300]}"
        )

    return {
        "image_base64": image_base64,
        "prompt": request.prompt,
        "model": request.model,
    }


# ==================== HISTORY: IMAGE GENERATIONS ====================

@app.get("/history/images", response_model=list[ImageGenerationHistoryResponse])
def get_image_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ambil riwayat generate gambar milik user. **Membutuhkan autentikasi.**"""
    return crud.get_image_generations(db=db, user_id=current_user.id, skip=skip, limit=limit)


@app.get("/history/images/{generation_id}", response_model=ImageGenerationHistoryResponse)
def get_image_history_by_id(
    generation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ambil detail satu riwayat generate gambar. **Membutuhkan autentikasi.**"""
    record = crud.get_image_generation_by_id(db=db, user_id=current_user.id, generation_id=generation_id)
    if not record:
        raise HTTPException(status_code=404, detail="Riwayat tidak ditemukan.")
    return record


@app.delete("/history/images/{generation_id}", status_code=204)
def delete_image_history(
    generation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Hapus satu riwayat generate gambar. **Membutuhkan autentikasi.**"""
    success = crud.delete_image_generation(db=db, user_id=current_user.id, generation_id=generation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Riwayat tidak ditemukan.")
    return None


# ==================== HISTORY: TEXT SUMMARIZATIONS ====================

@app.get("/history/summaries", response_model=list[SummarizationHistoryResponse])
def get_summary_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ambil riwayat summarisasi teks milik user. **Membutuhkan autentikasi.**"""
    return crud.get_summarizations(db=db, user_id=current_user.id, skip=skip, limit=limit)


# ==================== HISTORY: IMAGE CAPTIONS ====================

@app.get("/history/captions", response_model=list[ImageCaptionHistoryResponse])
def get_caption_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ambil riwayat caption gambar milik user. **Membutuhkan autentikasi.**"""
    return crud.get_image_captions(db=db, user_id=current_user.id, skip=skip, limit=limit)


# ==================== STATS ====================

@app.get("/stats")
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Statistik penggunaan AI milik user yang sedang login. **Membutuhkan autentikasi.**"""
    from models import ImageGeneration, TextSummarization, ImageCaption
    from sqlalchemy import func

    total_images = db.query(func.count(ImageGeneration.id)).filter(ImageGeneration.user_id == current_user.id).scalar() or 0
    total_summaries = db.query(func.count(TextSummarization.id)).filter(TextSummarization.user_id == current_user.id).scalar() or 0
    total_captions = db.query(func.count(ImageCaption.id)).filter(ImageCaption.user_id == current_user.id).scalar() or 0

    return {
        "user": {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "api_quota": current_user.api_quota,
            "api_used": current_user.api_used,
        },
        "usage": {
            "total_image_generations": total_images,
            "total_text_summarizations": total_summaries,
            "total_image_captions": total_captions,
            "total_api_calls": total_images + total_summaries + total_captions,
        }
    }