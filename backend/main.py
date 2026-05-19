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
    ChatSessionCreate, ContinueChatRequest, ChatSessionTitleUpdate,
    ChatMessageResponse, ChatSessionResponse, ChatSessionListItem,
    AVAILABLE_MODELS,
)
from auth import create_access_token, get_current_user
import crud
from huggingface_hub import AsyncInferenceClient
import google.generativeai as genai

load_dotenv()

from contextlib import asynccontextmanager

# Buat semua tabel secara otomatis saat aplikasi mulai
@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.getenv("TESTING") != "true":
        Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Inti Rupa API",
    description="REST API untuk platform AI — Komputasi Awan SI ITK",
    version="1.0.0",
    lifespan=lifespan,
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
            model_name = "gemini-3.1-flash-lite-preview"
            model = genai.GenerativeModel(model_name)
            prompt_template = (
                "Tolong rangkum teks berikut dalam bahasa Indonesia secara ringkas namun informatif.\n"
                "Format output menggunakan Markdown dengan struktur yang jelas:\n"
                "- Gunakan heading ## untuk bagian-bagian utama\n"
                "- Gunakan bullet points (-) untuk poin-poin penting\n"
                "- Gunakan **bold** untuk kata kunci atau istilah penting\n"
                "- Akhiri dengan bagian ## Kesimpulan yang berisi intisari singkat\n\n"
                "Teks yang dirangkum:\n"
            )
            prompt = prompt_template + request.first_message
            response = await model.generate_content_async(prompt)
            summary_text = response.text
            processing_time = round(time.time() - start_time, 2)

            crud.add_chat_message(
                db=db,
                session_id=session.id,
                role="assistant",
                content=summary_text,
                content_type="text",
                metadata={"model": model_name, "processing_time": processing_time, "source_type": request.source_type},
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

    elif request.session_type == "ocr":
        if not request.image_data:
            raise HTTPException(status_code=400, detail="Data gambar (image_data) wajib disertakan untuk sesi OCR.")
            
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            raise HTTPException(status_code=503, detail="Gemini API Key belum dikonfigurasi.")

        start_time = time.time()
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_api_key)
            model_name = "gemini-3.1-flash-lite-preview"
            model = genai.GenerativeModel(model_name)
            
            # Ekstrak tipe MIME dan data base64 murni
            image_b64 = request.image_data
            mime_type = "image/jpeg" # Default fallback
            if "," in image_b64:
                header, image_b64 = image_b64.split(",", 1)
                # Contoh header: data:image/png;base64
                if ":" in header and ";" in header:
                    mime_type = header.split(":")[1].split(";")[0]

            image_bytes = base64.b64decode(image_b64)
            image_part = {
                "mime_type": mime_type,
                "data": image_bytes
            }
            
            prompt = request.first_message
            if prompt == "" or len(prompt) < 3:
                prompt = "Tolong ekstrak semua teks yang ada di dalam gambar ini secara presisi dan rapi."

            response = await model.generate_content_async([prompt, image_part])
            ocr_text = response.text
            processing_time = round(time.time() - start_time, 2)

            crud.add_chat_message(
                db=db,
                session_id=session.id,
                role="assistant",
                content=ocr_text,
                content_type="text",
                metadata={"model": model_name, "processing_time": processing_time},
            )
            crud.increment_api_used(db=db, user_id=current_user.id)

        except Exception as e:
            error_str = str(e)
            crud.add_chat_message(
                db=db,
                session_id=session.id,
                role="assistant",
                content=f"[Gagal membaca dokumen: {error_str[:200]}]",
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
            model_name = "gemini-3.1-flash-lite-preview"
            model = genai.GenerativeModel(model_name)
            prompt_template = (
                "Tolong rangkum teks berikut dalam bahasa Indonesia secara ringkas namun informatif.\n"
                "Format output menggunakan Markdown dengan struktur yang jelas:\n"
                "- Gunakan heading ## untuk bagian-bagian utama\n"
                "- Gunakan bullet points (-) untuk poin-poin penting\n"
                "- Gunakan **bold** untuk kata kunci atau istilah penting\n"
                "- Akhiri dengan bagian ## Kesimpulan yang berisi intisari singkat\n\n"
                "Teks yang dirangkum:\n"
            )
            prompt = prompt_template + request.message
            response = await model.generate_content_async(prompt)
            summary_text = response.text
            processing_time = round(time.time() - start_time, 2)

            crud.add_chat_message(
                db=db,
                session_id=session.id,
                role="assistant",
                content=summary_text,
                content_type="text",
                metadata={"model": model_name, "processing_time": processing_time},
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

    elif session.session_type == "ocr":
        if not request.image_data:
            raise HTTPException(status_code=400, detail="Data gambar (image_data) wajib disertakan untuk sesi OCR.")
            
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            raise HTTPException(status_code=503, detail="Gemini API Key belum dikonfigurasi.")

        start_time = time.time()
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_api_key)
            model_name = "gemini-3.1-flash-lite-preview"
            model = genai.GenerativeModel(model_name)
            
            # Ekstrak tipe MIME dan data base64 murni
            image_b64 = request.image_data
            mime_type = "image/jpeg"
            if "," in image_b64:
                header, image_b64 = image_b64.split(",", 1)
                if ":" in header and ";" in header:
                    mime_type = header.split(":")[1].split(";")[0]

            image_bytes = base64.b64decode(image_b64)
            image_part = {
                "mime_type": mime_type,
                "data": image_bytes
            }
            
            prompt = request.message
            if prompt == "" or len(prompt) < 3:
                prompt = "Tolong ekstrak semua teks yang ada di dalam dokumen ini."

            response = await model.generate_content_async([prompt, image_part])
            ocr_text = response.text
            processing_time = round(time.time() - start_time, 2)

            crud.add_chat_message(
                db=db,
                session_id=session.id,
                role="assistant",
                content=ocr_text,
                content_type="text",
                metadata={"model": model_name, "processing_time": processing_time},
            )
            crud.increment_api_used(db=db, user_id=current_user.id)

        except Exception as e:
            error_str = str(e)
            crud.add_chat_message(
                db=db,
                session_id=session.id,
                role="assistant",
                content=f"[Gagal membaca dokumen: {error_str[:200]}]",
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
