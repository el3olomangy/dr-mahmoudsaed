"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { examsAPI } from "@/lib/api";

interface Choice {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  question_type: "mcq" | "essay";
  choices: Choice[];
  points: number;
}

interface Exam {
  id: string;
  title: string;
  duration_minutes: number;
  is_homework: boolean;
  questions: Question[];
}

interface EssayReview {
  question_text: string;
  essay_answer: string;
  earned_points: number;
  max_points: number;
  teacher_comment: string;
}

interface MCQReview {
  question_id: string;
  question_text: string;
  points: number;
  selected_choice: string | null;
  selected_text: string | null;
  correct_text: string | null;
  is_correct: boolean;
  choices: { id: string; text: string; is_correct: boolean }[];
}

interface ExamResult {
  score: number;
  passed: boolean;
  earned_points: number;
  total_points: number;
  submitted_at: string;
  essay_fully_reviewed?: boolean;
  essay_reviews?: EssayReview[];
  mcq_reviews?: MCQReview[];
  answers?: any[];
}

type ExamState =
  | "loading"
  | "error"
  | "already_done"
  | "intro"
  | "taking"
  | "submitting"
  | "result";

type Answers = Record<string, string>;

function ChoicesList({ q }: { q: MCQReview }) {
  return (
    <div className="space-y-1.5">
      {q.choices.map((c, ci) => {
        const isCorrect = !!(q.correct_text && c.text === q.correct_text);
        const isSelected = !!(q.selected_text && c.text === q.selected_text);
        const isWrong = isSelected && !isCorrect;
        return (
          <div
            key={ci}
            className="flex items-center gap-2 p-2 rounded-lg text-sm"
            style={{
              backgroundColor: isCorrect
                ? "#dcfce7"
                : isWrong
                  ? "#fee2e2"
                  : "transparent",
              opacity: !isCorrect && !isWrong ? 0.5 : 1,
            }}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{
                backgroundColor: isCorrect
                  ? "#22c55e"
                  : isWrong
                    ? "#ef4444"
                    : undefined,
                color: isCorrect || isWrong ? "white" : undefined,
              }}
            >
              {isCorrect ? "✓" : isWrong ? "✗" : ""}
            </span>
            <span
              className={
                isCorrect
                  ? "text-green-800 dark:text-green-200"
                  : isWrong
                    ? "text-red-800 dark:text-red-200"
                    : "text-muted-foreground"
              }
            >
              {c.text}
            </span>
            {isCorrect && !q.is_correct && (
              <span className="text-xs text-green-600 dark:text-green-400 mr-auto font-bold">
                الإجابة الصح
              </span>
            )}
            {isWrong && (
              <span className="text-xs text-red-600 dark:text-red-400 mr-auto">
                إجابتك
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: examId } = use(params);

  const [examState, setExamState] = useState<ExamState>("loading");
  const [exam, setExam] = useState<Exam | null>(null);
  const [previousResult, setPreviousResult] = useState<ExamResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        const data = (await examsAPI.getOne(examId)) as Exam;
        setExam(data);
        if (!data.is_homework) {
          setTimeLeft(data.duration_minutes * 60);
        }
        try {
          const prevResult = (await examsAPI.getMyResult(examId)) as ExamResult;
          setPreviousResult(prevResult);
          setExamState("already_done");
        } catch {
          setExamState("intro");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "حصل خطأ في تحميل الاختبار");
        setExamState("error");
      }
    };
    fetchExam();
  }, [examId]);

  useEffect(() => {
    if (examState !== "taking") return;
    if (exam?.is_homework) return;
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [examState, exam]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!exam) return;
    setExamState("submitting");
    const answersPayload = exam.questions.map((q) => {
      const val = answers[q.id];
      if (q.question_type === "mcq") {
        return {
          question_id: q.id,
          selected_choice: val || null,
          essay_answer: null,
        };
      } else {
        return {
          question_id: q.id,
          selected_choice: null,
          essay_answer: val || null,
        };
      }
    });
    try {
      const res: any = await examsAPI.submit({
        exam_id: examId,
        answers: answersPayload,
      });
      if (res.score !== undefined) {
        try {
          const fullResult = (await examsAPI.getMyResult(examId)) as ExamResult;
          setResult(fullResult);
        } catch {
          setResult({
            score: res.score,
            passed: res.passed,
            earned_points: res.earned_points,
            total_points: res.total_points,
            submitted_at: new Date().toISOString(),
          });
        }
        setExamState("result");
      } else {
        setResult(null);
        setExamState("result");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "حصل خطأ في تسليم الاختبار");
      setExamState("error");
    }
  };

  if (examState === "loading") {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-5 w-32" />
        <Card>
          <CardContent className="p-8 space-y-4">
            <Skeleton className="h-8 w-1/2 mx-auto" />
            <Skeleton className="h-4 w-1/3 mx-auto" />
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Skeleton className="h-20 rounded-xl" />
              <Skeleton className="h-20 rounded-xl" />
            </div>
            <Skeleton className="h-12 w-full rounded-xl mt-4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (examState === "error") {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">حصل خطأ</h2>
        <p className="text-muted-foreground mb-6">{errorMsg}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/courses">
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للكورسات
          </Link>
        </Button>
      </div>
    );
  }

  if (examState === "already_done" && previousResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${previousResult.passed ? "bg-chart-3/10" : "bg-destructive/10"}`}
            >
              {previousResult.passed ? (
                <CheckCircle className="w-10 h-10 text-chart-3" />
              ) : (
                <XCircle className="w-10 h-10 text-destructive" />
              )}
            </div>
            <CardTitle className="text-2xl font-extrabold">
              {exam?.title}
            </CardTitle>
            <p className="text-muted-foreground mt-1">
              {exam?.is_homework
                ? "سلّمت الواجب ده قبل كده"
                : "عملت الاختبار ده قبل كده"}
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-6 pb-8">
            <div className="text-6xl font-extrabold text-primary">
              {Math.round(previousResult.score)}%
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-chart-3/10 rounded-xl">
                <p className="text-2xl font-bold text-chart-3">
                  {previousResult.earned_points}
                </p>
                <p className="text-sm text-muted-foreground">درجاتك</p>
              </div>
              <div className="p-4 bg-muted rounded-xl">
                <p className="text-2xl font-bold text-foreground">
                  {previousResult.total_points}
                </p>
                <p className="text-sm text-muted-foreground">إجمالي الدرجات</p>
              </div>
            </div>
            <div
              className={`p-4 rounded-xl font-bold text-lg ${previousResult.passed ? "bg-chart-3/10 text-chart-3" : "bg-destructive/10 text-destructive"}`}
            >
              {previousResult.passed ? "ناجح ✓" : "لم تنجح"}
            </div>
            {previousResult.essay_fully_reviewed &&
              previousResult.essay_reviews &&
              previousResult.essay_reviews.length > 0 && (
                <div className="text-right space-y-3">
                  <h3 className="font-bold text-sm text-foreground">
                    تصحيح الأسئلة المقالية:
                  </h3>
                  {previousResult.essay_reviews.map((rev, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-border bg-muted/30 space-y-2"
                    >
                      <p className="font-bold text-sm">
                        {i + 1}. {rev.question_text}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        إجابتك:{" "}
                        <span className="text-foreground">
                          {rev.essay_answer || "لم تجب"}
                        </span>
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary">
                          {rev.earned_points} / {rev.max_points} درجة
                        </span>
                        {rev.teacher_comment && (
                          <span className="text-xs text-muted-foreground italic">
                            "{rev.teacher_comment}"
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            {!previousResult.essay_fully_reviewed && (
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl text-sm text-orange-700 dark:text-orange-400 text-center">
                الأسئلة المقالية لسه في انتظار تصحيح المدرس
              </div>
            )}
            {previousResult.mcq_reviews &&
              previousResult.mcq_reviews.length > 0 && (
                <>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setShowReview((v) => !v)}
                  >
                    {showReview ? "إخفاء" : "مراجعة"} الإجابات (
                    {previousResult.mcq_reviews.length} سؤال)
                  </Button>
                  {showReview && (
                    <div className="text-right space-y-3">
                      {previousResult.mcq_reviews.map((q, idx) => (
                        <div
                          key={q.question_id}
                          className={`p-4 rounded-xl border ${q.is_correct ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20" : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <p className="font-bold text-sm text-foreground">
                              {idx + 1}. {q.question_text}
                            </p>
                            <span
                              className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${q.is_correct ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200" : "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200"}`}
                            >
                              {q.is_correct ? "✓ صح" : "✗ غلط"}
                            </span>
                          </div>
                          <ChoicesList q={q} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/courses">
                <ArrowRight className="w-4 h-4 ml-2" />
                العودة للكورسات
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (examState === "intro" && exam) {
    const mcqCount = exam.questions.filter(
      (q) => q.question_type === "mcq",
    ).length;
    const essayCount = exam.questions.filter(
      (q) => q.question_type === "essay",
    ).length;
    const isHomework = exam.is_homework;
    return (
      <div className="max-w-2xl mx-auto">
        <Link
          href="/dashboard/courses"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للكورسات</span>
        </Link>
        <Card>
          <CardHeader className="text-center">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isHomework ? "bg-blue-500/10" : "bg-chart-4/10"}`}
            >
              {isHomework ? (
                <FileText className="w-8 h-8 text-blue-500" />
              ) : (
                <Clock className="w-8 h-8 text-chart-4" />
              )}
            </div>
            <CardTitle className="text-2xl font-extrabold">
              {exam.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6 pb-8">
            <div
              className={`grid gap-4 ${isHomework ? "grid-cols-1" : "grid-cols-2"}`}
            >
              <div className="p-4 bg-muted rounded-xl">
                <p className="text-2xl font-bold text-foreground">
                  {exam.questions.length}
                </p>
                <p className="text-sm text-muted-foreground">عدد الأسئلة</p>
              </div>
              {!isHomework && (
                <div className="p-4 bg-muted rounded-xl">
                  <p className="text-2xl font-bold text-foreground">
                    {exam.duration_minutes} دقيقة
                  </p>
                  <p className="text-sm text-muted-foreground">مدة الاختبار</p>
                </div>
              )}
            </div>
            <div
              className={`p-4 border rounded-xl text-right space-y-1 ${isHomework ? "bg-blue-500/10 border-blue-500/30" : "bg-chart-4/10 border-chart-4/30"}`}
            >
              <h3 className="font-bold text-foreground mb-2">تعليمات مهمة:</h3>
              {mcqCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  - {mcqCount} سؤال اختيار من متعدد
                </p>
              )}
              {essayCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  - {essayCount} سؤال مقالي
                </p>
              )}
              {!isHomework && (
                <>
                  <p className="text-sm text-muted-foreground">
                    - الوقت بيتحسب من لما تضغط ابدأ
                  </p>
                  <p className="text-sm text-muted-foreground">
                    - لو الوقت خلص هيتسلم تلقائياً
                  </p>
                </>
              )}
              <p className="text-sm text-muted-foreground">
                - {isHomework ? "الواجب" : "الاختبار"} مرة واحدة بس
              </p>
            </div>
            <Button
              onClick={() => setExamState("taking")}
              className="w-full font-bold py-6"
              style={{
                backgroundColor: isHomework ? "#3b82f6" : "#f59e0b",
                color: "white",
              }}
            >
              {isHomework ? "ابدأ الواجب" : "ابدأ الاختبار"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (examState === "result") {
    if (result) {
      return (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.passed ? "bg-chart-3/10" : "bg-destructive/10"}`}
              >
                {result.passed ? (
                  <CheckCircle className="w-10 h-10 text-chart-3" />
                ) : (
                  <XCircle className="w-10 h-10 text-destructive" />
                )}
              </div>
              <CardTitle className="text-2xl font-extrabold">
                {result.passed ? "أحسنت!" : "حاول تذاكر أكتر"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6 pb-8">
              <div className="text-6xl font-extrabold text-primary">
                {Math.round(result.score)}%
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-xl">
                  <p className="text-xl font-bold text-foreground">
                    {exam?.questions.length}
                  </p>
                  <p className="text-xs text-muted-foreground">أسئلة</p>
                </div>
                <div className="p-4 bg-chart-3/10 rounded-xl">
                  <p className="text-xl font-bold text-chart-3">
                    {result.earned_points}
                  </p>
                  <p className="text-xs text-muted-foreground">درجاتك</p>
                </div>
                <div className="p-4 bg-muted rounded-xl">
                  <p className="text-xl font-bold text-foreground">
                    {result.total_points}
                  </p>
                  <p className="text-xs text-muted-foreground">الإجمالي</p>
                </div>
              </div>
              {exam && (
                <Button
                  onClick={() => setShowReview(!showReview)}
                  variant="outline"
                  className="w-full"
                >
                  {showReview ? "إخفاء" : "مراجعة"} الإجابات
                </Button>
              )}
              {showReview &&
                result?.mcq_reviews &&
                result.mcq_reviews.length > 0 && (
                  <div className="text-right space-y-3">
                    {result.mcq_reviews.map((q, idx) => (
                      <div
                        key={q.question_id}
                        className={`p-4 rounded-xl border ${q.is_correct ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20" : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <p className="font-bold text-sm text-foreground">
                            {idx + 1}. {q.question_text}
                          </p>
                          <span
                            className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full ${q.is_correct ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-200" : "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-200"}`}
                          >
                            {q.is_correct ? "✓ صح" : "✗ غلط"}
                          </span>
                        </div>
                        <ChoicesList q={q} />
                      </div>
                    ))}
                  </div>
                )}
              <Button
                asChild
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Link href="/dashboard/courses">العودة للكورسات</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <CheckCircle className="w-16 h-16 text-chart-3 mx-auto mb-4" />
        <h2 className="text-2xl font-extrabold mb-2">
          {exam?.is_homework ? "تم تسليم الواجب!" : "تم تسليم الاختبار!"}
        </h2>
        <p className="text-muted-foreground mb-8">
          النتيجة هتظهر بعد مراجعة المدرس
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard/courses">
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للكورسات
          </Link>
        </Button>
      </div>
    );
  }

  if (!exam) return null;
  const question = exam.questions[currentQuestion];
  const answeredCount = Object.keys(answers).length;
  const isHomework = exam.is_homework;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4 mb-6 -mx-4 lg:-mx-8 px-4 lg:px-8">
        <div className="flex items-center justify-between">
          {!isHomework ? (
            <div className="flex items-center gap-2">
              <Clock
                className={`w-5 h-5 ${timeLeft < 60 ? "text-destructive animate-pulse" : "text-chart-4"}`}
              />
              <span
                className={`font-mono font-bold text-lg ${timeLeft < 60 ? "text-destructive" : ""}`}
              >
                {formatTime(timeLeft)}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <span className="font-bold text-sm text-blue-500">واجب</span>
            </div>
          )}
          <span className="text-sm text-muted-foreground">
            {answeredCount} / {exam.questions.length} سؤال
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {exam.questions.map((q, index) => (
          <button
            key={q.id}
            onClick={() => setCurrentQuestion(index)}
            className={`w-10 h-10 rounded-lg font-bold text-sm transition-colors ${
              currentQuestion === index
                ? "bg-primary text-primary-foreground"
                : answers[q.id]
                  ? "bg-chart-3 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              السؤال {currentQuestion + 1} من {exam.questions.length}
            </span>
            <span className="text-xs px-2 py-1 bg-muted rounded-full">
              {question.question_type === "mcq" ? "اختيار من متعدد" : "مقالي"}
            </span>
          </div>
          <CardTitle className="text-lg font-bold mt-2">
            {question.text}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {question.question_type === "mcq" && question.choices.length > 0 && (
            <RadioGroup
              value={answers[question.id] || ""}
              onValueChange={(val) => handleAnswer(question.id, val)}
              className="space-y-3"
            >
              {question.choices.map((choice) => (
                <div key={choice.id} className="flex items-center">
                  <RadioGroupItem
                    value={choice.id}
                    id={`choice-${choice.id}`}
                    className="ml-3"
                  />
                  <Label
                    htmlFor={`choice-${choice.id}`}
                    className="flex-1 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    {choice.text}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
          {question.question_type === "essay" && (
            <Textarea
              placeholder="اكتب إجابتك هنا..."
              value={answers[question.id] || ""}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
              className="min-h-40"
            />
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion((prev) => prev - 1)}
        >
          <ChevronRight className="w-4 h-4 ml-2" />
          السابق
        </Button>
        {currentQuestion < exam.questions.length - 1 ? (
          <Button
            onClick={() => setCurrentQuestion((prev) => prev + 1)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            التالي
            <ChevronLeft className="w-4 h-4 mr-2" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={examState === "submitting"}
            className="bg-chart-3 hover:bg-chart-3/90 text-white"
          >
            {examState === "submitting"
              ? "جاري التسليم..."
              : isHomework
                ? "سلّم الواجب"
                : "إنهاء الاختبار"}
          </Button>
        )}
      </div>
    </div>
  );
}
