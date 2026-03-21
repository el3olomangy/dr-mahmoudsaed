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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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