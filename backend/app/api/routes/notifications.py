from fastapi import APIRouter, HTTPException, Depends
from typing import List
from bson import ObjectId
from datetime import datetime, timezone
from ...core.database import get_db
from ...core.dependencies import get_current_user, get_current_teacher
from ...schemas.notification import NotificationCreate, NotificationResponse, NotificationType

router = APIRouter(prefix="/notifications", tags=["Notifications"])

def notification_helper(n, user_id: str) -> dict:
    return {
        "id": str(n["_id"]),
        "title": n["title"],
        "body": n["body"],
        "notification_type": n["notification_type"],
        "is_read": user_id in n.get("read_by", []),
        "created_at": n["created_at"],
    }

@router.post("/", status_code=201)
async def create_notification(data: NotificationCreate, current_user=Depends(get_current_teacher), db=Depends(get_db)):
    notif_doc = {
        "title": data.title,
        "body": data.body,
        "notification_type": data.notification_type,
        "target_grade": data.target_grade,
        "target_user_id": data.target_user_id,
        "read_by": [],
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.notifications.insert_one(notif_doc)
    return {"id": str(result.inserted_id), "message": "تم إرسال الإشعار"}

@router.get("/", response_model=List[NotificationResponse])
async def get_my_notifications(current_user=Depends(get_current_user), db=Depends(get_db)):
    user_id = str(current_user["_id"])
    grade = current_user.get("grade")

    query = {
        "$or": [
            {"target_user_id": user_id},
            {"target_grade": grade},
            {"target_grade": None, "target_user_id": None},
        ]
    }

    notifications = await db.notifications.find(query).sort("created_at", -1).to_list(100)
    return [notification_helper(n, user_id) for n in notifications]

@router.patch("/{notification_id}/read")
async def mark_as_read(notification_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    user_id = str(current_user["_id"])
    await db.notifications.update_one(
        {"_id": ObjectId(notification_id)},
        {"$addToSet": {"read_by": user_id}}
    )
    return {"message": "تم تحديد الإشعار كمقروء"}

@router.patch("/read-all")
async def mark_all_read(current_user=Depends(get_current_user), db=Depends(get_db)):
    user_id = str(current_user["_id"])
    grade = current_user.get("grade")
    query = {
        "$or": [
            {"target_user_id": user_id},
            {"target_grade": grade},
            {"target_grade": None, "target_user_id": None},
        ]
    }
    await db.notifications.update_many(
        query,
        {"$addToSet": {"read_by": user_id}}
    )
    return {"message": "تم تحديد كل الإشعارات كمقروءة"}

@router.get("/unread-count")
async def get_unread_count(current_user=Depends(get_current_user), db=Depends(get_db)):
    user_id = str(current_user["_id"])
    grade = current_user.get("grade")
    query = {
        "read_by": {"$nin": [user_id]},
        "$or": [
            {"target_user_id": user_id},
            {"target_grade": grade},
            {"target_grade": None, "target_user_id": None},
        ]
    }
    count = await db.notifications.count_documents(query)
    return {"unread_count": count}