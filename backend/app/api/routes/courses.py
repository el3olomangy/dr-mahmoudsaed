from fastapi import APIRouter, HTTPException, Depends
from typing import List
from bson import ObjectId
from ...core.database import get_db
from ...core.dependencies import get_current_user, get_current_teacher
from ...schemas.course import (
    CourseCreate, CourseResponse, CourseListItem,
    UnitCreate, UnitResponse, LectureCreate, LectureResponse
)

router = APIRouter(prefix="/courses", tags=["Courses"])

def course_helper(course, enrolled_ids=[], is_enrolled=False) -> dict:
    return {
        "id": str(course["_id"]),
        "title": course["title"],
        "description": course.get("description"),
        "grade": course["grade"],
        "price": course.get("price"),
        "thumbnail": course.get("thumbnail"),
        "lectures_count": course.get("lectures_count", 0),
        "is_enrolled": str(course["_id"]) in enrolled_ids or is_enrolled,
    }

# ====== الكورسات ======

@router.get("/", response_model=List[CourseListItem])
async def get_courses(current_user=Depends(get_current_user), db=Depends(get_db)):
    enrolled = [str(c) for c in current_user.get("enrolled_courses", [])]
    courses = await db.courses.find().to_list(100)
    return [course_helper(c, enrolled) for c in courses]

@router.get("/{course_id}", response_model=CourseResponse)
async def get_course(course_id: str, current_user=Depends(get_current_user), db=Depends(get_db)):
    course = await db.courses.find_one({"_id": ObjectId(course_id)})
    if not course:
        raise HTTPException(status_code=404, detail="الكورس مش موجود")

    enrolled = [str(c) for c in current_user.get("enrolled_courses", [])]
    is_enrolled = course_id in enrolled

    units_raw = await db.units.find({"course_id": course_id}).sort("order", 1).to_list(100)
    units = []
    for unit in units_raw:
        lectures_raw = await db.lectures.find({"unit_id": str(unit["_id"])}).sort("order", 1).to_list(100)
        lectures = []
        for lec in lectures_raw:
            lectures.append(LectureResponse(
                id=str(lec["_id"]),
                title=lec["title"],
                description=lec.get("description"),
                video_url=lec.get("video_url") if is_enrolled else None,
                pdf_url=lec.get("pdf_url") if is_enrolled else None,
                order=lec["order"],
                lecture_type=lec["lecture_type"],
                duration_minutes=lec.get("duration_minutes"),
                is_enrolled=is_enrolled,
            ))
        units.append(UnitResponse(
            id=str(unit["_id"]),
            title=unit["title"],
            order=unit["order"],
            lectures=lectures,
        ))

    return CourseResponse(
        id=str(course["_id"]),
        title=course["title"],
        description=course.get("description"),
        grade=course["grade"],
        price=course.get("price"),
        thumbnail=course.get("thumbnail"),
        units=units,
        is_enrolled=is_enrolled,
    )

@router.post("/", response_model=CourseListItem, status_code=201)
async def create_course(data: CourseCreate, current_user=Depends(get_current_teacher), db=Depends(get_db)):
    course_doc = {
        "title": data.title,
        "description": data.description,
        "grade": data.grade,
        "price": data.price,
        "thumbnail": data.thumbnail,
        "lectures_count": 0,
        "is_active": True,
    }
    result = await db.courses.insert_one(course_doc)
    course_doc["_id"] = result.inserted_id
    return course_helper(course_doc)

@router.put("/{course_id}", response_model=CourseListItem)
async def update_course(course_id: str, data: CourseCreate, current_user=Depends(get_current_teacher), db=Depends(get_db)):
    course = await db.courses.find_one({"_id": ObjectId(course_id)})
    if not course:
        raise HTTPException(status_code=404, detail="الكورس مش موجود")
    await db.courses.update_one(
        {"_id": ObjectId(course_id)},
        {"$set": data.model_dump(exclude_none=True)}
    )
    updated = await db.courses.find_one({"_id": ObjectId(course_id)})
    return course_helper(updated)

@router.delete("/{course_id}")
async def delete_course(course_id: str, current_user=Depends(get_current_teacher), db=Depends(get_db)):
    course = await db.courses.find_one({"_id": ObjectId(course_id)})
    if not course:
        raise HTTPException(status_code=404, detail="الكورس مش موجود")
    await db.courses.delete_one({"_id": ObjectId(course_id)})
    return {"message": "تم حذف الكورس"}

# ====== الوحدات ======

@router.post("/{course_id}/units", response_model=UnitResponse, status_code=201)
async def create_unit(course_id: str, data: UnitCreate, current_user=Depends(get_current_teacher), db=Depends(get_db)):
    course = await db.courses.find_one({"_id": ObjectId(course_id)})
    if not course:
        raise HTTPException(status_code=404, detail="الكورس مش موجود")
    unit_doc = {"title": data.title, "order": data.order, "course_id": course_id}
    result = await db.units.insert_one(unit_doc)
    return UnitResponse(id=str(result.inserted_id), title=data.title, order=data.order)

# ====== المحاضرات ======

@router.post("/{course_id}/units/{unit_id}/lectures", response_model=LectureResponse, status_code=201)
async def create_lecture(course_id: str, unit_id: str, data: LectureCreate, current_user=Depends(get_current_teacher), db=Depends(get_db)):
    unit = await db.units.find_one({"_id": ObjectId(unit_id)})
    if not unit:
        raise HTTPException(status_code=404, detail="الوحدة مش موجودة")
    lecture_doc = {
        "title": data.title,
        "description": data.description,
        "video_url": data.video_url,
        "pdf_url": data.pdf_url,
        "order": data.order,
        "lecture_type": data.lecture_type,
        "duration_minutes": data.duration_minutes,
        "unit_id": unit_id,
        "course_id": course_id,
    }
    result = await db.lectures.insert_one(lecture_doc)
    await db.courses.update_one({"_id": ObjectId(course_id)}, {"$inc": {"lectures_count": 1}})
    return LectureResponse(
        id=str(result.inserted_id),
        title=data.title,
        description=data.description,
        video_url=data.video_url,
        pdf_url=data.pdf_url,
        order=data.order,
        lecture_type=data.lecture_type,
        duration_minutes=data.duration_minutes,
    )