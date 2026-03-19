"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Save,
  AlertCircle,
} from "lucide-react";
import { examsAPI, coursesAPI } from "@/lib/api";

// ====== Types ======

interface EssayAnswer {
  question_id: string;
  question_text: string;
  max_points: number;
  essay_answer: string;
  earned_points: number | null;
  teacher_comment: string | null;
  reviewed: boolean;
}

interface Submission {
  result_id: string;
  student_id: string;
  student_name: string;
  score: number;
  passed: boolean;
  submitted_at: string;
  essay_fully_reviewed: boolean;
  essay_answers: EssayAnswer[];
}

interface ReviewData {
  exam_id: string;
  title: string;
  submissions: Submission[];
}

interface ExamItem {
  id: string;
  title: string;
}

interface Course {
  id: string;
  title: string;
}

// ====== Component ======

export default function EssayReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examIdFromUrl = searchParams.get("exam");

  const [courses, setCourses] = useState<Course[]>([]);
  const [examsByCourse, setExamsByCourse] = useState<
    Record<string, ExamItem[]>
  >({});
  const [selectedExamId, setSelectedExamId] = useState(examIdFromUrl || "");

  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // drafts: result_id -> question_id -> { points, comment }
  const [drafts, setDrafts] = useState<
    Record<string, Record<string, { points: string; comment: string }>>
  >({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // جيب الكورسات والاختبارات
  useEffect(() => {
    const load = async () => {
      const cs = (await coursesAPI.getAll()) as Course[];
      setCourses(cs);
      const map: Record<string, ExamItem[]> = {};
      await Promise.all(
        cs.map(async (c) => {
          try {
            const exams = (await examsAPI.getByCourse(c.id)) as ExamItem[];
            if (exams.length) map[c.id] = exams;
          } catch {}
        }),
      );
      setExamsByCourse(map);
    };
    load().catch(() => {});
  }, []);

  // لما يتغير الاختبار — جيب بيانات المراجعة
  useEffect(() => {
    if (!selectedExamId) {
      setReviewData(null);
      return;
    }
    setLoading(true);
    setError("");
    examsAPI
      .getForReview(selectedExamId)
      .then((d: any) => {
        setReviewData(d);
        // افتح أول طالب تلقائياً
        if (d.submissions.length > 0) {
          setExpandedIds(new Set([d.submissions[0].result_id]));
        }
        // ابني الـ drafts من الإجابات الموجودة
        const initDrafts: typeof drafts = {};
        d.submissions.forEach((s: Submission) => {
          initDrafts[s.result_id] = {};
          s.essay_answers.forEach((a) => {
            initDrafts[s.result_id][a.question_id] = {
              points: a.earned_points !== null ? String(a.earned_points) : "",
              comment: a.teacher_comment || "",
            };
          });
        });
        setDrafts(initDrafts);
      })
      .catch((e: any) => setError(e.message || "حصل خطأ"))
      .finally(() => setLoading(false));
  }, [selectedExamId]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const updateDraft = (
    resultId: string,
    qId: string,
    field: "points" | "comment",
    val: string,
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [resultId]: {
        ...prev[resultId],
        [qId]: { ...prev[resultId]?.[qId], [field]: val },
      },
    }));
  };

  const handleSave = async (submission: Submission) => {
    const studentDrafts = drafts[submission.result_id] || {};
    const grades = submission.essay_answers.map((a) => ({
      question_id: a.question_id,
      earned_points: parseInt(studentDrafts[a.question_id]?.points || "0") || 0,
      teacher_comment: studentDrafts[a.question_id]?.comment || "",
    }));

    setSavingId(submission.result_id);
    try {
      await examsAPI.submitReview({ result_id: submission.result_id, grades });
      setSavedIds((prev) => new Set([...prev, submission.result_id]));
      // حدّث الـ local state
      setReviewData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          submissions: prev.submissions.map((s) =>
            s.result_id === submission.result_id
              ? { ...s, essay_fully_reviewed: true }
              : s,
          ),
        };
      });
    } catch (e: any) {
      setError(e.message || "حصل خطأ في الحفظ");
    } finally {
      setSavingId(null);
    }
  };

  const reviewed =
    reviewData?.submissions.filter((s) => s.essay_fully_reviewed).length || 0;
  const total = reviewData?.submissions.length || 0;

  // ====== Render ======

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-20" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">
            تصحيح المقالي
          </h1>
          {reviewData && (
            <p className="text-muted-foreground text-sm mt-0.5">
              {reviewData.title} — {reviewed}/{total} تم تصحيحهم
            </p>
          )}
        </div>
      </div>

      {/* اختيار الاختبار */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <Label>اختر الاختبار</Label>
          {courses.map((course) => {
            const exams = examsByCourse[course.id];
            if (!exams?.length) return null;
            return (
              <div key={course.id}>
                <p className="text-xs font-bold text-muted-foreground mb-1">
                  {course.title}
                </p>
                <div className="flex flex-wrap gap-2">
                  {exams.map((exam) => (
                    <button
                      key={exam.id}
                      onClick={() => setSelectedExamId(exam.id)}
                      className={`text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                        selectedExamId === exam.id
                          ? "border-primary bg-primary/10 text-primary font-bold"
                          : "border-border hover:border-primary/40 text-foreground"
                      }`}
                    >
                      {exam.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      )}

      {/* مفيش اختبار مختار */}
      {!loading && !reviewData && !error && !selectedExamId && (
        <div className="text-center py-12 text-muted-foreground">
          اختر اختبار من فوق عشان تبدأ التصحيح
        </div>
      )}

      {/* مفيش أسئلة مقالية */}
      {!loading && reviewData && reviewData.submissions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            مفيش إجابات مقالية في الاختبار ده
          </CardContent>
        </Card>
      )}

      {/* قائمة الطلاب */}
      {!loading &&
        reviewData &&
        reviewData.submissions.map((submission) => {
          const expanded = expandedIds.has(submission.result_id);
          const isSaving = savingId === submission.result_id;
          const isSaved =
            savedIds.has(submission.result_id) ||
            submission.essay_fully_reviewed;
          const studentDrafts = drafts[submission.result_id] || {};

          return (
            <Card
              key={submission.result_id}
              className={isSaved ? "border-green-500/40" : ""}
            >
              {/* Student Header */}
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => toggleExpand(submission.result_id)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      isSaved ? "bg-green-500/10" : "bg-muted"
                    }`}
                  >
                    {isSaved ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">
                      {submission.student_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(submission.submitted_at).toLocaleDateString(
                          "ar-EG",
                        )}
                      </span>
                      {isSaved && (
                        <span className="text-xs font-bold text-green-600">
                          تم التصحيح
                        </span>
                      )}
                      {!isSaved && (
                        <span className="text-xs text-orange-500 font-bold">
                          لم يصحح
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-muted-foreground">
                    {submission.essay_answers.length} سؤال مقالي
                  </span>
                  {expanded ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Answers */}
              {expanded && (
                <CardContent className="pt-0 space-y-5">
                  <div className="border-t border-border" />

                  {submission.essay_answers.map((ans, i) => {
                    const draft = studentDrafts[ans.question_id] || {
                      points: "",
                      comment: "",
                    };
                    return (
                      <div key={ans.question_id} className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-bold text-sm text-foreground">
                            {i + 1}. {ans.question_text}
                          </p>
                          <span className="text-xs text-muted-foreground shrink-0 bg-muted px-2 py-0.5 rounded-full">
                            {ans.max_points} درجة
                          </span>
                        </div>

                        {/* إجابة الطالب */}
                        <div className="bg-muted/40 rounded-xl p-3">
                          <p className="text-xs text-muted-foreground mb-1">
                            إجابة الطالب:
                          </p>
                          <p className="text-sm text-foreground leading-relaxed">
                            {ans.essay_answer || (
                              <span className="italic text-muted-foreground">
                                لم يجب
                              </span>
                            )}
                          </p>
                        </div>

                        {/* التصحيح */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">
                              الدرجة (من {ans.max_points})
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              max={ans.max_points}
                              value={draft.points}
                              onChange={(e) =>
                                updateDraft(
                                  submission.result_id,
                                  ans.question_id,
                                  "points",
                                  e.target.value,
                                )
                              }
                              className="h-9 text-sm"
                              placeholder="0"
                            />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <Label className="text-xs">تعليق (اختياري)</Label>
                            <Textarea
                              value={draft.comment}
                              onChange={(e) =>
                                updateDraft(
                                  submission.result_id,
                                  ans.question_id,
                                  "comment",
                                  e.target.value,
                                )
                              }
                              placeholder="أحسنت... / راجع..."
                              rows={1}
                              className="text-sm resize-none"
                            />
                          </div>
                        </div>

                        {i < submission.essay_answers.length - 1 && (
                          <div className="border-t border-border/50" />
                        )}
                      </div>
                    );
                  })}

                  {/* Save Button */}
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => handleSave(submission)}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      "جاري الحفظ..."
                    ) : isSaved ? (
                      <>
                        <CheckCircle className="w-4 h-4 ml-2" />
                        تم التصحيح — تعديل
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 ml-2" />
                        حفظ التصحيح
                      </>
                    )}
                  </Button>
                </CardContent>
              )}
            </Card>
          );
        })}
    </div>
  );
}
