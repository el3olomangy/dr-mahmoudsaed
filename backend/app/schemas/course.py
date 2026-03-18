from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum

class LectureType(str, Enum):
    free = "free"
    paid = "paid"

class CourseCreate(BaseModel):
    title: str = Field(..., min_length=3)
    description: Optional[str] = None
    grade: str
    price: Optional[float] = None
    thumbnail: Optional[str] = None

class UnitCreate(BaseModel):
    title: str = Field(..., min_length=2)
    order: int = 1

class LectureCreate(BaseModel):
    title: str = Field(..., min_length=2)
    description: Optional[str] = None
    video_url: str
    pdf_url: Optional[str] = None
    order: int = 1
    lecture_type: LectureType = LectureType.paid
    duration_minutes: Optional[int] = None

class LectureResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    video_url: Optional[str] = None
    pdf_url: Optional[str] = None
    order: int
    lecture_type: LectureType
    duration_minutes: Optional[int] = None
    is_enrolled: bool = False

class UnitResponse(BaseModel):
    id: str
    title: str
    order: int
    lectures: List[LectureResponse] = []

class CourseResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    grade: str
    price: Optional[float] = None
    thumbnail: Optional[str] = None
    units: List[UnitResponse] = []
    is_enrolled: bool = False

class CourseListItem(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    grade: str
    price: Optional[float] = None
    thumbnail: Optional[str] = None
    lectures_count: int = 0
    is_enrolled: bool = False