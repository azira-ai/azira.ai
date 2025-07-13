# app/database/database.py

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# URL de conexão ao Supabase/Postgres
DATABASE_URL = settings.SUPABASE_DB_URL  # ex: "postgresql+asyncpg://user:pass@host:5432/dbname"

# 1) Engine assíncrono
engine = create_async_engine(
    DATABASE_URL,
    echo=True,  # coloque False em produção, se quiser
)

# 2) Session factory
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

# 3) Declarative Base
Base = declarative_base()

# 4) Dependência de sessão para injeção
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
