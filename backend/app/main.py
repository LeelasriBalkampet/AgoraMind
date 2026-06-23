from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .websocket_handler import router as ws_router
from .auth import router as auth_router
from .stats import router as stats_router
from .admin import router as admin_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan: initialize DB on startup, clean up on shutdown."""
    await init_db()
    print("[SUCCESS] AgoraMind backend started")
    yield
    print("[INFO] AgoraMind backend shutting down")


app = FastAPI(
    title="AgoraMind",
    description="Socratic Tutoring System",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ws_router)
app.include_router(auth_router)
app.include_router(stats_router)
app.include_router(admin_router)


@app.get("/health")
async def health() -> dict:
    """Health check endpoint."""
    return {"status": "ok", "service": "AgoraMind"}
