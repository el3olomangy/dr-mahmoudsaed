from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from pathlib import Path
import uuid
import os
from PIL import Image as PILImage
import io
from ...core.dependencies import get_current_teacher

router = APIRouter(prefix="/upload", tags=["Upload"])

# فولدر حفظ الصور
UPLOAD_DIR = Path("static/images")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_MB = 5


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user=Depends(get_current_teacher),
):
    # تحقق من النوع
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="نوع الملف مش مدعوم — ارفع صورة JPG أو PNG أو WebP")

    # اقرأ الملف
    content = await file.read()

    # تحقق من الحجم
    if len(content) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"حجم الصورة أكبر من {MAX_SIZE_MB}MB")

    # اضغط الصورة وحوّلها لـ JPEG
    try:
        img = PILImage.open(io.BytesIO(content))
        img = img.convert("RGB")

        # resize لو أكبر من 1200px
        max_size = 1200
        if img.width > max_size or img.height > max_size:
            img.thumbnail((max_size, max_size), PILImage.LANCZOS)

        # احفظ بجودة 85%
        output = io.BytesIO()
        img.save(output, format="JPEG", quality=85, optimize=True)
        output.seek(0)
        compressed = output.read()
    except Exception:
        raise HTTPException(status_code=400, detail="الملف مش صورة صالحة")

    # اسم فريد
    filename = f"{uuid.uuid4().hex}.jpg"
    filepath = UPLOAD_DIR / filename

    with open(filepath, "wb") as f:
        f.write(compressed)

    # ارجع الـ URL
    return {"url": f"/static/images/{filename}"}


@router.delete("/image/{filename}")
async def delete_image(
    filename: str,
    current_user=Depends(get_current_teacher),
):
    filepath = UPLOAD_DIR / filename
    if filepath.exists():
        os.remove(filepath)
    return {"message": "تم الحذف"}