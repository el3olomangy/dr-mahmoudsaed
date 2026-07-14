from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from contextlib import asynccontextmanager
from .core.database import connect_db, close_db, get_db
from .core.config import settings
from .api.routes import auth, courses, codes, exams, notifications, users, progress, upload, stats, assignments, grade_images

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    db = get_db()
    await db.token_blacklist.create_index("expires_at", expireAfterSeconds=0)
    yield
    await close_db()

app = FastAPI(
    title="El3olomangy API",
    description="منصة العلومنجي التعليمية",
    version="1.0.0",
    lifespan=lifespan
)

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://192.168.1.13:3000",
    # أضف domain الإنتاج هنا لما ترفع
    # "https://el3olomangy.com",
    # "https://www.el3olomangy.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "X-Device-ID"],
)

# Security Headers Middleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: StarletteRequest, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response

app.add_middleware(SecurityHeadersMiddleware)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(courses.router, prefix="/api/v1")
app.include_router(codes.router, prefix="/api/v1")
app.include_router(exams.router, prefix="/api/v1")
app.include_router(notifications.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(progress.router, prefix="/api/v1")
app.include_router(upload.router, prefix="/api/v1")
app.include_router(stats.router, prefix="/api/v1")
app.include_router(assignments.router, prefix="/api/v1")
app.include_router(grade_images.router, prefix="/api/v1")

Path("static/images").mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    return {"message": "El3olomangy API is running 🚀"}

@app.get("/health")
async def health():
    return {"status": "ok"}