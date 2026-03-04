# Database Schema Documentation

## Overview
This document describes the database schema for the **Inti Rupa** project - an AI-powered Cloud Computing platform that provides:
- 🎨 **AI Image Generator** (Text-to-Image)
- 📝 **Text Summarizer** 
- 🖼️ **Image-to-Text Generator** (OCR/Image Captioning)
- 📚 **Generation History** (Track all AI generations)

**Database Type:** PostgreSQL  
**Database Name:** `intirupa`

---

## Tables

### 1. Users Table
Stores user account information for authentication.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique user identifier |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | User's login username |
| `email` | VARCHAR(100) | UNIQUE, NOT NULL | User's email address |
| `password_hash` | VARCHAR(255) | NOT NULL | Hashed password |
| `full_name` | VARCHAR(100) | NOT NULL | User's full name |
| `api_quota` | INTEGER | DEFAULT 100 | Monthly API usage quota |
| `api_used` | INTEGER | DEFAULT 0 | API calls used this month |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Account creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

**Indexes:**
- `idx_users_email` on `email`
- `idx_users_username` on `username`

---

### 2. Image Generations Table
Stores AI-generated images from text prompts.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique generation identifier |
| `user_id` | INTEGER | FOREIGN KEY → users(id), NOT NULL | User who created this |
| `prompt` | TEXT | NOT NULL | Text prompt used for generation |
| `negative_prompt` | TEXT | NULLABLE | Negative prompt (what to avoid) |
| `image_url` | VARCHAR(500) | NOT NULL | URL/path to generated image |
| `model_name` | VARCHAR(100) | DEFAULT 'stable-diffusion' | AI model used |
| `status` | VARCHAR(20) | DEFAULT 'pending' | Status: pending, completed, failed |
| `error_message` | TEXT | NULLABLE | Error message if failed |
| `generation_time` | FLOAT | NULLABLE | Time taken to generate (seconds) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Generation timestamp |

**Indexes:**
- `idx_img_gen_user` on `user_id`
- `idx_img_gen_status` on `status`
- `idx_img_gen_created` on `created_at DESC`

---

### 3. Text Summarizations Table
Stores summarized text from various sources.

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique summarization identifier |
| `user_id` | INTEGER | FOREIGN KEY → users(id), NOT NULL | User who requested this |
| `source_type` | VARCHAR(20) | NOT NULL | Source type: 'url', 'text', 'file' |
| `source_content` | TEXT | NOT NULL | Original/extracted text |
| `summary_text` | TEXT | NOT NULL | Summarized text |
| `model_name` | VARCHAR(100) | DEFAULT 'bart-summarizer' | AI model used |
| `original_length` | INTEGER | NULLABLE | Character count of original |
| `summary_length` | INTEGER | NULLABLE | Character count of summary |
| `compression_ratio` | FLOAT | NULLABLE | Ratio of summary/original length |
| `status` | VARCHAR(20) | DEFAULT 'pending' | Status: pending, completed, failed |
| `error_message` | TEXT | NULLABLE | Error message if failed |
| `processing_time` | FLOAT | NULLABLE | Time taken to process (seconds) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Summarization timestamp |

**Indexes:**
- `idx_summ_user` on `user_id`
- `idx_summ_source_type` on `source_type`
- `idx_summ_created` on `created_at DESC`

---

### 4. Image Captions Table
Stores AI-generated captions/descriptions from images (Image-to-Text).

| Column Name | Data Type | Constraints | Description |
|------------|-----------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Unique caption identifier |
| `user_id` | INTEGER | FOREIGN KEY → users(id), NOT NULL | User who uploaded image |
| `image_url` | VARCHAR(500) | NOT NULL | URL/path to uploaded image |
| `caption_text` | TEXT | NOT NULL | Generated caption/description |
| `model_name` | VARCHAR(100) | DEFAULT 'blip-caption' | AI model used |
| `confidence_score` | FLOAT | NULLABLE | Model confidence (0-1) |
| `status` | VARCHAR(20) | DEFAULT 'pending' | Status: pending, completed, failed |
| `error_message` | TEXT | NULLABLE | Error message if failed |
| `processing_time` | FLOAT | NULLABLE | Time taken to process (seconds) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Caption generation timestamp |

**Indexes:**
- `idx_caption_user` on `user_id`
- `idx_caption_created` on `created_at DESC`

---

## Entity Relationship Diagram (ERD)

