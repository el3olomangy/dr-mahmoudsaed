"""
سكريبت لتصليح نتائج الاختبارات القديمة اللي اتحسبت غلط
شغّله مرة واحدة بعد رفع الـ exams.py الجديد:
  python fix_old_results.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os

MONGO_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DB_NAME", "el3olomangy")

async def fix():
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    results = await db.exam_results.find({}).to_list(10000)
    fixed = 0

    for r in results:
        exam = await db.exams.find_one({"_id": ObjectId(r["exam_id"])}) if ObjectId.is_valid(r["exam_id"]) else None
        if not exam:
            continue

        questions_map = {str(q["_id"]): q for q in exam.get("questions", [])}
        total_points = sum(q["points"] for q in exam.get("questions", []))

        new_answers = []
        earned = 0

        for ans in r.get("answers", []):
            q = questions_map.get(ans.get("question_id", ""))
            if not q:
                new_answers.append(ans)
                continue

            if q["question_type"] == "mcq":
                choices = q.get("choices", [])
                selected = ans.get("selected_choice")
                selected_text = ans.get("selected_text")
                is_correct = False
                pts = 0

                for i, c in enumerate(choices):
                    if str(i) == selected:
                        if not selected_text:
                            selected_text = c.get("text")
                        if c.get("is_correct"):
                            is_correct = True
                            pts = q["points"]
                        break

                earned += pts
                new_answers.append({
                    **ans,
                    "selected_text": selected_text,
                    "is_correct": is_correct,
                    "earned_points": pts,
                })
            else:
                # essay — اتركها زي ما هي
                new_answers.append(ans)

        score = (earned / total_points * 100) if total_points > 0 else 0
        passed = score >= exam.get("pass_score", 50)

        await db.exam_results.update_one(
            {"_id": r["_id"]},
            {"$set": {
                "answers": new_answers,
                "earned_points": earned,
                "total_points": total_points,
                "score": score,
                "passed": passed,
            }}
        )
        fixed += 1
        print(f"Fixed result {r['_id']} — score: {round(score)}%")

    print(f"\n✅ تم تصليح {fixed} نتيجة")
    client.close()

asyncio.run(fix())