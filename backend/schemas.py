from pydantic import BaseModel, Field, field_validator, EmailStr
from typing import Optional, List, Any, Dict
from datetime import datetime


# ============================================================
# AUTH SCHEMAS
# ============================================================

class UserCreate(BaseModel):
    """Schema untuk registrasi user baru."""
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        examples=["aidil_saputra"],
        description="Username unik (3-50 karakter, tanpa spasi)"
    )
    email: EmailStr = Field(
        ...,
        examples=["user@student.itk.ac.id"],
        description="Alamat email yang valid (contoh: nama@domain.com)"
    )
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
        examples=["Aidil Saputra"],
        description="Nama lengkap (2-100 karakter)"
    )
    password: str = Field(
        ...,
        min_length=8,
        examples=["Password123"],
        description="Password minimal 8 karakter, mengandung huruf besar, huruf kecil, dan angka"
    )

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        """Validasi kekuatan password menggunakan regex check."""
        errors = []
        if not any(c.isupper() for c in v):
            errors.append("minimal 1 huruf kapital (A-Z)")
        if not any(c.islower() for c in v):
            errors.append("minimal 1 huruf kecil (a-z)")
        if not any(c.isdigit() for c in v):
            errors.append("minimal 1 angka (0-9)")
        if len(v) < 8:
            errors.append("minimal 8 karakter")
        if errors:
            raise ValueError(
                f"Password tidak memenuhi syarat: {', '.join(errors)}. "
                "Contoh password yang valid: 'Password123'"
            )
        return v

    @field_validator("username")
    @classmethod
    def username_no_space(cls, v: str) -> str:
        """Pastikan username tidak mengandung spasi."""
        if " " in v:
            raise ValueError("Username tidak boleh mengandung spasi.")
        return v.lower()


class LoginRequest(BaseModel):
    """Schema untuk login request."""
    email: EmailStr = Field(..., examples=["user@student.itk.ac.id"])
    password: str = Field(..., examples=["Password123"])


class UserResponse(BaseModel):
    """Schema untuk response user (tanpa password)."""
    id: int
    username: str
    email: str
    full_name: str
    api_quota: int
    api_used: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema untuk response setelah login berhasil."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ============================================================
# IMAGE GENERATION SCHEMAS
# ============================================================

AVAILABLE_MODELS = [
    "black-forest-labs/FLUX.1-schnell",
    "stabilityai/stable-diffusion-xl-base-1.0",
]

class ImageGenerateRequest(BaseModel):
    """Schema untuk request generate gambar dari teks prompt."""
    prompt: str = Field(
        ..., min_length=3, max_length=500,
        examples=["a futuristic city at sunset, digital art"],
        description="Deskripsi gambar yang ingin di-generate"
    )
    model: str = Field(
        default="black-forest-labs/FLUX.1-schnell",
        description="Model Hugging Face yang digunakan"
    )
    negative_prompt: Optional[str] = Field(
        default=None, max_length=300,
        description="Hal yang TIDAK diinginkan dalam gambar"
    )
    guidance_scale: float = Field(
        default=7.5, ge=1.0, le=20.0,
        description="CFG Scale: seberapa ketat AI mengikuti prompt (1-20)"
    )
    num_inference_steps: int = Field(
        default=30, ge=10, le=100,
        description="Jumlah langkah denoising (10-100, lebih banyak = lebih detail)"
    )
    width: int = Field(default=1024, description="Lebar gambar (px)")
    height: int = Field(default=1024, description="Tinggi gambar (px)")
    seed: Optional[int] = Field(default=None, description="Seed untuk hasil yang reproducible")


class ImageGenerateResponse(BaseModel):
    """Schema untuk response hasil generate gambar."""
    image_base64: str
    prompt: str
    model: str


# ============================================================
# IMAGE GENERATION HISTORY SCHEMAS
# ============================================================

class ImageGenerationHistoryResponse(BaseModel):
    """Schema untuk response riwayat generate gambar dari database."""
    id: int
    prompt: str
    negative_prompt: Optional[str]
    image_url: str
    model_name: str
    status: str
    error_message: Optional[str]
    generation_time: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# TEXT SUMMARIZATION SCHEMAS
# ============================================================

class SummarizeRequest(BaseModel):
    """Schema untuk request summarisasi teks."""
    source_type: str = Field(
        ...,
        examples=["text"],
        description="Jenis sumber: 'url', 'text', atau 'file'"
    )
    source_content: str = Field(
        ..., min_length=10,
        description="Teks atau URL yang akan diringkas"
    )
    model_name: str = Field(
        default="bart-summarizer",
        description="Model AI yang digunakan untuk summarisasi"
    )

    @field_validator("source_type")
    @classmethod
    def validate_source_type(cls, v: str) -> str:
        allowed = {"url", "text", "file"}
        if v not in allowed:
            raise ValueError(f"source_type harus salah satu dari: {', '.join(allowed)}")
        return v


