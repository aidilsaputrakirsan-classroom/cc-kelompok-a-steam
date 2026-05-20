from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime

AVAILABLE_MODELS = [
    "black-forest-labs/FLUX.1-schnell",
    "stabilityai/stable-diffusion-xl-base-1.0",
]

class ChatSessionCreate(BaseModel):
    title: str = Field(default="New Chat", max_length=255)
    session_type: str = Field(...)
    first_message: str = Field(..., min_length=3)
    model: Optional[str] = Field(default="black-forest-labs/FLUX.1-schnell")
    negative_prompt: Optional[str] = Field(default=None, max_length=300)
    source_type: Optional[str] = Field(default="text")
    image_data: Optional[str] = Field(default=None)

    @field_validator("session_type")
    @classmethod
    def validate_session_type(cls, v: str) -> str:
        allowed = {"image", "summarize", "ocr"}
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
    message: str = Field(..., min_length=3)
    model: Optional[str] = Field(default="black-forest-labs/FLUX.1-schnell")
    negative_prompt: Optional[str] = Field(default=None, max_length=300)
    source_type: Optional[str] = Field(default="text")
    image_data: Optional[str] = Field(default=None)

class ChatSessionTitleUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)

class ChatMessageResponse(BaseModel):
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
    id: int
    title: str
    session_type: str
    created_at: datetime
    updated_at: datetime
    messages: List[ChatMessageResponse]

    class Config:
        from_attributes = True

class ChatSessionListItem(BaseModel):
    id: int
    title: str
    session_type: str
    message_count: int
    last_message_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
