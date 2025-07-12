from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from app.config import settings

import jwt
import httpx
from fastapi import Depends, HTTPException, Header
from jwt import PyJWKClient
from app.config import settings

async def get_db():
    from app.database.database import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        yield session


supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        user = supabase.auth.get_user(token)
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))