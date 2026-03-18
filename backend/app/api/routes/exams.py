from fastapi import APIRouter, HTTPException, Depends
from typing import List
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
    return [{"id": str(e["_id"]), "title": e["title"], "duration_minutes": e["duration_minutes"]} for e in exams]


@router.get("/results/{exam_id}")
async def get_exam_results(exam_id: str, current_user=Depends(get_current_teacher), db=Depends(get_db)):
    results = await db.exam_results.find({"exam_id": exam_id}).to_list(500)
    return [{
        "student_id": r["student_id"],
        "score": r["score"],
        "passed": r["passed"],
        "submitted_at": r["submitted_at"],
    } for r in results]


@router.get("/my-result/{exam_id}")
async def get_my_result(exam_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    result = await db.exam_results.find_one({
        "exam_id": exam_id,
        "student_id": str(current_user["_id"])
    })
    if not result:
        raise HTTPException(status_code=404, detail="معملتش الاختبار ده")
    return {
        "score": result["score"],
        "passed": result["passed"],
        "earned_points": result["earned_points"],
        "total_points": result["total_points"],
        "submitted_at": result["submitted_at"],
    }


# ====== /{exam_id} الأخير دايمًا ======

@router.get("/{exam_id}")
async def get_exam(exam_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    oid = validate_object_id(exam_id)
    exam = await db.exams.find_one({"_id": oid})
    if not exam:
        raise HTTPException(status_code=404, detail="الاختبار مش موجود")
    return {
        "id": str(exam["_id"]),
        "title": exam["title"],
        "duration_minutes": exam["duration_minutes"],
        "questions": [question_helper(q) for q in exam.get("questions", [])],
    }