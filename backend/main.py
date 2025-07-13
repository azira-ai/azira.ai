# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.models import APIKey, APIKeyIn, SecuritySchemeType
from fastapi.openapi.utils import get_openapi
from fastapi.security import HTTPBearer
import os

import asyncio

from app.database.database import engine
from app.models import item, outfit, profile
from app.routers import items, outfits, user, profiles

app = FastAPI(title="Fashion AI App", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4173", "https://azira.netlify.app"],  # front-end Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(items.router, prefix="/items", tags=["items"])
app.include_router(outfits.router, prefix="/outfits", tags=["outfits"])
app.include_router(user.router, prefix="/user", tags=["user"])
# profiles.router já define prefix="/profiles"
app.include_router(profiles.router)


# Create database tables
async def init_models():
    async with engine.begin() as conn:
        # importa modelos para registrar metadata
        await conn.run_sync(item.Base.metadata.create_all)
        await conn.run_sync(outfit.Base.metadata.create_all)
        await conn.run_sync(profile.Base.metadata.create_all)

@app.on_event("startup")
async def startup():
    # garante que as tabelas existam
    await init_models()

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
