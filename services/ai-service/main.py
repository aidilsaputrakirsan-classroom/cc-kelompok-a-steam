import os
import io
import base64
import time
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from contextlib import asynccontextmanager

from database import engine, get_db, Base
from models import ImageGeneration, TextSummarization, ImageCaption, ChatSession, ChatMessage
from schemas import (
    ChatSessionCreate, ContinueChatRequest, ChatSessionTitleUpdate,
    ChatMessageResponse, ChatSessionResponse, ChatSessionListItem,
    AVAILABLE_MODELS,
)
from auth_client import verify_token_with_auth_service, increment_api_used_in_auth_service, auth_circuit
import crud
from huggingface_hub import AsyncInferenceClient

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    if os.getenv("TESTING") != "true":
        Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="AI Service",
    description="Microservice untuk pemrosesan AI",
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
def health_check(db: Session = Depends(get_db)):
    """
    Aggregated health check — menampilkan status semua dependency.
    status: 'healthy' | 'degraded' | 'unhealthy'
    """
    # Cek status circuit breaker ke Auth Service
    cb_status = auth_circuit.get_status()

    # Cek koneksi ke database AI
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"

    # Tentukan overall status
    overall = "healthy"
    if cb_status["state"] != "CLOSED":
        overall = "degraded"
    if db_status != "connected":
        overall = "unhealthy"

    return {
        "status": overall,
        "service": "ai-service",
        "version": "2.1.0",
        "dependencies": {
            "auth-service": {
                "status": "available" if cb_status["state"] == "CLOSED" else "unavailable",
                "circuit_breaker": cb_status,
            },
            "database": {
                "status": db_status,
            },
        },
    }


@app.get("/stats")
def get_user_stats(
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db),
):
    """
    Statistik penggunaan AI milik user yang sedang login.
    Memerlukan token autentikasi yang valid.
    """
    user_id = user["user_id"]
    total_images = db.query(func.count(ImageGeneration.id)).filter(ImageGeneration.user_id == user_id).scalar() or 0
    total_summaries = db.query(func.count(TextSummarization.id)).filter(TextSummarization.user_id == user_id).scalar() or 0
    total_captions = db.query(func.count(ImageCaption.id)).filter(ImageCaption.user_id == user_id).scalar() or 0

    return {
        "user": user,
        "usage": {
            "total_image_generations": total_images,
            "total_text_summarizations": total_summaries,
            "total_image_captions": total_captions,
            "total_api_calls": total_images + total_summaries + total_captions,
        }
    }


@app.get("/stats/degraded")
def get_stats_degraded(db: Session = Depends(get_db)):
    """
    Degraded mode endpoint untuk /stats.
    Hanya dapat diakses saat circuit breaker ke Auth Service OPEN.
    Return data agregat (tanpa info user spesifik) agar service tetap berguna.
    """
    cb_status = auth_circuit.get_status()
    if cb_status["state"] == "CLOSED":
        raise HTTPException(
            status_code=400,
            detail="Auth Service sedang normal. Gunakan endpoint /stats dengan token."
        )

    # Statistik global (tanpa filter user — karena tidak bisa verifikasi token)
    total_images = db.query(func.count(ImageGeneration.id)).scalar() or 0
    total_summaries = db.query(func.count(TextSummarization.id)).scalar() or 0
    total_captions = db.query(func.count(ImageCaption.id)).scalar() or 0
    total_sessions = db.query(func.count(ChatSession.id)).scalar() or 0

    return {
        "mode": "degraded",
        "message": "Auth Service sedang tidak tersedia. Menampilkan statistik global sementara.",
        "auth_circuit_state": cb_status["state"],
        "global_stats": {
            "total_image_generations": total_images,
            "total_text_summarizations": total_summaries,
            "total_image_captions": total_captions,
            "total_chat_sessions": total_sessions,
            "total_api_calls": total_images + total_summaries + total_captions,
        },
    }


