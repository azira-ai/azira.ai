from sqlalchemy.ext.asyncio import AsyncSession

async def get_db():
    from app.database.database import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        yield session

# Disable auth — return dummy user ID
async def get_current_user() -> str:
    return "00000000-0000-0000-0000-000000000000"
