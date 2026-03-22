from fastapi import APIRouter, HTTPException, Depends
from typing import List
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone
from ...core.database import get_db
from ...core.dependencies import get_current_user, get_current_teacher, get_current_teacher_or_assistant
from ...schemas.assignment import AssignmentCreate, AssignmentSubmit, AssignmentGrade
from ...models.assignment import assignment_doc, submission_doc

router = APIRouter(prefix="/assignments", tags=["Assignments"])


def validate_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, Exception):
        raise HTTPException(status_code=422, detail="ID غير صالح")


def assignment_helper(a: dict) -> dict:
    return {
        "id": str(a["_id"]),
        "title": a["title"],
        "description": a["description"],
        "lecture_id": a["lecture_id"],
        "course_id": a["course_id"],
        "deadline": a.get("deadline"),
        "is_published": a.get("is_published", True),
        "created_at": a.get("created_at"),
    }


def submission_helper(s: dict) -> dict:
    return {
        "id": str(s["_id"]),
        "assignment_id": s["assignment_id"],
        "student_id": s["student_id"],
        "text_answer": s.get("text_answer"),
        "grade": s.get("grade"),
        "teacher_note": s.get("teacher_note"),
        "submitted_at": s.get("submitted_at"),
    }


# ====== إنشاء واجب (المدرس فقط) ======

@router.post("/", status_code=201)
async def create_assignment(
    data: AssignmentCreate,
    current_user=Depends(get_current_teacher),
    db=Depends(get_db)
):
    doc = assignment_doc(data)
    result = await db.assignments.insert_one(doc)
    return {"id": str(result.inserted_id), "message": "تم إنشاء الواجب"}


# ====== جيب واجبات محاضرة معينة ======

@router.get("/lecture/{lecture_id}")
async def get_assignments_by_lecture(
    lecture_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    assignments = await db.assignments.find(
        {"lecture_id": lecture_id, "is_published": True}
    ).to_list(50)
    return [assignment_helper(a) for a in assignments]


# ====== جيب واجبات كورس معين ======

@router.get("/course/{course_id}")
async def get_assignments_by_course(
    course_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    assignments = await db.assignments.find(
        {"course_id": course_id, "is_published": True}
    ).to_list(200)
    return [assignment_helper(a) for a in assignments]


# ====== جيب واجب واحد بالـ ID ======

@router.get("/single/{assignment_id}")
async def get_assignment_by_id(
    assignment_id: str,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    oid = validate_object_id(assignment_id)
    assignment = await db.assignments.find_one({"_id": oid})
    if not assignment:
        raise HTTPException(status_code=404, detail="الواجب مش موجود")
    return assignment_helper(assignment)


# ====== تسليم واجب (الطالب) ======

@router.post("/submit")
async def submit_assignment(
    data: AssignmentSubmit,
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    # تأكد إن الواجب موجود
    oid = validate_object_id(data.assignment_id)
    assignment = await db.assignments.find_one({"_id": oid})
    if not assignment:
        raise HTTPException(status_code=404, detail="الواجب مش موجود")

    student_id = str(current_user["_id"])

    # تأكد إنه مسلمش قبل كده
    existing = await db.assignment_submissions.find_one({
        "assignment_id": data.assignment_id,
        "student_id": student_id,
    })
    if existing:
        raise HTTPException(status_code=400, detail="سلّمت الواجب ده قبل كده")

    if not data.text_answer or not data.text_answer.strip():
        raise HTTPException(status_code=400, detail="لازم تكتب إجابة")

    doc = submission_doc(data.assignment_id, student_id, data.text_answer)
    result = await db.assignment_submissions.insert_one(doc)

    # سجّل النشاط
    try:
        student = await db.users.find_one({"_id": ObjectId(student_id)})
        if student:
            parent_phone = student.get("parent_phone")
            student_name = f"{student['first_name']} {student['last_name']}"
            assignment_title = assignment.get("title", "واجب")
            await db.activity_log.insert_one({
                "student_id": student_id,
                "student_name": student_name,
                "parent_phone": parent_phone,
                "activity_type": "assignment_submitted",
                "details": {
                    "assignment_id": data.assignment_id,
                    "assignment_title": assignment_title,
                    "message": f"سلّم واجب: {assignment_title}",
                },
                "created_at": datetime.now(timezone.utc),
            })
    except Exception:
        pass

    return {"id": str(result.inserted_id), "message": "تم تسليم الواجب بنجاح"}


# ====== جيب تسليمات واجب معين (المدرس/المساعد) ======

@router.get("/{assignment_id}/submissions")
async def get_submissions(
    assignment_id: str,
    current_user=Depends(get_current_teacher_or_assistant),
    db=Depends(get_db)
):
    validate_object_id(assignment_id)
    submissions = await db.assignment_submissions.find(
        {"assignment_id": assignment_id}
    ).to_list(1000)

    result = []
    for s in submissions:
        student = await db.users.find_one({"_id": ObjectId(s["student_id"])})
        item = submission_helper(s)
        item["student_name"] = f"{student['first_name']} {student['last_name']}" if student else "—"
        item["student_phone"] = student["phone"] if student else "—"
        result.append(item)

    return result


# ====== تصحيح واجب ووضع الدرجة (المدرس/المساعد) ======

@router.patch("/submissions/{submission_id}/grade")
async def grade_submission(
    submission_id: str,
    data: AssignmentGrade,
    current_user=Depends(get_current_teacher_or_assistant),
    db=Depends(get_db)
):
    oid = validate_object_id(submission_id)
    submission = await db.assignment_submissions.find_one({"_id": oid})
    if not submission:
        raise HTTPException(status_code=404, detail="التسليم مش موجود")

    await db.assignment_submissions.update_one(
        {"_id": oid},
        {"$set": {
            "grade": data.grade,
            "teacher_note": data.teacher_note,
            "graded_at": datetime.now(timezone.utc),
        }}
    )
    return {"message": "تم وضع الدرجة بنجاح"}


# ====== الطالب يشوف تسليماته ======

@router.get("/my-submissions")
async def get_my_submissions(
    current_user=Depends(get_current_user),
    db=Depends(get_db)
):
    student_id = str(current_user["_id"])
    submissions = await db.assignment_submissions.find(
        {"student_id": student_id}
    ).sort("submitted_at", -1).to_list(500)

    result = []
    for s in submissions:
        item = submission_helper(s)
        # جيب اسم الواجب
        if ObjectId.is_valid(s["assignment_id"]):
            assignment = await db.assignments.find_one(
                {"_id": ObjectId(s["assignment_id"])}
            )
            item["assignment_title"] = assignment["title"] if assignment else "—"
        result.append(item)

    return result


# ====== حذف واجب (المدرس فقط) ======

@router.delete("/{assignment_id}")
async def delete_assignment(
    assignment_id: str,
    current_user=Depends(get_current_teacher),
    db=Depends(get_db)
):
    oid = validate_object_id(assignment_id)
    assignment = await db.assignments.find_one({"_id": oid})
    if not assignment:
        raise HTTPException(status_code=404, detail="الواجب مش موجود")

    await db.assignments.delete_one({"_id": oid})
    # احذف تسليماته كمان
    await db.assignment_submissions.delete_many({"assignment_id": assignment_id})
    return {"message": "تم حذف الواجب وكل تسليماته"}