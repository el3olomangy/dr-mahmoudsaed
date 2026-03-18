from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from bson import ObjectId
from bson.errors import InvalidId
from ...core.database import get_db
from ...core.dependencies import get_current_user, get_current_teacher, get_current_teacher_or_assistant

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


# ====== /me أولًا — لازم قبل /{user_id} ======

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
    return {
        "id": str(student["_id"]),
        "first_name": student["first_name"],
        "last_name": student["last_name"],
        "grade": student.get("grade"),
        "governorate": student.get("governorate"),
        "enrolled_courses": student.get("enrolled_courses", []),
    }


# ====== المدرس / المساعد ======

@router.get("/", response_model=List[dict])
async def get_all_students(current_user=Depends(get_current_teacher_or_assistant), db=Depends(get_db)):
    students = await db.users.find({"role": "student"}).to_list(1000)
    return [user_helper(s) for s in students]


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
    return {"message": "تم reset الجهاز — الطالب يقدر يدخل من جهاز جديد"}