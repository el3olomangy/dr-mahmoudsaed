from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime

class NotificationType(str, Enum):
    announcement = "announcement"
    new_lecture = "new_lecture"
    new_exam = "new_exam"
    exam_result = "exam_result"
    code_activated = "code_activated"
    subscription_expiry = "subscription_expiry"

class NotificationCreate(BaseModel):
    title: str = Field(..., min_length=2)
    body: str = Field(..., min_length=2)
    notification_type: NotificationType = NotificationType.announcement
    target_grade: Optional[str] = None
    target_user_id: Optional[str] = None

class NotificationResponse(BaseModel):
    id: str
    title: str
    body: str
    notification_type: NotificationType
    is_read: bool = False
    created_at: datetime