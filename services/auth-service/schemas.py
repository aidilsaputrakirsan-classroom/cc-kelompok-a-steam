"""Pydantic schemas for Auth Service."""
from pydantic import BaseModel, Field, field_validator, EmailStr
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr = Field(...)
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        errors = []
        if len(v) < 8:
            errors.append("minimal 8 karakter")
        if len(v) > 128:
            errors.append("maksimal 128 karakter")
        if not any(c.isupper() for c in v):
            errors.append("minimal 1 huruf kapital")
        if not any(c.islower() for c in v):
            errors.append("minimal 1 huruf kecil")
        if not any(c.isdigit() for c in v):
            errors.append("minimal 1 angka")
        if errors:
            raise ValueError(f"Password tidak memenuhi syarat: {', '.join(errors)}")
        return v

    @field_validator("username")
    @classmethod
    def username_no_space(cls, v: str) -> str:
        if " " in v:
            raise ValueError("Username tidak boleh mengandung spasi.")
        return v.lower()

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        cleaned = v.strip()
        if len(cleaned) < 2:
            raise ValueError("Nama minimal 2 karakter")
        if len(cleaned) > 100:
            raise ValueError("Nama maksimal 100 karakter")
        return cleaned

class LoginRequest(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
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
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenVerifyResponse(BaseModel):
    user_id: int
    username: str
    email: str
    api_quota: int
    api_used: int
