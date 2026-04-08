from pydantic import BaseModel, Field, field_validator, EmailStr
from typing import Optional
from datetime import datetime


# === BASE SCHEMA ===
class ItemBase(BaseModel):
    """Base schema — field yang dipakai untuk create & update."""
    name: str = Field(..., min_length=1, max_length=100, examples=["Laptop"])
    description: Optional[str] = Field(None, examples=["Laptop untuk cloud computing"])
    price: float = Field(..., gt=0, examples=[15000000])
    quantity: int = Field(0, ge=0, examples=[10])


# === CREATE SCHEMA (untuk POST request) ===
class ItemCreate(ItemBase):
    """Schema untuk membuat item baru. Mewarisi semua field dari ItemBase."""
    pass


# === UPDATE SCHEMA (untuk PUT request) ===
class ItemUpdate(BaseModel):
    """
    Schema untuk update item. Semua field optional
    karena user mungkin hanya ingin update sebagian field.
    """
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    price: Optional[float] = Field(None, gt=0)
    quantity: Optional[int] = Field(None, ge=0)


# === RESPONSE SCHEMA (untuk output) ===
class ItemResponse(ItemBase):
    """Schema untuk response. Termasuk id dan timestamp dari database."""
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # Agar bisa convert dari SQLAlchemy model


# === LIST RESPONSE (dengan metadata) ===
class ItemListResponse(BaseModel):
    """Schema untuk response list items dengan total count."""
    total: int
    items: list[ItemResponse]


# ============================================================
# AUTH SCHEMAS
# ============================================================

class UserCreate(BaseModel):
    """Schema untuk registrasi user baru."""
    email: EmailStr = Field(
        ...,
        examples=["user@student.itk.ac.id"],
        description="Alamat email yang valid (contoh: nama@domain.com)"
    )
    name: str = Field(
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


class LoginRequest(BaseModel):
    """Schema untuk login request."""
    email: EmailStr = Field(..., examples=["user@student.itk.ac.id"])
    password: str = Field(..., examples=["Password123"])


class UserResponse(BaseModel):
    """Schema untuk response user (tanpa password)."""
    id: int
    email: str
    name: str
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
    "stabilityai/stable-diffusion-3.5-large",
    "stabilityai/stable-diffusion-xl-base-1.0",
    "runwayml/stable-diffusion-v1-5",
    "stabilityai/stable-diffusion-2-1"
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