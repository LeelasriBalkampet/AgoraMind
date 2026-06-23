"""
AgoraMind Authentication Router
Handles user registration and login with JWT tokens.
"""

import os
import jwt
import datetime
import asyncpg
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import bcrypt

from . import database

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET_KEY = os.environ.get("JWT_SECRET", "agoramind-secret-key-change-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


def create_token(user_id: int, username: str) -> str:
    """Create a JWT token for the authenticated user."""
    payload = {
        "sub": str(user_id),
        "username": username,
        "exp": datetime.datetime.now(datetime.timezone.utc)
        + datetime.timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/register")
async def register(req: RegisterRequest):
    """Register a new user."""
    if len(req.username.strip()) < 2:
        raise HTTPException(status_code=400, detail="Username must be at least 2 characters")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    password_hash = bcrypt.hashpw(req.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    try:
        async with database.pool.acquire() as db:
            user_id = await db.fetchval(
                "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id",
                req.username.strip(), req.email.strip().lower(), password_hash,
            )
    except asyncpg.exceptions.UniqueViolationError:
        raise HTTPException(status_code=409, detail="Email or username already exists")

    token = create_token(user_id, req.username)
    return {"token": token, "username": req.username, "user_id": user_id}


@router.post("/login")
async def login(req: LoginRequest):
    """Log in an existing user."""
    # Hardcoded Admin Intercept
    if req.email.strip() == "AgoraMind Admin" and req.password == "admin@123":
        token = create_token(0, "AgoraMind Admin")
        return {"token": token, "username": "AgoraMind Admin", "user_id": 0, "isAdmin": True}

    async with database.pool.acquire() as db:
        row = await db.fetchrow(
            "SELECT id, username, password_hash FROM users WHERE email = $1",
            req.email.strip().lower(),
        )

    if not row or not bcrypt.checkpw(req.password.encode('utf-8'), row["password_hash"].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(row["id"], row["username"])
    return {"token": token, "username": row["username"], "user_id": row["id"], "isAdmin": False}