```
┌─────────────────────┐
│       USERS         │
├─────────────────────┤
│ * id (PK)           │
│   username          │
│   email             │
│   password_hash     │
│   full_name         │
│   api_quota         │
│   api_used          │
│   created_at        │
│   updated_at        │
└──────────┬──────────┘
           │
           │ 1:N (one user, many generations)
           │
    ┌──────┴──────┬──────────────┬──────────────┐
    │             │              │              │
    ▼             ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   IMAGE     │ │    TEXT     │ │   IMAGE     │
│ GENERATIONS │ │SUMMARIZATIONS│ │  CAPTIONS   │
├─────────────┤ ├─────────────┤ ├─────────────┤
│ * id (PK)   │ │ * id (PK)   │ │ * id (PK)   │
│   user_id ──┤ │   user_id ──┤ │   user_id ──┤
│   prompt    │ │   source... │ │   image_url │
│   image_url │ │   summary...│ │   caption...│
│   model...  │ │   model...  │ │   model...  │
│   status    │ │   status    │ │   status    │
│   created_at│ │   created_at│ │   created_at│
└─────────────┘ └─────────────┘ └─────────────┘
```

> 📝 **Note:** Schema ini dirancang untuk AI Cloud Computing platform. Setiap fitur AI (Image Generation, Summarization, Image-to-Text) memiliki tabel history tersendiri yang terhubung ke user.

---

## SQL Schema Definition

### Create Database & Tables

```sql
-- Create database
CREATE DATABASE intirupa;

-- Connect to database
\c intirupa;

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    api_quota INTEGER DEFAULT 100,
    api_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ============================================
-- 2. IMAGE GENERATIONS TABLE
-- ============================================
CREATE TABLE image_generations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prompt TEXT NOT NULL,
    negative_prompt TEXT,
    image_url VARCHAR(500) NOT NULL,
    model_name VARCHAR(100) DEFAULT 'stable-diffusion',
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    generation_time FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_img_gen_user ON image_generations(user_id);
CREATE INDEX idx_img_gen_status ON image_generations(status);
CREATE INDEX idx_img_gen_created ON image_generations(created_at DESC);

-- ============================================
-- 3. TEXT SUMMARIZATIONS TABLE
-- ============================================
CREATE TABLE text_summarizations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_type VARCHAR(20) NOT NULL,
    source_content TEXT NOT NULL,
    summary_text TEXT NOT NULL,
    model_name VARCHAR(100) DEFAULT 'bart-summarizer',
    original_length INTEGER,
    summary_length INTEGER,
    compression_ratio FLOAT,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    processing_time FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_summ_user ON text_summarizations(user_id);
CREATE INDEX idx_summ_source_type ON text_summarizations(source_type);
CREATE INDEX idx_summ_created ON text_summarizations(created_at DESC);

-- ============================================
-- 4. IMAGE CAPTIONS TABLE
-- ============================================
CREATE TABLE image_captions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    caption_text TEXT NOT NULL,
    model_name VARCHAR(100) DEFAULT 'blip-caption',
    confidence_score FLOAT,
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    processing_time FLOAT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_caption_user ON image_captions(user_id);
CREATE INDEX idx_caption_created ON image_captions(created_at DESC);
```

### Trigger for Auto-Update `updated_at`

PostgreSQL doesn't auto-update `updated_at` by default. Create a trigger for users table:

```sql
-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

---

## Sample Data

### Insert Sample User

```sql
-- Insert sample user for testing
INSERT INTO users (username, email, password_hash, full_name) VALUES
('demo_user', 'demo@intirupa.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8', 'Demo User');

-- Get user ID for sample data
SELECT id FROM users WHERE username = 'demo_user';
-- Assume returns id = 1
```

### Insert Sample AI Generations

```sql
-- Sample image generation
INSERT INTO image_generations (user_id, prompt, image_url, model_name, status, generation_time) VALUES
(1, 'A beautiful sunset over mountains', '/uploads/generated/sunset_001.png', 'stable-diffusion', 'completed', 3.5),
(1, 'Futuristic city with flying cars', '/uploads/generated/city_002.png', 'stable-diffusion', 'completed', 4.2);

-- Sample text summarization
INSERT INTO text_summarizations (user_id, source_type, source_content, summary_text, status, processing_time) VALUES
(1, 'text', 'Long article about cloud computing and its benefits...', 'Cloud computing offers scalability, cost-efficiency, and flexibility...', 'completed', 1.2),
(1, 'url', 'Full content from https://example.com/article', 'Summary of the article...', 'completed', 2.1);

