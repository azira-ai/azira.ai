from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import items, outfits, upload_router, users
from app.database.database import engine
from app.models import item, outfit
from sqlalchemy.ext.asyncio import AsyncSession
from app.dependencies import get_db
import asyncio


app = FastAPI(title="Fashion AI App", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(items.router, prefix="/items", tags=["items"])
app.include_router(outfits.router, prefix="/outfits", tags=["outfits"])
app.include_router(users.router, prefix="/users", tags=["users"])

# Create database tables
async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(item.Base.metadata.create_all)
        await conn.run_sync(outfit.Base.metadata.create_all)

@app.on_event("startup")
async def startup():
    await init_models()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)