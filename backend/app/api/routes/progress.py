from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from datetime import datetime, timezone
from bson import ObjectId
from ...core.database import get_db
from ...core.dependencies import get_current_user, get_current_teacher_or_assistant

router = APIRouter(prefix="/progress", tags=["Progress"])


class VideoPosition(BaseModel):
    position: float  # بالثواني
    duration: float = 0  # مدة الفيديو الكاملة


@router.post("/lecture/{lecture_id}/position")
async def save_video_position(
    lecture_id: str,
    data: VideoPosition,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    """حفظ آخر موقف وصله الطالب في الفيديو"""
    user_id = str(current_user["_id"])
    watched = data.duration > 0 and (data.position / data.duration) >= 0.9
    await db.lecture_progress.update_one(
        {"user_id": user_id, "lecture_id": lecture_id},
        {"$set": {
            "user_id": user_id,
            "lecture_id": lecture_id,
            "last_position": data.position,
            "duration": data.duration,
            "watched": watched,
            "updated_at": datetime.now(timezone.utc),
        }},
        upsert=True,
    )
    return {"message": "تم حفظ الموقف"}


@router.get("/lecture/{lecture_id}/position")
async def get_video_position(
    lecture_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    """جيب آخر موقف للطالب في الفيديو"""
    user_id = str(current_user["_id"])
    doc = await db.lecture_progress.find_one(
        {"user_id": user_id, "lecture_id": lecture_id}
    )
    if not doc:
        return {"last_position": 0, "duration": 0, "watched": False}
    return {
        "last_position": doc.get("last_position", 0),
        "duration": doc.get("duration", 0),
        "watched": doc.get("watched", False),
    }


@router.post("/lecture/{lecture_id}")
async def mark_lecture_watched(
    lecture_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    """الطالب شاف المحاضرة — سجّل ده"""
    user_id = str(current_user["_id"])
    await db.lecture_progress.update_one(
        {"user_id": user_id, "lecture_id": lecture_id},
        {"$set": {
            "user_id": user_id,
            "lecture_id": lecture_id,
            "watched_at": datetime.now(timezone.utc),
        }},
        upsert=True,
    )
    return {"message": "تم تسجيل المشاهدة"}


@router.get("/course/{course_id}")
async def get_course_progress(
    course_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    """تقدم الطالب في كورس معين"""
    user_id = str(current_user["_id"])

    # جيب كل محاضرات الكورس
    units = await db.units.find({"course_id": course_id}).to_list(100)
    all_lecture_ids = []
    for unit in units:
        lectures = await db.lectures.find({"unit_id": str(unit["_id"])}).to_list(100)
        all_lecture_ids.extend([str(l["_id"]) for l in lectures])

    total_lectures = len(all_lecture_ids)
    if total_lectures == 0:
        return {"watched": 0, "total_lectures": 0, "percentage": 0, "watched_ids": [], "exam_stats": {}}

    # جيب المحاضرات اللي اتشافت
    watched_docs = await db.lecture_progress.find({
        "user_id": user_id,
        "lecture_id": {"$in": all_lecture_ids},
    }).to_list(500)
    watched_ids = [d["lecture_id"] for d in watched_docs]
    watched_count = len(watched_ids)

    # إحصائيات الاختبارات
    exam_results = await db.exam_results.find({
        "student_id": user_id,
        "exam_id": {"$in": [
            str(e["_id"]) async for e in db.exams.find({"course_id": course_id})
        ]},
    }).to_list(200)
    passed = sum(1 for r in exam_results if r.get("passed"))

    return {
        "watched": watched_count,
        "total_lectures": total_lectures,
        "percentage": round(watched_count / total_lectures * 100) if total_lectures else 0,
        "watched_ids": watched_ids,
        "exam_stats": {
            "taken": len(exam_results),
            "passed": passed,
        },
    }


@router.get("/student/{student_id}/course/{course_id}")
async def get_student_course_progress(
    student_id: str,
    course_id: str,
    current_user=Depends(get_current_teacher_or_assistant),
    db=Depends(get_db)
):
    """المدرس/المساعد يشوف تقدم طالب معين في كورس"""
    units = await db.units.find({"course_id": course_id}).to_list(100)
    all_lecture_ids = []
    for unit in units:
        lectures = await db.lectures.find({"unit_id": str(unit["_id"])}).to_list(100)
        all_lecture_ids.extend([str(l["_id"]) for l in lectures])

    total_lectures = len(all_lecture_ids)

    watched_docs = await db.lecture_progress.find({
        "user_id": student_id,
        "lecture_id": {"$in": all_lecture_ids},
    }).to_list(500)
    watched_count = len(watched_docs)

    exam_results = await db.exam_results.find({
        "student_id": student_id,
        "exam_id": {"$in": [
            str(e["_id"]) async for e in db.exams.find({"course_id": course_id})
        ]},
    }).to_list(200)
    passed = sum(1 for r in exam_results if r.get("passed"))

    return {
        "watched": watched_count,
        "total_lectures": total_lectures,
        "percentage": round(watched_count / total_lectures * 100) if total_lectures else 0,
        "exam_stats": {
            "taken": len(exam_results),
            "passed": passed,
        },
    }


@router.get("/parent/{parent_phone}")
async def get_student_progress_for_parent(
    parent_phone: str,
    db=Depends(get_db)
):
    """ولي الأمر يشوف تقدم ابنه — بدون login"""
    student = await db.users.find_one({"parent_phone": parent_phone, "role": "student"})
    if not student:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="مفيش طالب مرتبط بالرقم ده")

    student_id = str(student["_id"])
    enrolled_ids = student.get("enrolled_courses", [])

    courses_progress = []
    for course_id in enrolled_ids:
        # جيب محاضرات الكورس
        units = await db.units.find({"course_id": course_id}).to_list(100)
        all_lecture_ids = []
        for unit in units:
            lectures = await db.lectures.find({"unit_id": str(unit["_id"])}).to_list(100)
            all_lecture_ids.extend([str(l["_id"]) for l in lectures])

        total = len(all_lecture_ids)
        watched_docs = await db.lecture_progress.find({
            "user_id": student_id,
            "lecture_id": {"$in": all_lecture_ids},
        }).to_list(500)
        watched = len(watched_docs)

        exam_results = await db.exam_results.find({
            "student_id": student_id,
            "exam_id": {"$in": [
                str(e["_id"]) async for e in db.exams.find({"course_id": course_id})
            ]},
        }).to_list(200)

        # جيب اسم الكورس
        from bson import ObjectId as BsonOID
        course_doc = await db.courses.find_one({"_id": BsonOID(course_id)}) if BsonOID.is_valid(course_id) else None

        courses_progress.append({
            "course_id": course_id,
            "course_title": course_doc["title"] if course_doc else course_id,
            "watched": watched,
            "total_lectures": total,
            "percentage": round(watched / total * 100) if total else 0,
            "exam_stats": {
                "taken": len(exam_results),
                "passed": sum(1 for r in exam_results if r.get("passed")),
            },
        })

    return {
        "student": {
            "id": student_id,
            "first_name": student["first_name"],
            "last_name": student["last_name"],
            "grade": student.get("grade"),
            "governorate": student.get("governorate"),
        },
        "courses_progress": courses_progress,
    }