from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel
from bson import ObjectId
from bson.errors import InvalidId
from datetime import datetime, timezone
from ...core.database import get_db
from ...core.dependencies import get_current_user, get_current_teacher
from ...schemas.exam import ExamCreate, ExamSubmit, ExamResult
from ...models.exam import exam_doc as build_exam_doc, question_doc as build_question_doc

router = APIRouter(prefix="/exams", tags=["Exams"])


def validate_object_id(id_str: str) -> ObjectId:
    try:
        return ObjectId(id_str)
    except (InvalidId, Exception):
        raise HTTPException(status_code=422, detail="ID غير صالح")


def question_helper(q) -> dict:
    return {
        "id": str(q["_id"]),
        "text": q["text"],
        "question_type": q["question_type"],
        "choices": [{"id": str(i), "text": c["text"]} for i, c in enumerate(q.get("choices", []))],
        "points": q["points"],
    }


@router.post("/", status_code=201)
async def create_exam(data: ExamCreate, current_user=Depends(get_current_teacher), db=Depends(get_db)):
    questions_docs = [build_question_doc(q) for q in data.questions]
    doc = build_exam_doc(data, questions_docs)
    result = await db.exams.insert_one(doc)
    return {"id": str(result.inserted_id), "message": "تم إنشاء الاختبار"}


# ====== routes الثابتة أولًا — قبل /{exam_id} ======

@router.post("/submit", response_model=dict)
async def submit_exam(data: ExamSubmit, current_user=Depends(get_current_user), db=Depends(get_db)):
    exam = await db.exams.find_one({"_id": validate_object_id(data.exam_id)})
    if not exam:
        raise HTTPException(status_code=404, detail="الاختبار مش موجود")

    existing = await db.exam_results.find_one({
        "exam_id": data.exam_id,
        "student_id": str(current_user["_id"])
    })
    if existing:
        raise HTTPException(status_code=400, detail="عملت الاختبار ده قبل كده")

    total_points = sum(q["points"] for q in exam["questions"])
    earned_points = 0
    answers_log = []
    questions_map = {str(q["_id"]): q for q in exam["questions"]}

    for answer in data.answers:
        q = questions_map.get(answer.question_id)
        if not q:
            continue
        is_correct = False
        if q["question_type"] == "mcq" and q.get("choices"):
            for i, choice in enumerate(q["choices"]):
                if str(i) == answer.selected_choice and choice["is_correct"]:
                    is_correct = True
                    earned_points += q["points"]
                    break
        answers_log.append({
            "question_id": answer.question_id,
            "selected_choice": answer.selected_choice,
            "essay_answer": answer.essay_answer,
            "is_correct": is_correct,
        })

    score = (earned_points / total_points * 100) if total_points > 0 else 0
    passed = score >= exam["pass_score"]

    result_doc = {
        "exam_id": data.exam_id,
        "student_id": str(current_user["_id"]),
        "score": score,
        "passed": passed,
        "total_points": total_points,
        "earned_points": earned_points,
        "submitted_at": datetime.now(timezone.utc),
        "answers": answers_log,
        "essay_fully_reviewed": False,
    }
    await db.exam_results.insert_one(result_doc)

    if exam.get("show_result_immediately"):
        return {
            "message": "تم تسليم الاختبار",
            "score": round(score, 2),
            "passed": passed,
            "earned_points": earned_points,
            "total_points": total_points,
        }
    return {"message": "تم تسليم الاختبار — النتيجة هتظهر بعدين"}