-- Sample image caption
INSERT INTO image_captions (user_id, image_url, caption_text, confidence_score, status, processing_time) VALUES
(1, '/uploads/images/photo_001.jpg', 'A person standing on a mountain peak at sunset', 0.95, 'completed', 0.8),
(1, '/uploads/images/photo_002.jpg', 'A cat sitting on a windowsill', 0.92, 'completed', 0.7);
```

### Query Examples

```sql
-- Get all generations by a user
SELECT * FROM image_generations WHERE user_id = 1 ORDER BY created_at DESC;

-- Get recent summaries
SELECT * FROM text_summarizations ORDER BY created_at DESC LIMIT 10;

-- Get user's AI usage statistics
SELECT 
    u.username,
    u.api_used,
    u.api_quota,
    COUNT(DISTINCT ig.id) as total_images,
    COUNT(DISTINCT ts.id) as total_summaries,
    COUNT(DISTINCT ic.id) as total_captions
FROM users u
LEFT JOIN image_generations ig ON u.id = ig.user_id
LEFT JOIN text_summarizations ts ON u.id = ts.user_id
LEFT JOIN image_captions ic ON u.id = ic.user_id
WHERE u.id = 1
GROUP BY u.id, u.username, u.api_used, u.api_quota;

-- Get failed generations for debugging
SELECT * FROM image_generations WHERE status = 'failed' ORDER BY created_at DESC;