@app.get("/stats/public")
def get_public_stats(db: Session = Depends(get_db)):
    """
    Public stats endpoint — tidak membutuhkan autentikasi.
    Menampilkan statistik penggunaan platform Intirupa secara agregat.
    Analog dengan GET /items/public di modul 13.
    """
    total_images = db.query(func.count(ImageGeneration.id)).scalar() or 0
    total_summaries = db.query(func.count(TextSummarization.id)).scalar() or 0
    total_captions = db.query(func.count(ImageCaption.id)).scalar() or 0
    total_sessions = db.query(func.count(ChatSession.id)).scalar() or 0
    total_users_served = db.query(ImageGeneration.user_id).distinct().count()

    return {
        "platform": "Intirupa AI",
        "message": "Statistik penggunaan platform secara publik.",
        "stats": {
            "total_image_generations": total_images,
            "total_text_summarizations": total_summaries,
            "total_image_captions": total_captions,
            "total_chat_sessions": total_sessions,
            "total_api_calls": total_images + total_summaries + total_captions,
            "total_users_served": total_users_served,
        },
    }

@app.post("/chat/sessions", response_model=ChatSessionResponse, status_code=201)
async def create_chat_session(
    request: ChatSessionCreate,
    user: dict = Depends(verify_token_with_auth_service),
    db: Session = Depends(get_db),
):
    user_id = user["user_id"]
    session = crud.create_chat_session(db=db, user_id=user_id, title=request.title, session_type=request.session_type)

    if request.session_type != "ocr":
        crud.add_chat_message(db=db, session_id=session.id, role="user", content=request.first_message, content_type="text")

    if request.session_type == "image":
        model_name = request.model or "black-forest-labs/FLUX.1-schnell"
        if model_name not in AVAILABLE_MODELS:
            raise HTTPException(status_code=400, detail=f"Model '{model_name}' tidak tersedia.")
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

            crud.add_chat_message(db=db, session_id=session.id, role="assistant", content=image_base64, content_type="image_base64", metadata={"model": model_name, "generation_time": generation_time, "prompt": request.first_message})
            await increment_api_used_in_auth_service(user_id)

        except Exception as e:
            crud.add_chat_message(db=db, session_id=session.id, role="assistant", content=f"[Gagal generate gambar: {str(e)[:200]}]", content_type="text", metadata={"error": str(e)[:300]})
            raise HTTPException(status_code=502, detail=f"Hugging Face API error: {str(e)[:300]}")

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
            prompt = f"Tolong rangkum teks berikut dalam bahasa Indonesia secara ringkas namun informatif.\n\nTeks yang dirangkum:\n{request.first_message}"
            response = await model.generate_content_async(prompt)
            summary_text = response.text
            processing_time = round(time.time() - start_time, 2)

            crud.add_chat_message(db=db, session_id=session.id, role="assistant", content=summary_text, content_type="text", metadata={"model": model_name, "processing_time": processing_time})
            await increment_api_used_in_auth_service(user_id)

        except Exception as e:
            crud.add_chat_message(db=db, session_id=session.id, role="assistant", content=f"[Gagal merangkum: {str(e)[:200]}]", content_type="text", metadata={"error": str(e)[:300]})
            raise HTTPException(status_code=502, detail=f"Gemini API error: {str(e)[:300]}")

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
            
            image_b64 = request.image_data
            mime_type = "image/jpeg"
            if "," in image_b64:
                header, image_b64 = image_b64.split(",", 1)
                if ":" in header and ";" in header:
                    mime_type = header.split(":")[1].split(";")[0]

            image_bytes = base64.b64decode(image_b64)
            image_part = {"mime_type": mime_type, "data": image_bytes}
            
            crud.add_chat_message(db=db, session_id=session.id, role="user", content=request.image_data, content_type="image_base64", metadata={"mime_type": mime_type})
            if request.first_message and request.first_message.strip():
                crud.add_chat_message(db=db, session_id=session.id, role="user", content=request.first_message, content_type="text")
            
            prompt = request.first_message
            if not prompt or len(prompt) < 3: prompt = "Tolong ekstrak semua teks yang ada di dalam gambar ini secara presisi dan rapi."

            response = await model.generate_content_async([prompt, image_part])
            ocr_text = response.text
            processing_time = round(time.time() - start_time, 2)

            crud.add_chat_message(db=db, session_id=session.id, role="assistant", content=ocr_text, content_type="text", metadata={"model": model_name, "processing_time": processing_time})
            await increment_api_used_in_auth_service(user_id)

        except Exception as e:
            crud.add_chat_message(db=db, session_id=session.id, role="assistant", content=f"[Gagal membaca dokumen: {str(e)[:200]}]", content_type="text", metadata={"error": str(e)[:300]})
            raise HTTPException(status_code=502, detail=f"Gemini API error: {str(e)[:300]}")

    db.refresh(session)
    return session

