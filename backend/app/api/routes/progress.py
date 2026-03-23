from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from datetime import datetime, timezone
from bson import ObjectId
from ...core.database import get_db
from ...core.dependencies import get_current_user, get_current_teacher_or_assistant

from slowapi import Limiter  # type: ignore
from slowapi.util import get_remote_address  # type: ignore
router = APIRouter(prefix="/progress", tags=["Progress"])
limiter = Limiter(key_func=get_remote_address)


async def log_activity(db, student_id: str, activity_type: str, details: dict):
    """سجّل نشاط الطالب في activity_log"""
    try:
        # جيب اسم الطالب
        student = await db.users.find_one({"_id": ObjectId(student_id)})
        student_name = f"{student['first_name']} {student['last_name']}" if student else "طالب"
        parent_phone = student.get("parent_phone") if student else None

        await db.activity_log.insert_one({
            "student_id": student_id,
            "student_name": student_name,
            "parent_phone": parent_phone,
            "activity_type": activity_type,  # lecture_watched | exam_submitted | assignment_submitted | exam_graded | assignment_graded
            "details": details,
            "created_at": datetime.now(timezone.utc),
        })
    except Exception:
        pass  # النشاط اختياري — ما نوقفش الطلب لو فشل


class VideoPosition(BaseModel):
    position: float
    duration: float = 0