@router.get("/course/{course_id}")
async def get_course_exams(course_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    exams = await db.exams.find({"course_id": course_id}).to_list(100)
    return [{
        "id": str(e["_id"]),
        "title": e["title"],
        "duration_minutes": e["duration_minutes"],
        "lecture_id": e.get("lecture_id"),
        "pass_score": e.get("pass_score", 50),
        "scheduled_at": e.get("scheduled_at"),
    } for e in exams]


@router.get("/results/{exam_id}")
async def get_exam_results(exam_id: str, current_user=Depends(get_current_teacher), db=Depends(get_db)):
    results = await db.exam_results.find({"exam_id": exam_id}).to_list(500)
    return [{
        "student_id": r["student_id"],
        "score": r["score"],
        "passed": r["passed"],
        "submitted_at": r["submitted_at"],
    } for r in results]


# ====== Essay Review ======

@router.get("/review/{exam_id}")
async def get_exam_for_review(exam_id: str, current_user=Depends(get_current_teacher), db=Depends(get_db)):
    """جيب الاختبار مع كل إجابات الطلاب المقالية"""
    oid = validate_object_id(exam_id)
    exam = await db.exams.find_one({"_id": oid})
    if not exam:
        raise HTTPException(status_code=404, detail="الاختبار مش موجود")

    essay_questions = {
        str(q["_id"]): q for q in exam["questions"]
        if q["question_type"] == "essay"
    }
    if not essay_questions:
        return {"exam_id": exam_id, "title": exam["title"], "submissions": []}

    results = await db.exam_results.find({"exam_id": exam_id}).to_list(500)

    submissions = []
    for r in results:
        student = await db.users.find_one({"_id": ObjectId(r["student_id"])})
        student_name = f"{student['first_name']} {student['last_name']}" if student else "غير معروف"

        essay_answers = []
        for ans in r.get("answers", []):
            q = essay_questions.get(ans["question_id"])
            if not q:
                continue
            essay_answers.append({
                "question_id": ans["question_id"],
                "question_text": q["text"],
                "max_points": q["points"],
                "essay_answer": ans.get("essay_answer") or "",
                "earned_points": ans.get("essay_earned_points"),
                "teacher_comment": ans.get("teacher_comment"),
                "reviewed": ans.get("essay_reviewed", False),
            })

        if essay_answers:
            submissions.append({
                "result_id": str(r["_id"]),
                "student_id": r["student_id"],
                "student_name": student_name,
                "score": r["score"],
                "passed": r["passed"],
                "submitted_at": r["submitted_at"],
                "essay_fully_reviewed": r.get("essay_fully_reviewed", False),
                "essay_answers": essay_answers,
            })

    return {"exam_id": exam_id, "title": exam["title"], "submissions": submissions}


class EssayGrade(BaseModel):
    question_id: str
    earned_points: int
    teacher_comment: str = ""


class ReviewSubmit(BaseModel):
    result_id: str
    grades: List[EssayGrade]


@router.post("/review")
async def submit_essay_review(data: ReviewSubmit, current_user=Depends(get_current_teacher), db=Depends(get_db)):
    """المدرس يسلم تصحيح الأسئلة المقالية"""
    result = await db.exam_results.find_one({"_id": ObjectId(data.result_id)})
    if not result:
        raise HTTPException(status_code=404, detail="نتيجة الطالب مش موجودة")

    exam = await db.exams.find_one({"_id": validate_object_id(result["exam_id"])})
    if not exam:
        raise HTTPException(status_code=404, detail="الاختبار مش موجود")

    questions_map = {str(q["_id"]): q for q in exam["questions"]}
    grades_map = {g.question_id: g for g in data.grades}

    updated_answers = []
    essay_earned = 0
    for ans in result["answers"]:
        q = questions_map.get(ans["question_id"])
        if q and q["question_type"] == "essay" and ans["question_id"] in grades_map:
            grade = grades_map[ans["question_id"]]
            pts = max(0, min(grade.earned_points, q["points"]))
            ans = {
                **ans,
                "essay_earned_points": pts,
                "teacher_comment": grade.teacher_comment,
                "essay_reviewed": True,
            }
            essay_earned += pts
        updated_answers.append(ans)

    # أعد احتساب الدرجة: MCQ ثابتة + مقالي جديد
    old_essay_earned = sum(
        a.get("essay_earned_points", 0)
        for a in result["answers"]
        if questions_map.get(a["question_id"], {}).get("question_type") == "essay"
        and a.get("essay_reviewed")
    )
    mcq_earned = result["earned_points"] - old_essay_earned
    new_earned = mcq_earned + essay_earned
    total = result["total_points"]
    new_score = (new_earned / total * 100) if total > 0 else 0
    new_passed = new_score >= exam["pass_score"]

    await db.exam_results.update_one(
        {"_id": ObjectId(data.result_id)},
        {"$set": {
            "answers": updated_answers,
            "earned_points": new_earned,
            "score": new_score,
            "passed": new_passed,
            "essay_fully_reviewed": True,
            "reviewed_at": datetime.now(timezone.utc),
            "reviewed_by": str(current_user["_id"]),
        }}
    )

    # إشعار للطالب إن التصحيح اتعمل
    await db.notifications.insert_one({
        "title": f"تم تصحيح اختبار: {exam['title']}",
        "body": f"درجتك النهائية: {round(new_score)}% — {'ناجح \u2713' if new_passed else 'لم تنجح'}. ادخل الاختبار عشان تشوف التفاصيل.",
        "notification_type": "exam_reviewed",
        "target_user_id": result["student_id"],
        "target_grade": None,
        "read_by": [],
        "created_at": datetime.now(timezone.utc),
    })

    return {
        "message": "تم حفظ التصحيح",
        "new_score": round(new_score, 2),
        "new_passed": new_passed,
        "earned_points": new_earned,
    }


@router.get("/my-result/{exam_id}")
async def get_my_result(exam_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    result = await db.exam_results.find_one({
        "exam_id": exam_id,
        "student_id": str(current_user["_id"])
    })
    if not result:
        raise HTTPException(status_code=404, detail="معملتش الاختبار ده")

    questions_map = {}
    exam = await db.exams.find_one({"_id": validate_object_id(exam_id)})
    if exam:
        questions_map = {str(q["_id"]): q for q in exam["questions"]}

    # ضيف تصحيح المقالي للطالب
    essay_reviews = []
    for ans in result.get("answers", []):
        q = questions_map.get(ans["question_id"])
        if q and q["question_type"] == "essay" and ans.get("essay_reviewed"):
            essay_reviews.append({
                "question_text": q["text"],
                "essay_answer": ans.get("essay_answer", ""),
                "earned_points": ans.get("essay_earned_points", 0),
                "max_points": q["points"],
                "teacher_comment": ans.get("teacher_comment", ""),
            })

    return {
        "score": result["score"],
        "passed": result["passed"],
        "earned_points": result["earned_points"],
        "total_points": result["total_points"],
        "submitted_at": result["submitted_at"],
        "essay_fully_reviewed": result.get("essay_fully_reviewed", False),
        "essay_reviews": essay_reviews,
    }


# ====== تعديل وحذف الاختبار ======

@router.delete("/{exam_id}")
async def delete_exam(exam_id: str, current_user=Depends(get_current_teacher), db=Depends(get_db)):
    oid = validate_object_id(exam_id)
    exam = await db.exams.find_one({"_id": oid})
    if not exam:
        raise HTTPException(status_code=404, detail="الاختبار مش موجود")
    await db.exams.delete_one({"_id": oid})
    await db.exam_results.delete_many({"exam_id": exam_id})
    return {"message": "تم حذف الاختبار"}


class ExamUpdate(BaseModel):
    title: Optional[str] = None
    duration_minutes: Optional[int] = None
    pass_score: Optional[int] = None
    show_result_immediately: Optional[bool] = None
    scheduled_at: Optional[str] = None


class QuestionUpdate(BaseModel):
    text: str
    question_type: str = "mcq"
    choices: List[dict] = []
    correct_answer: Optional[str] = None
    points: int = 1


class ExamFullUpdate(BaseModel):
    title: Optional[str] = None
    duration_minutes: Optional[int] = None
    pass_score: Optional[int] = None
    show_result_immediately: Optional[bool] = None
    scheduled_at: Optional[str] = None
    questions: Optional[List[QuestionUpdate]] = None


@router.patch("/{exam_id}")
async def update_exam(exam_id: str, data: ExamUpdate, current_user=Depends(get_current_teacher), db=Depends(get_db)):
    oid = validate_object_id(exam_id)
    exam = await db.exams.find_one({"_id": oid})
    if not exam:
        raise HTTPException(status_code=404, detail="الاختبار مش موجود")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="مفيش بيانات للتحديث")
    if "scheduled_at" in update_data:
        if update_data["scheduled_at"]:
            update_data["scheduled_at"] = datetime.fromisoformat(update_data["scheduled_at"].replace("Z", "+00:00"))
        else:
            update_data["scheduled_at"] = None
    await db.exams.update_one({"_id": oid}, {"$set": update_data})
    return {"message": "تم تحديث الاختبار"}


@router.put("/{exam_id}")
async def full_update_exam(exam_id: str, data: ExamFullUpdate, current_user=Depends(get_current_teacher), db=Depends(get_db)):
    oid = validate_object_id(exam_id)
    exam = await db.exams.find_one({"_id": oid})
    if not exam:
        raise HTTPException(status_code=404, detail="الاختبار مش موجود")

    update_data = {}
    if data.title is not None: update_data["title"] = data.title
    if data.duration_minutes is not None: update_data["duration_minutes"] = data.duration_minutes
    if data.pass_score is not None: update_data["pass_score"] = data.pass_score
    if data.show_result_immediately is not None: update_data["show_result_immediately"] = data.show_result_immediately

    if data.scheduled_at is not None:
        if data.scheduled_at == "":
            update_data["scheduled_at"] = None
        else:
            update_data["scheduled_at"] = datetime.fromisoformat(data.scheduled_at.replace("Z", "+00:00"))

    questions_changed = False
    if data.questions is not None:
        questions_docs = []
        for q in data.questions:
            choices = [{"text": c.get("text", ""), "is_correct": c.get("is_correct", False)} for c in q.choices]
            questions_docs.append({
                "_id": ObjectId(),
                "text": q.text,
                "question_type": q.question_type,
                "choices": choices,
                "correct_answer": q.correct_answer,
                "points": q.points,
            })
        update_data["questions"] = questions_docs
        questions_changed = True

    if not update_data:
        raise HTTPException(status_code=400, detail="مفيش بيانات للتحديث")

    await db.exams.update_one({"_id": oid}, {"$set": update_data})

    # لو الأسئلة اتغيرت — امسح نتايج الطلاب القديمة عشان يعيدوا الاختبار
    deleted_results = 0
    if questions_changed:
        result = await db.exam_results.delete_many({"exam_id": exam_id})
        deleted_results = result.deleted_count

    updated = await db.exams.find_one({"_id": oid})
    response = {
        "id": str(updated["_id"]),
        "title": updated["title"],
        "duration_minutes": updated["duration_minutes"],
        "pass_score": updated["pass_score"],
        "show_result_immediately": updated.get("show_result_immediately", True),
        "scheduled_at": updated.get("scheduled_at"),
        "questions": [{
            "id": str(q["_id"]),
            "text": q["text"],
            "question_type": q["question_type"],
            "choices": [{"text": c["text"], "is_correct": c["is_correct"]} for c in q.get("choices", [])],
            "points": q["points"],
        } for q in updated.get("questions", [])],
        "deleted_results": deleted_results,
        "message": f"تم التحديث{'، وتم مسح ' + str(deleted_results) + ' نتيجة للطلاب' if deleted_results > 0 else ''}",
    }
    return response


@router.get("/admin/{exam_id}")
async def get_exam_for_admin(exam_id: str, current_user=Depends(get_current_teacher), db=Depends(get_db)):
    oid = validate_object_id(exam_id)
    exam = await db.exams.find_one({"_id": oid})
    if not exam:
        raise HTTPException(status_code=404, detail="الاختبار مش موجود")
    return {
        "id": str(exam["_id"]),
        "title": exam["title"],
        "duration_minutes": exam["duration_minutes"],
        "pass_score": exam.get("pass_score", 50),
        "show_result_immediately": exam.get("show_result_immediately", True),
        "scheduled_at": exam.get("scheduled_at"),
        "questions": [{
            "id": str(q["_id"]),
            "text": q["text"],
            "question_type": q["question_type"],
            "choices": [{"text": c["text"], "is_correct": c["is_correct"]} for c in q.get("choices", [])],
            "points": q["points"],
        } for q in exam.get("questions", [])],
    }


# ====== /{exam_id} الأخير دايمًا ======

@router.get("/{exam_id}")
async def get_exam(exam_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    oid = validate_object_id(exam_id)
    exam = await db.exams.find_one({"_id": oid})
    if not exam:
        raise HTTPException(status_code=404, detail="الاختبار مش موجود")

    scheduled_at = exam.get("scheduled_at")
    if scheduled_at:
        now = datetime.now(timezone.utc)
        scheduled = scheduled_at if scheduled_at.tzinfo else scheduled_at.replace(tzinfo=timezone.utc)
        if now < scheduled:
            raise HTTPException(
                status_code=403,
                detail="الاختبار لسه معدتش ساعته — استنى لحد وقت النزول"
            )

    return {
        "id": str(exam["_id"]),
        "title": exam["title"],
        "duration_minutes": exam["duration_minutes"],
        "scheduled_at": exam.get("scheduled_at"),
        "questions": [question_helper(q) for q in exam.get("questions", [])],
    }