from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone
from ...core.database import get_db
from ...core.dependencies import get_current_user, get_current_teacher, get_current_teacher_or_assistant
from ...core.security import get_password_hash

router = APIRouter(prefix="/users", tags=["Users"])


def validate_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, Exception):
        raise HTTPException(status_code=422, detail="ID غير صالح")


def user_helper(user) -> dict:
    return {
        "id": str(user["_id"]),
        "first_name": user["first_name"],
        "last_name": user["last_name"],
        "phone": user["phone"],
        "grade": user.get("grade"),
        "governorate": user.get("governorate"),
        "gender": user.get("gender"),
        "role": user["role"],
        "is_active": user.get("is_active", True),
        "enrolled_courses": user.get("enrolled_courses", []),
    }


class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    governorate: Optional[str] = None


class AssistantCreate(BaseModel):
    first_name: str
    last_name: str
    phone: str
    password: str


# ====== /me أولًا ======

@router.get("/me/profile")
async def get_my_profile(current_user=Depends(get_current_user)):
    return user_helper(current_user)


@router.patch("/me/profile")
async def update_my_profile(data: ProfileUpdate, current_user=Depends(get_current_user), db=Depends(get_db)):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="مفيش بيانات صالحة للتحديث")
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$set": update_data}
    )
    return {"message": "تم تحديث البيانات"}


# ====== ولي الأمر ======

@router.get("/parent/{parent_phone}")
async def get_student_by_parent(parent_phone: str, db=Depends(get_db)):
    student = await db.users.find_one({"parent_phone": parent_phone, "role": "student"})
    if not student:
        raise HTTPException(status_code=404, detail="مفيش طالب مرتبط بالرقم ده")

    enrolled_ids = student.get("enrolled_courses", [])
    courses = []
    if enrolled_ids:
        course_docs = await db.courses.find(
            {"_id": {"$in": [ObjectId(c) for c in enrolled_ids if ObjectId.is_valid(c)]}},
            {"title": 1}
        ).to_list(100)
        courses = [{"id": str(c["_id"]), "title": c["title"]} for c in course_docs]

    return {
        "id": str(student["_id"]),
        "first_name": student["first_name"],
        "last_name": student["last_name"],
        "grade": student.get("grade"),
        "governorate": student.get("governorate"),
        "enrolled_courses": courses,
    }


# ====== تسجيل خروج إجباري ======

@router.post("/{student_id}/force-logout")
async def force_logout_student(
    student_id: str,
    current_user=Depends(get_current_teacher),
    db=Depends(get_db)
):
    from bson import ObjectId
    from datetime import datetime, timezone
    oid = ObjectId(student_id) if ObjectId.is_valid(student_id) else None
    if not oid:
        raise HTTPException(status_code=422, detail="ID غير صالح")
    student = await db.users.find_one({"_id": oid})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب مش موجود")
    # حدّث force_logout_at — كل التوكنات اللي اتعملت قبله هتبقى منتهية
    await db.users.update_one(
        {"_id": oid},
        {"$set": {"force_logout_at": datetime.now(timezone.utc)}}
    )
    return {"message": f"تم تسجيل خروج {student['first_name']} {student['last_name']} من كل الأجهزة"}


# ====== إنشاء مساعد (المدرس فقط) ======

@router.post("/assistants", status_code=201)
async def create_assistant(data: AssistantCreate, current_user=Depends(get_current_teacher), db=Depends(get_db)):
    existing = await db.users.find_one({"phone": data.phone})
    if existing:
        raise HTTPException(status_code=400, detail="رقم الهاتف مسجل بالفعل")

    hashed = get_password_hash(data.password)
    result = await db.users.insert_one({
        "first_name": data.first_name,
        "last_name": data.last_name,
        "phone": data.phone,
        "password": hashed,
        "role": "assistant",
        "is_active": True,
        "device_id": None,
        "enrolled_courses": [],
        "created_at": datetime.now(timezone.utc),
    })
    return {
        "id": str(result.inserted_id),
        "first_name": data.first_name,
        "last_name": data.last_name,
        "phone": data.phone,
        "role": "assistant",
    }


# ====== المدرس / المساعد ======

@router.get("/", response_model=List[dict])
async def get_all_students(current_user=Depends(get_current_teacher_or_assistant), db=Depends(get_db)):
    students = await db.users.find({"role": "student"}).to_list(1000)
    return [user_helper(s) for s in students]


@router.get("/assistants-list", response_model=List[dict])
async def get_all_assistants(current_user=Depends(get_current_teacher), db=Depends(get_db)):
    assistants = await db.users.find({"role": "assistant"}).to_list(100)
    return [user_helper(a) for a in assistants]


@router.get("/{user_id}")
async def get_student(user_id: str, current_user=Depends(get_current_teacher_or_assistant), db=Depends(get_db)):
    oid = validate_object_id(user_id)
    student = await db.users.find_one({"_id": oid})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب مش موجود")
    return user_helper(student)


@router.patch("/{user_id}/toggle-active")
async def toggle_student_active(user_id: str, current_user=Depends(get_current_teacher), db=Depends(get_db)):
    oid = validate_object_id(user_id)
    student = await db.users.find_one({"_id": oid})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب مش موجود")
    new_status = not student.get("is_active", True)
    await db.users.update_one({"_id": oid}, {"$set": {"is_active": new_status}})
    return {"message": "تم تغيير حالة الطالب", "is_active": new_status}


@router.patch("/{user_id}/reset-device")
async def reset_device(user_id: str, current_user=Depends(get_current_teacher), db=Depends(get_db)):
    oid = validate_object_id(user_id)
    student = await db.users.find_one({"_id": oid})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب مش موجود")
    await db.users.update_one({"_id": oid}, {"$set": {"device_id": None}})
    return {"message": "تم reset الجهاز"}


# ====== حذف طالب (المدرس فقط) ======

@router.delete("/{user_id}")
async def delete_student(user_id: str, current_user=Depends(get_current_teacher), db=Depends(get_db)):
    oid = validate_object_id(user_id)
    student = await db.users.find_one({"_id": oid})
    if not student:
        raise HTTPException(status_code=404, detail="الطالب مش موجود")
    if student["role"] == "teacher":
        raise HTTPException(status_code=403, detail="مش هينفع تحذف حساب مدرس")
    await db.users.delete_one({"_id": oid})
    return {"message": f"تم حذف حساب {student['first_name']} {student['last_name']}"}