@router.post("/lecture/{lecture_id}/position")
async def save_video_position(
    lecture_id: str,
    data: VideoPosition,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    """حفظ آخر موقف وصله الطالب في الفيديو"""
    user_id = str(current_user["_id"])
    was_watched_before = False
    existing = await db.lecture_progress.find_one({"user_id": user_id, "lecture_id": lecture_id})
    if existing:
        was_watched_before = existing.get("watched", False)

    watched = data.duration > 0 and data.position >= 120
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

    # سجّل النشاط لو الطالب خلّص المحاضرة لأول مرة
    if watched and not was_watched_before:
        lecture = await db.lectures.find_one({"_id": ObjectId(lecture_id)}) if ObjectId.is_valid(lecture_id) else None
        lecture_title = lecture.get("title", "محاضرة") if lecture else "محاضرة"
        await log_activity(db, user_id, "lecture_watched", {
            "lecture_id": lecture_id,
            "lecture_title": lecture_title,
            "message": f"أتم مشاهدة محاضرة: {lecture_title}",
        })

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

    # إحصائيات الاختبارات — نفرّق بين الاختبارات والواجبات
    all_exams = await db.exams.find({"course_id": course_id}).to_list(200)
    all_exam_ids = [str(e["_id"]) for e in all_exams]
    exam_ids_only = [str(e["_id"]) for e in all_exams if not e.get("is_homework", False)]

    exam_results = await db.exam_results.find({
        "student_id": user_id,
        "exam_id": {"$in": all_exam_ids},
    }).to_list(200)

    # الاختبارات العادية فقط (بدون الواجبات)
    exams_only_results = [
        r for r in exam_results if r["exam_id"] in exam_ids_only
    ]
    passed = sum(1 for r in exams_only_results if r.get("passed"))

    return {
        "watched": watched_count,
        "total_lectures": total_lectures,
        "percentage": round(watched_count / total_lectures * 100) if total_lectures else 0,
        "watched_ids": watched_ids,
        "exam_stats": {
            "taken": len(exams_only_results),
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

    exam_results_all_exams = await db.exams.find({"course_id": course_id}).to_list(200)
    all_exam_ids_s = [str(e["_id"]) for e in exam_results_all_exams]
    exam_ids_only_s = [str(e["_id"]) for e in exam_results_all_exams if not e.get("is_homework", False)]

    exam_results = await db.exam_results.find({
        "student_id": student_id,
        "exam_id": {"$in": all_exam_ids_s},
    }).to_list(200)
    exams_only = [r for r in exam_results if r["exam_id"] in exam_ids_only_s]
    passed = sum(1 for r in exams_only if r.get("passed"))

    return {
        "watched": watched_count,
        "total_lectures": total_lectures,
        "percentage": round(watched_count / total_lectures * 100) if total_lectures else 0,
        "exam_stats": {
            "taken": len(exams_only),
            "passed": passed,
        },
    }


@router.get("/parent/{parent_phone}")
@limiter.limit("10/minute")
async def get_student_progress_for_parent(
    request: Request,
    parent_phone: str,
    db=Depends(get_db)
):
    """ولي الأمر يشوف تقدم أبناءه — بدون login"""
    from bson import ObjectId as BsonOID

    # جيب كل الطلاب المرتبطين بالرقم ده
    students = await db.users.find(
        {"parent_phone": parent_phone, "role": "student"}
    ).to_list(20)

    if not students:
        raise HTTPException(status_code=404, detail="مفيش طالب مرتبط بالرقم ده")

    async def build_student_data(student: dict) -> dict:
        student_id = str(student["_id"])
        enrolled_ids = student.get("enrolled_courses", [])

        courses_progress = []
        for course_id in enrolled_ids:
            course_doc = await db.courses.find_one(
                {"_id": BsonOID(course_id)}
            ) if BsonOID.is_valid(course_id) else None

            units = await db.units.find(
                {"course_id": course_id}
            ).sort("order", 1).to_list(100)

            units_data = []
            all_lecture_ids = []

            for unit in units:
                unit_id = str(unit["_id"])
                lectures = await db.lectures.find(
                    {"unit_id": unit_id}
                ).sort("order", 1).to_list(100)

                lectures_data = []
                for lec in lectures:
                    lec_id = str(lec["_id"])
                    all_lecture_ids.append(lec_id)
                    lec_progress = await db.lecture_progress.find_one({
                        "user_id": student_id,
                        "lecture_id": lec_id,
                    })
                    lectures_data.append({
                        "id": lec_id,
                        "title": lec.get("title", ""),
                        "order": lec.get("order", 0),
                        "watched": lec_progress.get("watched", False) if lec_progress else False,
                        "last_position": lec_progress.get("last_position", 0) if lec_progress else 0,
                        "duration": lec_progress.get("duration", 0) if lec_progress else 0,
                    })

                units_data.append({
                    "id": unit_id,
                    "title": unit.get("title", ""),
                    "order": unit.get("order", 0),
                    "lectures": lectures_data,
                })

            total = len(all_lecture_ids)
            watched_docs = await db.lecture_progress.find({
                "user_id": student_id,
                "lecture_id": {"$in": all_lecture_ids},
                "watched": True,
            }).to_list(500)
            watched = len(watched_docs)

            exams = await db.exams.find({"course_id": course_id}).to_list(100)
            exams_data = []
            for exam in exams:
                exam_id = str(exam["_id"])
                result = await db.exam_results.find_one({
                    "exam_id": exam_id,
                    "student_id": student_id,
                })
                exams_data.append({
                    "id": exam_id,
                    "title": exam.get("title", ""),
                    "is_homework": exam.get("is_homework", False),
                    "total_points": sum(q.get("points", 0) for q in exam.get("questions", [])),
                    "result": {
                        "score": result.get("score", 0),
                        "total": result.get("total_points", 0),
                        "percentage": round(
                            result["score"] / result["total_points"] * 100
                        ) if result and result.get("total_points") else 0,
                        "passed": result.get("passed", False),
                        "submitted_at": result.get("submitted_at"),
                    } if result else None,
                })

            assignments = await db.assignments.find({"course_id": course_id}).to_list(100)
            assignments_data = []
            for asgn in assignments:
                asgn_id = str(asgn["_id"])
                submission = await db.assignment_submissions.find_one({
                    "assignment_id": asgn_id,
                    "student_id": student_id,
                })
                assignments_data.append({
                    "id": asgn_id,
                    "title": asgn.get("title", ""),
                    "result": {
                        "grade": submission.get("grade"),
                        "teacher_note": submission.get("teacher_note"),
                        "submitted_at": submission.get("submitted_at"),
                    } if submission else None,
                })

            taken = sum(1 for e in exams_data if e["result"] is not None)
            passed = sum(1 for e in exams_data if e["result"] and e["result"]["passed"])

            courses_progress.append({
                "course_id": course_id,
                "course_title": course_doc["title"] if course_doc else course_id,
                "watched": watched,
                "total_lectures": total,
                "percentage": round(watched / total * 100) if total else 0,
                "units": units_data,
                "exams": exams_data,
                "assignments": assignments_data,
                "exam_stats": {"taken": taken, "passed": passed},
            })

        return {
            "id": student_id,
            "first_name": student["first_name"],
            "last_name": student["last_name"],
            "grade": student.get("grade"),
            "governorate": student.get("governorate"),
            "courses_progress": courses_progress,
        }

    # لو طالب واحد بس — رجّع نفس الشكل القديم للتوافق
    # لو أكتر — رجّع list
    students_data = []
    for s in students:
        students_data.append(await build_student_data(s))

    return {"students": students_data}


# ====== Activity Log لولي الأمر ======

@router.get("/parent/{parent_phone}/activity")
@limiter.limit("10/minute")
async def get_parent_activity(
    request: Request,
    parent_phone: str,
    db=Depends(get_db)
):
    """جيب آخر 50 نشاط لأبناء ولي الأمر"""
    students = await db.users.find(
        {"parent_phone": parent_phone, "role": "student"}
    ).to_list(20)

    if not students:
        raise HTTPException(status_code=404, detail="مفيش طالب مرتبط بالرقم ده")

    student_ids = [str(s["_id"]) for s in students]

    activities = await db.activity_log.find(
        {"student_id": {"$in": student_ids}}
    ).sort("created_at", -1).to_list(50)

    result = []
    for act in activities:
        result.append({
            "id": str(act["_id"]),
            "student_id": act["student_id"],
            "student_name": act.get("student_name", ""),
            "activity_type": act["activity_type"],
            "details": act.get("details", {}),
            "created_at": act["created_at"],
        })

    return {"activities": result}