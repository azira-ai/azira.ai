from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseSettings):
    SUPABASE_URL: str  # e.g., https://your-project-id.supabase.co
    SUPABASE_KEY: str  # Supabase anon or service_role key
    SUPABASE_DB_URL: str  # e.g., postgresql+asyncpg://postgres:[password]@db.project-id.supabase.co:5432/postgres
    GEMINI_API_KEY: str
    SUPABASE_STORAGE_BUCKET: str = "azira-storage-bucket"  # Name of the Supabase Storage bucket
    SECRET_KEY: str  # For JWT signing
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()