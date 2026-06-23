"""
Admin Router
Handles global statistics for the admin dashboard.
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from .auth import SECRET_KEY, ALGORITHM
from .database import get_global_stats, get_all_users_stats

router = APIRouter(prefix="/api/admin", tags=["admin"])
security = HTTPBearer()

def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("username") != "AgoraMind Admin":
            raise HTTPException(status_code=403, detail="Not authorized as admin")
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/stats")
async def admin_stats(admin_token: dict = Depends(verify_admin)):
    """Get global stats for the admin dashboard."""
    stats = await get_global_stats()
    users_stats = await get_all_users_stats()
    return {
        "global": stats,
        "users": users_stats
    }
