from sqlalchemy.ext.asyncio import AsyncSession

async def get_db():
    from app.database.database import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        yield session

# Disable auth — return dummy user ID
async def get_current_user() -> str:
    return "8a520d4e-96c3-4836-9c39-6f9ba116b542"
