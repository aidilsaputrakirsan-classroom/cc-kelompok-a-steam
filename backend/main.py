import os
import io
import base64
import time
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File
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
    ChatSessionCreate, ContinueChatRequest, ChatSessionTitleUpdate,
    ChatMessageResponse, ChatSessionResponse, ChatSessionListItem,
    UnifiedHistoryItem,
)
from auth import create_access_token, get_current_user
import crud
from huggingface_hub import AsyncInferenceClient
import google.generativeai as genai

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


# ==================== AI SUMMARIZER ====================

@app.post("/generate/summarize")
async def generate_summary(
    request: SummarizeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Rangkum teks menggunakan Google Gemini API.
    **Membutuhkan autentikasi.**
    """
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise HTTPException(
            status_code=503,
            detail="Gemini API Key belum dikonfigurasi."
        )

    start_time = time.time()
    
    try:
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = f"Tolong rangkum bahasa Indonesia dari teks atau tautan berikut secara ringkas namun Informatif:\n\n{request.source_content}"
        
        response = await model.generate_content_async(prompt)
        summary_text = response.text
        
        processing_time = round(time.time() - start_time, 2)
        
        # Simpan ke history
        crud.create_summarization(
            db=db,
            user_id=current_user.id,
            source_type=request.source_type,
            source_content=request.source_content,
            summary_text=summary_text,
            model_name="gemini-2.5-flash",
            processing_time=processing_time,
            original_length=len(request.source_content),
            summary_length=len(summary_text),
            compression_ratio=len(summary_text) / max(len(request.source_content), 1),
            status="completed"
        )
        crud.increment_api_used(db=db, user_id=current_user.id)
        
    except Exception as e:
        # Simpan kegagalan
        crud.create_summarization(
            db=db,
            user_id=current_user.id,
            source_type=request.source_type,
            source_content=request.source_content,
            summary_text="failed",
            model_name="gemini-2.5-flash",
            processing_time=round(time.time() - start_time, 2),
            status="failed",
            error_message=str(e)[:300]
        )
        raise HTTPException(status_code=502, detail=f"Gemini API error: {str(e)[:300]}")
        
    return {
        "summary": summary_text,
        "source": request.source_content,
        "model": "gemini-2.5-flash"
    }

# ==================== AI IMAGE CAPTION ====================

@app.post("/generate/caption")
async def generate_caption(
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Deskripsikan atau ekstrak teks dari gambar menggunakan Google Gemini API.
    **Membutuhkan autentikasi.**
    """
    
    if image.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(status_code=400, detail="Format gambar harus JPEG, PNG, atau WEBP")
        
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    if not gemini_api_key:
        raise HTTPException(
            status_code=503,
            detail="Gemini API Key belum dikonfigurasi."
        )

    start_time = time.time()
    
    try:
        image_bytes = await image.read()
        
        # Konversi ke PIL Image karena Gemini meminta format yang dikenali
        from PIL import Image
        pil_image = Image.open(io.BytesIO(image_bytes))
        
        genai.configure(api_key=gemini_api_key)
        model = genai.GenerativeModel("gemini-2.5-flash")
        
        prompt = "Tolong berikan deskripsi yang akurat dalam bahasa Indonesia mengenai apa yang ada pada gambar ini. Jika ada teks pada gambar, tolong ekstrak teksnya sekalian (OCR)."
        
        # Coba generate
        response = await model.generate_content_async([prompt, pil_image])
        caption_text = response.text
        
        processing_time = round(time.time() - start_time, 2)
        
        # Simpan History
        crud.create_image_caption(
            db=db,
            user_id=current_user.id,
            image_url=f"uploaded_{image.filename}_{int(time.time())}",
            caption_text=caption_text,
            model_name="gemini-2.5-flash",
            processing_time=processing_time,
            status="completed"
        )
        crud.increment_api_used(db=db, user_id=current_user.id)
        
    except Exception as e:
        crud.create_image_caption(
            db=db,
            user_id=current_user.id,
            image_url=image.filename,
            caption_text="failed",
            model_name="gemini-2.5-flash",
            processing_time=round(time.time() - start_time, 2),
            status="failed",
            error_message=str(e)[:300]
        )
        raise HTTPException(status_code=502, detail=f"Gemini API error: {str(e)[:300]}")
        
    return {
        "caption": caption_text,
        "filename": image.filename,
        "model": "gemini-1.5-flash"
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


@app.get("/history/captions/{caption_id}", response_model=ImageCaptionHistoryResponse)
def get_caption_history_by_id(
    caption_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ambil detail satu riwayat caption gambar. **Membutuhkan autentikasi.**"""
    record = crud.get_image_caption_by_id(db=db, user_id=current_user.id, caption_id=caption_id)
    if not record:
        raise HTTPException(status_code=404, detail="Riwayat tidak ditemukan.")
    return record


@app.delete("/history/captions/{caption_id}", status_code=204)
def delete_caption_history(
    caption_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Hapus satu riwayat caption gambar. **Membutuhkan autentikasi.**"""
    success = crud.delete_image_caption(db=db, user_id=current_user.id, caption_id=caption_id)
    if not success:
        raise HTTPException(status_code=404, detail="Riwayat tidak ditemukan.")
    return None


# ==================== HISTORY: TEXT SUMMARIZATIONS (detail & delete) ====================

@app.get("/history/summaries/{summarization_id}", response_model=SummarizationHistoryResponse)
def get_summary_history_by_id(
    summarization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ambil detail satu riwayat summarisasi teks. **Membutuhkan autentikasi.**"""
    record = crud.get_summarization_by_id(db=db, user_id=current_user.id, summarization_id=summarization_id)
    if not record:
        raise HTTPException(status_code=404, detail="Riwayat tidak ditemukan.")
    return record


@app.delete("/history/summaries/{summarization_id}", status_code=204)
def delete_summary_history(
    summarization_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Hapus satu riwayat summarisasi teks. **Membutuhkan autentikasi.**"""
    success = crud.delete_summarization(db=db, user_id=current_user.id, summarization_id=summarization_id)
    if not success:
        raise HTTPException(status_code=404, detail="Riwayat tidak ditemukan.")
    return None


# ==================== HISTORY: UNIFIED ====================

@app.get("/history/all", response_model=list[UnifiedHistoryItem])
def get_all_history(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Ambil semua riwayat aktivitas user dalam satu endpoint (gabungan generate gambar,
    rangkum teks, caption, dan sesi chat), diurutkan dari yang terbaru.
    **Membutuhkan autentikasi.**
    """
    return crud.get_unified_history(db=db, user_id=current_user.id, skip=skip, limit=limit)


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


# ==================== CHAT SESSIONS ====================

@app.post("/chat/sessions", response_model=ChatSessionResponse, status_code=201)
async def create_chat_session(
    request: ChatSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Buat sesi percakapan baru dan langsung proses pesan pertama dengan AI.

    - **session_type = 'image'**: `first_message` digunakan sebagai prompt generate gambar
    - **session_type = 'summarize'**: `first_message` digunakan sebagai teks/URL yang dirangkum

    **Membutuhkan autentikasi.**
    """
    # Buat sesi
    session = crud.create_chat_session(
        db=db,
        user_id=current_user.id,
        title=request.title,
        session_type=request.session_type,
    )

    # Simpan pesan user
    crud.add_chat_message(
        db=db,
        session_id=session.id,
        role="user",
        content=request.first_message,
        content_type="text",
    )

    # Proses AI sesuai session_type
    if request.session_type == "image":
        model_name = request.model or "black-forest-labs/FLUX.1-schnell"
        if model_name not in AVAILABLE_MODELS:
            raise HTTPException(
                status_code=400,
                detail=f"Model '{model_name}' tidak tersedia. Pilih dari: {', '.join(AVAILABLE_MODELS)}"
            )
        hf_api_key = os.getenv("HUGGINGFACE_API_KEY")
        if not hf_api_key:
            raise HTTPException(status_code=503, detail="Hugging Face API Key belum dikonfigurasi.")

        start_time = time.time()
        try:
            client = AsyncInferenceClient(api_key=hf_api_key, provider="auto")
            kwargs = {
                "prompt": request.first_message,
                "model": model_name,
                "guidance_scale": 7.5,
                "num_inference_steps": 30,
            }
            if request.negative_prompt:
                kwargs["negative_prompt"] = request.negative_prompt
            image = await client.text_to_image(**kwargs)

            buffer = io.BytesIO()
            image.save(buffer, format="PNG")
            image_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
            generation_time = round(time.time() - start_time, 2)

            # Simpan response AI sebagai message
            crud.add_chat_message(
                db=db,
                session_id=session.id,
                role="assistant",
                content=image_base64,
                content_type="image_base64",
                metadata={"model": model_name, "generation_time": generation_time, "prompt": request.first_message},
            )
            crud.increment_api_used(db=db, user_id=current_user.id)

        except Exception as e:
            error_str = str(e)
            crud.add_chat_message(
                db=db,
                session_id=session.id,
                role="assistant",
                content=f"[Gagal generate gambar: {error_str[:200]}]",
                content_type="text",
                metadata={"error": error_str[:300]},
            )
            if "402" in error_str or "payment" in error_str.lower():
                raise HTTPException(status_code=402, detail="Model ini membutuhkan kredit berbayar.")
            raise HTTPException(status_code=502, detail=f"Hugging Face API error: {error_str[:300]}")

    elif request.session_type == "summarize":
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            raise HTTPException(status_code=503, detail="Gemini API Key belum dikonfigurasi.")

        start_time = time.time()
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = f"Tolong rangkum dalam bahasa Indonesia dari teks atau tautan berikut secara ringkas namun informatif:\n\n{request.first_message}"
            response = await model.generate_content_async(prompt)
            summary_text = response.text
            processing_time = round(time.time() - start_time, 2)

            crud.add_chat_message(
                db=db,
                session_id=session.id,
                role="assistant",
                content=summary_text,
                content_type="text",
                metadata={"model": "gemini-2.5-flash", "processing_time": processing_time, "source_type": request.source_type},
            )
            crud.increment_api_used(db=db, user_id=current_user.id)

        except Exception as e:
            error_str = str(e)
            crud.add_chat_message(
                db=db,
                session_id=session.id,
                role="assistant",
                content=f"[Gagal merangkum: {error_str[:200]}]",
                content_type="text",
                metadata={"error": error_str[:300]},
            )
            raise HTTPException(status_code=502, detail=f"Gemini API error: {error_str[:300]}")

    # Refresh dan kembalikan sesi lengkap
    db.refresh(session)
    return session


@app.get("/chat/sessions", response_model=list[ChatSessionListItem])
def get_chat_sessions(
    session_type: str = Query(None, description="Filter berdasarkan kategori chat (contoh: image, summarize)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Ambil daftar semua sesi percakapan milik user (terbaru duluan).
    Setiap item menyertakan jumlah pesan dan waktu pesan terakhir.
    Bisa di-filter berdasarkan kategori chat (session_type).
    **Membutuhkan autentikasi.**
    """
    return crud.get_chat_sessions(db=db, user_id=current_user.id, session_type=session_type, skip=skip, limit=limit)


@app.get("/chat/sessions/{session_id}", response_model=ChatSessionResponse)
def get_chat_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Ambil detail satu sesi percakapan beserta semua pesannya.
    **Membutuhkan autentikasi.**
    """
    session = crud.get_chat_session_by_id(db=db, user_id=current_user.id, session_id=session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan.")
    return session


@app.post("/chat/sessions/{session_id}/continue", response_model=ChatSessionResponse)
async def continue_chat_session(
    session_id: int,
    request: ContinueChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lanjutkan sesi percakapan yang sudah ada dengan mengirim pesan baru.
    AI akan langsung memproses dan membalas dalam satu request.
    **Membutuhkan autentikasi.**
    """
    session = crud.get_chat_session_by_id(db=db, user_id=current_user.id, session_id=session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan.")

    # Simpan pesan user
    crud.add_chat_message(
        db=db,
        session_id=session.id,
        role="user",
        content=request.message,
        content_type="text",
    )

    # Proses AI sesuai session_type
    if session.session_type == "image":
        model_name = request.model or "black-forest-labs/FLUX.1-schnell"
        if model_name not in AVAILABLE_MODELS:
            raise HTTPException(
                status_code=400,
                detail=f"Model '{model_name}' tidak tersedia. Pilih dari: {', '.join(AVAILABLE_MODELS)}"
            )
        hf_api_key = os.getenv("HUGGINGFACE_API_KEY")
        if not hf_api_key:
            raise HTTPException(status_code=503, detail="Hugging Face API Key belum dikonfigurasi.")

        start_time = time.time()
        try:
            client = AsyncInferenceClient(api_key=hf_api_key, provider="auto")
            kwargs = {
                "prompt": request.message,
                "model": model_name,
                "guidance_scale": 7.5,
                "num_inference_steps": 30,
            }
            if request.negative_prompt:
                kwargs["negative_prompt"] = request.negative_prompt
            image = await client.text_to_image(**kwargs)

            buffer = io.BytesIO()
            image.save(buffer, format="PNG")
            image_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
            generation_time = round(time.time() - start_time, 2)

            crud.add_chat_message(
                db=db,
                session_id=session.id,
                role="assistant",
                content=image_base64,
                content_type="image_base64",
                metadata={"model": model_name, "generation_time": generation_time},
            )
            crud.increment_api_used(db=db, user_id=current_user.id)

        except Exception as e:
            error_str = str(e)
            crud.add_chat_message(
                db=db,
                session_id=session.id,
                role="assistant",
                content=f"[Gagal generate gambar: {error_str[:200]}]",
                content_type="text",
                metadata={"error": error_str[:300]},
            )
            if "402" in error_str or "payment" in error_str.lower():
                raise HTTPException(status_code=402, detail="Model ini membutuhkan kredit berbayar.")
            raise HTTPException(status_code=502, detail=f"Hugging Face API error: {error_str[:300]}")

    elif session.session_type == "summarize":
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            raise HTTPException(status_code=503, detail="Gemini API Key belum dikonfigurasi.")

        start_time = time.time()
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_api_key)
            model = genai.GenerativeModel("gemini-2.5-flash")
            prompt = f"Tolong rangkum dalam bahasa Indonesia dari teks atau tautan berikut secara ringkas namun informatif:\n\n{request.message}"
            response = await model.generate_content_async(prompt)
            summary_text = response.text
            processing_time = round(time.time() - start_time, 2)

            crud.add_chat_message(
                db=db,
                session_id=session.id,
                role="assistant",
                content=summary_text,
                content_type="text",
                metadata={"model": "gemini-2.5-flash", "processing_time": processing_time},
            )
            crud.increment_api_used(db=db, user_id=current_user.id)

        except Exception as e:
            error_str = str(e)
            crud.add_chat_message(
                db=db,
                session_id=session.id,
                role="assistant",
                content=f"[Gagal merangkum: {error_str[:200]}]",
                content_type="text",
                metadata={"error": error_str[:300]},
            )
            raise HTTPException(status_code=502, detail=f"Gemini API error: {error_str[:300]}")

    db.refresh(session)
    return session


@app.patch("/chat/sessions/{session_id}", response_model=ChatSessionResponse)
def update_chat_session_title(
    session_id: int,
    request: ChatSessionTitleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Update judul sesi percakapan.
    **Membutuhkan autentikasi.**
    """
    session = crud.update_chat_session_title(
        db=db, user_id=current_user.id, session_id=session_id, title=request.title
    )
    if not session:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan.")
    return session


@app.delete("/chat/sessions/{session_id}", status_code=204)
def delete_chat_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Hapus sesi percakapan beserta semua pesannya.
    **Membutuhkan autentikasi.**
    """
    success = crud.delete_chat_session(db=db, user_id=current_user.id, session_id=session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan.")
    return None