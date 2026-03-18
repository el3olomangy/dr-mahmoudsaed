from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime

class QuestionType(str, Enum):
    mcq = "mcq"
    essay = "essay"

class ChoiceCreate(BaseModel):
    text: str
    is_correct: bool = False

class QuestionCreate(BaseModel):
    text: str
    question_type: QuestionType = QuestionType.mcq
    choices: Optional[List[ChoiceCreate]] = None
    correct_answer: Optional[str] = None
    points: int = 1

class ExamCreate(BaseModel):
    title: str = Field(..., min_length=3)
    lecture_id: Optional[str] = None
    course_id: str
    duration_minutes: int = Field(default=30, ge=5)
    pass_score: int = Field(default=50, ge=0, le=100)
    show_result_immediately: bool = True
    questions: List[QuestionCreate] = []

class AnswerSubmit(BaseModel):
    question_id: str
    selected_choice: Optional[str] = None
    essay_answer: Optional[str] = None

class ExamSubmit(BaseModel):
    exam_id: str
    answers: List[AnswerSubmit]

class ExamResult(BaseModel):
    exam_id: str
    student_id: str
    score: float
    passed: bool
    total_points: int
    earned_points: int
    submitted_at: datetime
    answers: List[dict] = []