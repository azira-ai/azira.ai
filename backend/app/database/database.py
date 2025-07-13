from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.config import settings

# engine = create_async_engine(
#     settings.SUPABASE_DB_URL,
#     echo=True,
#     connect_args={"prepared_statement_cache_size": 0}
# )

engine = create_async_engine(
    settings.SUPABASE_DB_URL,
    echo=True
)


AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