class SummarizationHistoryResponse(BaseModel):
    """Schema untuk response riwayat summarisasi dari database."""
    id: int
    source_type: str
    source_content: str
    summary_text: str
    model_name: str
    original_length: Optional[int]
    summary_length: Optional[int]
    compression_ratio: Optional[float]
    status: str
    error_message: Optional[str]
    processing_time: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# IMAGE CAPTION SCHEMAS
# ============================================================

class ImageCaptionHistoryResponse(BaseModel):
    """Schema untuk response riwayat caption dari database."""
    id: int
    image_url: str
    caption_text: str
    model_name: str
    confidence_score: Optional[float]
    status: str
    error_message: Optional[str]
    processing_time: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# CHAT SESSION SCHEMAS
# ============================================================

class ChatSessionCreate(BaseModel):
    """Schema untuk membuat sesi percakapan baru (dan langsung memanggil AI)."""
    title: str = Field(
        default="New Chat",
        max_length=255,
        examples=["Generate kucing imut"],
        description="Judul sesi percakapan (bisa diubah nanti)"
    )
    session_type: str = Field(
        ...,
        examples=["image"],
        description="Jenis sesi: 'image' (generate gambar) atau 'summarize' (rangkum teks)"
    )
    first_message: str = Field(
        ..., min_length=3,
        examples=["a cute cat sitting on a desk, digital art"],
        description="Pesan pertama user (prompt gambar atau teks/URL yang ingin dirangkum)"
    )
    # Untuk session_type='image'
    model: Optional[str] = Field(
        default="black-forest-labs/FLUX.1-schnell",
        description="Model image generation (hanya untuk session_type='image')"
    )
    negative_prompt: Optional[str] = Field(
        default=None, max_length=300,
        description="Hal yang TIDAK diinginkan dalam gambar (hanya untuk session_type='image')"
    )
    # Untuk session_type='summarize'
    source_type: Optional[str] = Field(
        default="text",
        examples=["text"],
        description="Jenis sumber teks: 'url', 'text', atau 'file' (hanya untuk session_type='summarize')"
    )

    @field_validator("session_type")
    @classmethod
    def validate_session_type(cls, v: str) -> str:
        allowed = {"image", "summarize"}
        if v not in allowed:
            raise ValueError(f"session_type harus salah satu dari: {', '.join(allowed)}")
        return v

    @field_validator("source_type")
    @classmethod
    def validate_source_type(cls, v: str) -> str:
        if v is not None:
            allowed = {"url", "text", "file"}
            if v not in allowed:
                raise ValueError(f"source_type harus salah satu dari: {', '.join(allowed)}")
        return v


class ContinueChatRequest(BaseModel):
    """Schema untuk melanjutkan percakapan dalam sesi yang sudah ada."""
    message: str = Field(
        ..., min_length=3,
        examples=["a cute cat with blue background"],
        description="Pesan baru dari user (prompt gambar atau teks/URL baru)"
    )
    # Untuk session_type='image'
    model: Optional[str] = Field(
        default="black-forest-labs/FLUX.1-schnell",
        description="Model image generation (hanya untuk sesi image)"
    )
    negative_prompt: Optional[str] = Field(
        default=None, max_length=300,
        description="Hal yang TIDAK diinginkan dalam gambar (hanya untuk sesi image)"
    )
    # Untuk session_type='summarize'
    source_type: Optional[str] = Field(
        default="text",
        description="Jenis sumber teks: 'url', 'text', atau 'file' (hanya untuk sesi summarize)"
    )


class ChatSessionTitleUpdate(BaseModel):
    """Schema untuk mengupdate judul sesi."""
    title: str = Field(
        ..., min_length=1, max_length=255,
        examples=["Kucing digital art collection"],
        description="Judul baru untuk sesi percakapan"
    )


class ChatMessageResponse(BaseModel):
    """Schema untuk response satu pesan dalam sesi."""
    id: int
    session_id: int
    role: str
    content_type: str
    content: str
    metadata_json: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ChatSessionResponse(BaseModel):
    """Schema untuk response detail satu sesi (termasuk semua pesan)."""
    id: int
    title: str
    session_type: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse]

    class Config:
        from_attributes = True


class ChatSessionListItem(BaseModel):
    """Schema untuk satu item dalam daftar sesi (tanpa semua pesan, hanya preview)."""
    id: int
    title: str
    session_type: str
    message_count: int
    last_message_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================
# UNIFIED HISTORY SCHEMA
# ============================================================

class UnifiedHistoryItem(BaseModel):
    """Schema untuk satu item di tampilan riwayat gabungan.
    Setiap item memiliki 'type' yang menunjukkan asal data."""
    id: int
    type: str   # 'image_generation' | 'text_summarization' | 'image_caption' | 'chat_session'
    title: str  # deskripsi singkat (prompt / source_content potongan / session title)
    status: Optional[str]       # 'completed' | 'failed' | None (untuk chat_session)
    session_type: Optional[str] # hanya untuk type='chat_session'
    created_at: datetime

    class Config:
        from_attributes = True