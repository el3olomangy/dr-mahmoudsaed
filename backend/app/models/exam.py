from bson import ObjectId
from datetime import datetime, timezone


def exam_doc(data, questions_docs: list) -> dict:
    scheduled_at = None
    if getattr(data, "scheduled_at", None):
        try:
            scheduled_at = datetime.fromisoformat(data.scheduled_at.replace("Z", "+00:00"))
        except Exception:
            scheduled_at = None
    return {
        "title": data.title,
        "lecture_id": data.lecture_id,
        "course_id": data.course_id,
        "duration_minutes": data.duration_minutes,
        "pass_score": data.pass_score,
        "show_result_immediately": data.show_result_immediately,
        "scheduled_at": scheduled_at,
        "questions": questions_docs,
        "is_published": True,
        "created_at": datetime.now(timezone.utc),
    }


def question_doc(q) -> dict:
    return {
        "_id": ObjectId(),
        "text": q.text,
        "question_type": q.question_type,
        "choices": [{"text": c.text, "is_correct": c.is_correct} for c in (q.choices or [])],
        "correct_answer": q.correct_answer,
        "points": q.points,
    }