-- Search summarizations by content
SELECT * FROM text_summarizations 
WHERE source_content ILIKE '%cloud%' OR summary_text ILIKE '%cloud%'
ORDER BY created_at DESC;
```

---

## SQLAlchemy Models (Python)

File: `backend/models.py`

```python
from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    """User model for authentication and tracking API usage"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    api_quota = Column(Integer, default=100)
    api_used = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    image_generations = relationship("ImageGeneration", back_populates="user")
    summarizations = relationship("TextSummarization", back_populates="user")
    captions = relationship("ImageCaption", back_populates="user")


class ImageGeneration(Base):
    """AI Image Generation history"""
    __tablename__ = "image_generations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    prompt = Column(Text, nullable=False)
    negative_prompt = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=False)
    model_name = Column(String(100), default='stable-diffusion')
    status = Column(String(20), default='pending')
    error_message = Column(Text, nullable=True)
    generation_time = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    user = relationship("User", back_populates="image_generations")


class TextSummarization(Base):
    """Text Summarization history"""
    __tablename__ = "text_summarizations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    source_type = Column(String(20), nullable=False)  # 'url', 'text', 'file'
    source_content = Column(Text, nullable=False)
    summary_text = Column(Text, nullable=False)
    model_name = Column(String(100), default='bart-summarizer')
    original_length = Column(Integer, nullable=True)
    summary_length = Column(Integer, nullable=True)
    compression_ratio = Column(Float, nullable=True)
    status = Column(String(20), default='pending')
    error_message = Column(Text, nullable=True)
    processing_time = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    user = relationship("User", back_populates="summarizations")


class ImageCaption(Base):
    """Image-to-Text Caption generation history"""
    __tablename__ = "image_captions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    image_url = Column(String(500), nullable=False)
    caption_text = Column(Text, nullable=False)
    model_name = Column(String(100), default='blip-caption')
    confidence_score = Column(Float, nullable=True)
    status = Column(String(20), default='pending')
    error_message = Column(Text, nullable=True)
    processing_time = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    user = relationship("User", back_populates="captions")
```

---

## API Endpoints Mapping

### Image Generation Endpoints

| HTTP Method | Endpoint | Database Operation | Description |
|-------------|----------|-------------------|-------------|
| `POST /api/generate/image` | Create image | INSERT into image_generations | Generate image from text prompt |
| `GET /api/history/images` | List images | SELECT from image_generations | Get user's generation history |
| `GET /api/history/images/{id}` | Get one image | SELECT by ID | Get specific generation details |
| `DELETE /api/history/images/{id}` | Delete image | DELETE from image_generations | Remove from history |

### Text Summarization Endpoints

| HTTP Method | Endpoint | Database Operation | Description |
|-------------|----------|-------------------|-------------|
| `POST /api/summarize/text` | Create summary | INSERT into text_summarizations | Summarize text input |
| `POST /api/summarize/url` | Create summary from URL | INSERT into text_summarizations | Scrape & summarize from URL |
| `GET /api/history/summaries` | List summaries | SELECT from text_summarizations | Get user's summary history |
| `GET /api/history/summaries/{id}` | Get one summary | SELECT by ID | Get specific summary details |

### Image-to-Text Endpoints

| HTTP Method | Endpoint | Database Operation | Description |
|-------------|----------|-------------------|-------------|
| `POST /api/caption/image` | Create caption | INSERT into image_captions | Generate caption from image |
| `GET /api/history/captions` | List captions | SELECT from image_captions | Get user's caption history |
| `GET /api/history/captions/{id}` | Get one caption | SELECT by ID | Get specific caption details |

### User & Stats Endpoints

| HTTP Method | Endpoint | Database Operation | Description |
|-------------|----------|-------------------|-------------|
| `POST /api/auth/register` | Create user | INSERT into users | Register new user |
| `POST /api/auth/login` | Query user | SELECT from users | User authentication |
| `GET /api/stats` | Query all tables | SELECT with JOINs | Get user's AI usage statistics |

---

## Validation Rules (Pydantic Schemas)

### Image Generation Schemas

| Field | Validation | Error if |
|-------|-----------|----------|
| `prompt` | min_length=3, max_length=1000 | Too short or too long |
| `negative_prompt` | Optional, max_length=500 | Too long |
| `model_name` | Optional, default='stable-diffusion' | - |

### Summarization Schemas

| Field | Validation | Error if |
|-------|-----------|----------|
| `source_type` | Enum: 'url', 'text', 'file' | Invalid type |
| `source_content` | min_length=10 | Too short to summarize |
| `model_name` | Optional, default='bart-summarizer' | - |

### Image Caption Schemas

| Field | Validation | Error if |
|-------|-----------|----------|
| `image_file` | File upload, max_size=10MB | File too large |
| `model_name` | Optional, default='blip-caption' | - |

File: `backend/schemas.py` (Sample)

```python
from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime

# === USER SCHEMAS ===
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=1, max_length=100)

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    full_name: str
    api_quota: int
    api_used: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# === IMAGE GENERATION SCHEMAS ===
class ImageGenerateRequest(BaseModel):
    prompt: str = Field(..., min_length=3, max_length=1000)
    negative_prompt: Optional[str] = Field(None, max_length=500)
    model_name: str = Field(default='stable-diffusion')

class ImageGenerationResponse(BaseModel):
    id: int
    prompt: str
    negative_prompt: Optional[str]
    image_url: str
    status: str
    generation_time: Optional[float]
    created_at: datetime
    
    class Config:
        from_attributes = True

# === SUMMARIZATION SCHEMAS ===
class SummarizeRequest(BaseModel):
    source_type: str = Field(..., pattern='^(url|text|file)$')
    source_content: str = Field(..., min_length=10)
    model_name: str = Field(default='bart-summarizer')

class SummarizationResponse(BaseModel):
    id: int
    source_type: str
    summary_text: str
    original_length: Optional[int]
    summary_length: Optional[int]
    compression_ratio: Optional[float]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# === IMAGE CAPTION SCHEMAS ===
class ImageCaptionResponse(BaseModel):
    id: int
    image_url: str
    caption_text: str
    confidence_score: Optional[float]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True
```

---

## Database Connection (SQLAlchemy)

File: `backend/database.py`

```python
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Format: postgresql://user:password@host:port/database
# Example: postgresql://postgres:postgres@localhost:5432/cloudapp

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency injection for FastAPI endpoints"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## Environment Variables

File: `backend/.env.example`

```env
# Database
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/intirupa

# AI API Keys (Hugging Face, OpenAI, etc)
HUGGINGFACE_API_KEY=your_api_key_here
OPENAI_API_KEY=your_openai_key_here

# AI Models
IMAGE_GENERATION_MODEL=stabilityai/stable-diffusion-2-1
SUMMARIZATION_MODEL=facebook/bart-large-cnn
IMAGE_CAPTION_MODEL=Salesforce/blip-image-captioning-base

# Application
SECRET_KEY=your-secret-key-for-jwt
API_QUOTA_PER_USER=100
```

File: `backend/.env` (actual, not committed)

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/intirupa
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
IMAGE_GENERATION_MODEL=stabilityai/stable-diffusion-2-1
SUMMARIZATION_MODEL=facebook/bart-large-cnn
IMAGE_CAPTION_MODEL=Salesforce/blip-image-captioning-base
SECRET_KEY=your-actual-secret-key-here
API_QUOTA_PER_USER=100
```

> ⚠️ **Important:** Never commit `.env` file to Git! It contains sensitive credentials and API keys.

---

## Setup Instructions

### 1. Install PostgreSQL

Download from: https://www.postgresql.org/download/

Default credentials:
- Username: `postgres`
- Password: (set during installation)
- Port: `5432`

### 2. Create Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE intirupa;

# Verify
\l

# Exit
\q
```

Or using command line directly:

```bash
createdb -U postgres intirupa
```

### 3. Configure Backend

1. Copy `.env.example` to `.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. Edit `backend/.env` with your PostgreSQL password and API keys:
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/intirupa
   HUGGINGFACE_API_KEY=your_huggingface_api_key
   OPENAI_API_KEY=your_openai_api_key
   ```

### 4. Run Migrations (Auto-create tables)

The tables will be created automatically when you run the FastAPI app:

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

This line in `main.py` creates all tables:
```python
Base.metadata.create_all(bind=engine)
```

---

## Testing Database Connection

### Using Python Shell

```bash
cd backend
source venv/bin/activate
python
```

```python
from database import engine, SessionLocal
from models import User, ImageGeneration

# Test connection
engine.connect()
# Should not raise error

# Create a session
db = SessionLocal()

# Insert test user
new_user = User(
    username="testuser",
    email="test@example.com",
    password_hash="hashed_password_here",
    full_name="Test User"
)
db.add(new_user)
db.commit()
db.refresh(new_user)

print(f"User created with ID: {new_user.id}")

# Insert test image generation
new_gen = ImageGeneration(
    user_id=new_user.id,
    prompt="A beautiful landscape",
    image_url="/uploads/test.png",
    status="completed"
)
db.add(new_gen)
db.commit()

# Query
generations = db.query(ImageGeneration).filter_by(user_id=new_user.id).all()
print(f"User has {len(generations)} generations")

db.close()
```

### Using psql

```bash
psql -U postgres -d intirupa

-- Show all tables
\dt

-- Show table structures
\d users
\d image_generations
\d text_summarizations
\d image_captions

-- Query data
SELECT * FROM users;
SELECT * FROM image_generations LIMIT 5;
SELECT * FROM text_summarizations LIMIT 5;
```

---

## Backup & Restore

### Backup Database

```bash
pg_dump -U postgres intirupa > intirupa_backup.sql
```

### Restore Database

```bash
psql -U postgres intirupa < intirupa_backup.sql
```

---

## Future Expansion (Modul 12-14)

Pada fase Microservices nanti, schema akan berkembang dengan:

### Additional Features

1. **Cache Table** - untuk menyimpan hasil AI agar tidak perlu regenerate
2. **API Logs Table** - untuk monitoring dan analytics
3. **User Preferences** - custom settings per user
4. **Shared Generations** - sharing AI results antar user
5. **Payment/Credits** - sistem kredit untuk API usage

### Example Cache Table

```sql
CREATE TABLE ai_cache (
    id SERIAL PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE NOT NULL,  -- MD5 hash of request
    cache_type VARCHAR(20) NOT NULL,         -- 'image', 'summary', 'caption'
    input_data JSONB NOT NULL,               -- Original request
    output_data JSONB NOT NULL,              -- Cached result
    hit_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### Microservices Architecture

Setiap AI feature akan menjadi service terpisah dengan database masing-masing:
- **Auth Service** → users database
- **Image Generation Service** → image_generations database
- **Summarization Service** → text_summarizations database
- **Caption Service** → image_captions database
- **API Gateway** → route requests ke service yang tepat

---

## Notes

- All timestamps use UTC timezone
- IDs are auto-increment (SERIAL in PostgreSQL)
- Foreign key constraints use `ON DELETE CASCADE` for automatic cleanup
- Indexes are created on frequently queried columns (user_id, created_at, status)
- The schema supports multiple AI models per feature type
- Status field tracks async processing: 'pending' → 'completed' / 'failed'
- History tables store all generations for analytics and user reference
- API quota system prevents abuse and tracks usage

## Security Considerations

1. **Password Storage**: Always hash passwords (use bcrypt, never plain text)
2. **API Keys**: Store in `.env`, never commit to Git
3. **User Data**: Implement proper access control (users can only see their own data)
4. **Input Validation**: Validate all inputs before database operations
5. **SQL Injection**: Use ORM (SQLAlchemy) with parameterized queries
6. **Rate Limiting**: Enforce API quotas to prevent abuse

---

**Last Updated:** March 4, 2026  
**Project:** Inti Rupa - AI Cloud Computing Platform  
**Version:** 2.0
