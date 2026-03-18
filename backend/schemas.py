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