@app.get("/chat/sessions", response_model=list[ChatSessionListItem])
def get_chat_sessions(
    session_type: str = Query(None), skip: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100),
    user: dict = Depends(verify_token_with_auth_service), db: Session = Depends(get_db),
):
    return crud.get_chat_sessions(db=db, user_id=user["user_id"], session_type=session_type, skip=skip, limit=limit)

@app.get("/chat/sessions/{session_id}", response_model=ChatSessionResponse)
def get_chat_session(
    session_id: int, user: dict = Depends(verify_token_with_auth_service), db: Session = Depends(get_db),
):
    session = crud.get_chat_session_by_id(db=db, user_id=user["user_id"], session_id=session_id)
    if not session: raise HTTPException(status_code=404, detail="Sesi tidak ditemukan.")
    return session

@app.post("/chat/sessions/{session_id}/continue", response_model=ChatSessionResponse)
async def continue_chat_session(
    session_id: int, request: ContinueChatRequest,
    user: dict = Depends(verify_token_with_auth_service), db: Session = Depends(get_db),
):
    user_id = user["user_id"]
    session = crud.get_chat_session_by_id(db=db, user_id=user_id, session_id=session_id)
    if not session: raise HTTPException(status_code=404, detail="Sesi tidak ditemukan.")

    if session.session_type != "ocr":
        crud.add_chat_message(db=db, session_id=session.id, role="user", content=request.message, content_type="text")

    if session.session_type == "image":
        model_name = request.model or "black-forest-labs/FLUX.1-schnell"
        hf_api_key = os.getenv("HUGGINGFACE_API_KEY")
        if not hf_api_key: raise HTTPException(status_code=503, detail="Hugging Face API Key belum dikonfigurasi.")

        start_time = time.time()
        try:
            client = AsyncInferenceClient(api_key=hf_api_key, provider="auto")
            kwargs = {
                "prompt": request.message,
                "model": model_name,
                "guidance_scale": 7.5,
                "num_inference_steps": 30,
            }
            if request.negative_prompt: kwargs["negative_prompt"] = request.negative_prompt
            image = await client.text_to_image(**kwargs)

            buffer = io.BytesIO()
            image.save(buffer, format="PNG")
            image_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")
            generation_time = round(time.time() - start_time, 2)

            crud.add_chat_message(db=db, session_id=session.id, role="assistant", content=image_base64, content_type="image_base64", metadata={"model": model_name, "generation_time": generation_time})
            await increment_api_used_in_auth_service(user_id)

        except Exception as e:
            crud.add_chat_message(db=db, session_id=session.id, role="assistant", content=f"[Gagal generate gambar: {str(e)[:200]}]", content_type="text", metadata={"error": str(e)[:300]})
            raise HTTPException(status_code=502, detail=f"Hugging Face API error: {str(e)[:300]}")

    elif session.session_type == "summarize":
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key: raise HTTPException(status_code=503, detail="Gemini API Key belum dikonfigurasi.")

        start_time = time.time()
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_api_key)
            model_name = "gemini-3.1-flash-lite-preview"
            model = genai.GenerativeModel(model_name)
            prompt = f"Tolong rangkum teks berikut dalam bahasa Indonesia secara ringkas namun informatif.\n\nTeks yang dirangkum:\n{request.message}"
            response = await model.generate_content_async(prompt)
            summary_text = response.text
            processing_time = round(time.time() - start_time, 2)

            crud.add_chat_message(db=db, session_id=session.id, role="assistant", content=summary_text, content_type="text", metadata={"model": model_name, "processing_time": processing_time})
            await increment_api_used_in_auth_service(user_id)

        except Exception as e:
            crud.add_chat_message(db=db, session_id=session.id, role="assistant", content=f"[Gagal merangkum: {str(e)[:200]}]", content_type="text", metadata={"error": str(e)[:300]})
            raise HTTPException(status_code=502, detail=f"Gemini API error: {str(e)[:300]}")

    elif session.session_type == "ocr":
        if not request.image_data: raise HTTPException(status_code=400, detail="Data gambar (image_data) wajib disertakan untuk sesi OCR.")
            
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key: raise HTTPException(status_code=503, detail="Gemini API Key belum dikonfigurasi.")

        start_time = time.time()
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_api_key)
            model_name = "gemini-3.1-flash-lite-preview"
            model = genai.GenerativeModel(model_name)
            
            image_b64 = request.image_data
            mime_type = "image/jpeg"
            if "," in image_b64:
                header, image_b64 = image_b64.split(",", 1)
                if ":" in header and ";" in header: mime_type = header.split(":")[1].split(";")[0]

            image_bytes = base64.b64decode(image_b64)
            image_part = {"mime_type": mime_type, "data": image_bytes}
            
            crud.add_chat_message(db=db, session_id=session.id, role="user", content=request.image_data, content_type="image_base64", metadata={"mime_type": mime_type})
            if request.message and request.message.strip():
                crud.add_chat_message(db=db, session_id=session.id, role="user", content=request.message, content_type="text")
            
            prompt = request.message
            if not prompt or len(prompt) < 3: prompt = "Tolong ekstrak semua teks yang ada di dalam dokumen ini."

            response = await model.generate_content_async([prompt, image_part])
            ocr_text = response.text
            processing_time = round(time.time() - start_time, 2)

            crud.add_chat_message(db=db, session_id=session.id, role="assistant", content=ocr_text, content_type="text", metadata={"model": model_name, "processing_time": processing_time})
            await increment_api_used_in_auth_service(user_id)

        except Exception as e:
            crud.add_chat_message(db=db, session_id=session.id, role="assistant", content=f"[Gagal membaca dokumen: {str(e)[:200]}]", content_type="text", metadata={"error": str(e)[:300]})
            raise HTTPException(status_code=502, detail=f"Gemini API error: {str(e)[:300]}")

    db.refresh(session)
    return session

@app.patch("/chat/sessions/{session_id}", response_model=ChatSessionResponse)
def update_chat_session_title(
    session_id: int, request: ChatSessionTitleUpdate, user: dict = Depends(verify_token_with_auth_service), db: Session = Depends(get_db),
):
    session = crud.update_chat_session_title(db=db, user_id=user["user_id"], session_id=session_id, title=request.title)
    if not session: raise HTTPException(status_code=404, detail="Sesi tidak ditemukan.")
    return session

@app.delete("/chat/sessions/{session_id}", status_code=204)
def delete_chat_session(session_id: int, user: dict = Depends(verify_token_with_auth_service), db: Session = Depends(get_db)):
    success = crud.delete_chat_session(db=db, user_id=user["user_id"], session_id=session_id)
    if not success: raise HTTPException(status_code=404, detail="Sesi tidak ditemukan.")
    return None
