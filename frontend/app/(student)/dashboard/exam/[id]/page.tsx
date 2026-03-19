"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { examsAPI } from "@/lib/api"

interface Choice {
  id: string
  text: string
}

interface Question {
  id: string
  text: string
  question_type: "mcq" | "essay"
  choices: Choice[]
  points: number
}

interface Exam {
  id: string
  title: string
  duration_minutes: number
  questions: Question[]
}

interface ExamResult {
  score: number
  passed: boolean
  earned_points: number
  total_points: number
  submitted_at: string
}

type ExamState = "loading" | "error" | "already_done" | "intro" | "taking" | "submitting" | "result"

// إجابات الطالب: question_id -> choice_id أو نص مقالي
type Answers = Record<string, string>

export default function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = use(params)

  const [examState, setExamState] = useState<ExamState>("loading")
  const [exam, setExam] = useState<Exam | null>(null)
  const [previousResult, setPreviousResult] = useState<ExamResult | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [timeLeft, setTimeLeft] = useState(0)
  const [result, setResult] = useState<ExamResult | null>(null)
  const [showReview, setShowReview] = useState(false)

  // تحميل الاختبار + التحقق من نتيجة سابقة
  useEffect(() => {
    const fetchExam = async () => {
      try {
        // جيب بيانات الاختبار
        const data = await examsAPI.getOne(examId) as Exam
        setExam(data)
        setTimeLeft(data.duration_minutes * 60)

        // تحقق لو الطالب عمل الاختبار ده قبل كده
        try {
          const prevResult = await examsAPI.getMyResult(examId) as ExamResult
          setPreviousResult(prevResult)
          setExamState("already_done")
        } catch {
          // مش عملوش قبل كده — طبيعي
          setExamState("intro")
        }
      } catch (err: any) {
        setErrorMsg(err.message || "حصل خطأ في تحميل الاختبار")
        setExamState("error")
      }
    }
    fetchExam()
  }, [examId])

  // تايمر
  useEffect(() => {
    if (examState !== "taking") return
    if (timeLeft <= 0) {
      handleSubmit()
      return
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [examState])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0")
    const s = (seconds % 60).toString().padStart(2, "0")
    return `${m}:${s}`
  }

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = async () => {
    if (!exam) return
    setExamState("submitting")

    // بناء الـ answers بالشكل اللي بيتوقعه الـ API
    const answersPayload = exam.questions.map(q => {
      const val = answers[q.id]
      if (q.question_type === "mcq") {
        return { question_id: q.id, selected_choice: val || null, essay_answer: null }
      } else {
        return { question_id: q.id, selected_choice: null, essay_answer: val || null }
      }
    })

    try {
      const res: any = await examsAPI.submit({ exam_id: examId, answers: answersPayload })

      // لو النتيجة فورية
      if (res.score !== undefined) {
        setResult({
          score: res.score,
          passed: res.passed,
          earned_points: res.earned_points,
          total_points: res.total_points,
          submitted_at: new Date().toISOString(),
        })
        setExamState("result")
      } else {
        // النتيجة هتظهر بعدين
        setResult(null)
        setExamState("result")
      }
    } catch (err: any) {
      setErrorMsg(err.message || "حصل خطأ في تسليم الاختبار")
      setExamState("error")
    }
  }

  // ====== Loading ======
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
    )
  }

  // ====== Error ======
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
    )
  }

  // ====== Already Done ======
  if (examState === "already_done" && previousResult) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${previousResult.passed ? "bg-chart-3/10" : "bg-destructive/10"}`}>
              {previousResult.passed
                ? <CheckCircle className="w-10 h-10 text-chart-3" />
                : <XCircle className="w-10 h-10 text-destructive" />}
            </div>
            <CardTitle className="text-2xl font-extrabold">
              {exam?.title}
            </CardTitle>
            <p className="text-muted-foreground mt-1">عملت الاختبار ده قبل كده</p>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="text-6xl font-extrabold text-primary">
              {Math.round(previousResult.score)}%
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-chart-3/10 rounded-xl">
                <p className="text-2xl font-bold text-chart-3">{previousResult.earned_points}</p>
                <p className="text-sm text-muted-foreground">درجاتك</p>
              </div>
              <div className="p-4 bg-muted rounded-xl">
                <p className="text-2xl font-bold text-foreground">{previousResult.total_points}</p>
                <p className="text-sm text-muted-foreground">إجمالي الدرجات</p>
              </div>
            </div>
            <div className={`p-4 rounded-xl font-bold text-lg ${previousResult.passed ? "bg-chart-3/10 text-chart-3" : "bg-destructive/10 text-destructive"}`}>
              {previousResult.passed ? "ناجح ✓" : "لم تنجح"}
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/courses">
                <ArrowRight className="w-4 h-4 ml-2" />
                العودة للكورسات
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ====== Intro ======
  if (examState === "intro" && exam) {
    const mcqCount = exam.questions.filter(q => q.question_type === "mcq").length
    const essayCount = exam.questions.filter(q => q.question_type === "essay").length
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
            <div className="w-16 h-16 bg-chart-4/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-chart-4" />
            </div>
            <CardTitle className="text-2xl font-extrabold">{exam.title}</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-xl">
                <p className="text-2xl font-bold text-foreground">{exam.questions.length}</p>
                <p className="text-sm text-muted-foreground">عدد الأسئلة</p>
              </div>
              <div className="p-4 bg-muted rounded-xl">
                <p className="text-2xl font-bold text-foreground">{exam.duration_minutes} دقيقة</p>
                <p className="text-sm text-muted-foreground">مدة الاختبار</p>
              </div>
            </div>

            <div className="p-4 bg-chart-4/10 border border-chart-4/30 rounded-xl text-right space-y-1">
              <h3 className="font-bold text-foreground mb-2">تعليمات مهمة:</h3>
              {mcqCount > 0 && <p className="text-sm text-muted-foreground">- {mcqCount} سؤال اختيار من متعدد</p>}
              {essayCount > 0 && <p className="text-sm text-muted-foreground">- {essayCount} سؤال مقالي</p>}
              <p className="text-sm text-muted-foreground">- الوقت بيتحسب من لما تضغط ابدأ</p>
              <p className="text-sm text-muted-foreground">- لو الوقت خلص هيتسلم تلقائياً</p>
              <p className="text-sm text-muted-foreground">- الاختبار مرة واحدة بس</p>
            </div>

            <Button
              onClick={() => setExamState("taking")}
              className="w-full bg-chart-4 hover:bg-chart-4/90 text-white font-bold py-6"
            >
              ابدأ الاختبار
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ====== Result ======
  if (examState === "result") {
    // النتيجة الفورية
    if (result) {
      return (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${result.passed ? "bg-chart-3/10" : "bg-destructive/10"}`}>
                {result.passed
                  ? <CheckCircle className="w-10 h-10 text-chart-3" />
                  : <XCircle className="w-10 h-10 text-destructive" />}
              </div>
              <CardTitle className="text-2xl font-extrabold">
                {result.passed ? "أحسنت!" : "حاول تذاكر أكتر"}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="text-6xl font-extrabold text-primary">{Math.round(result.score)}%</div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-xl">
                  <p className="text-xl font-bold text-foreground">{exam?.questions.length}</p>
                  <p className="text-xs text-muted-foreground">أسئلة</p>
                </div>
                <div className="p-4 bg-chart-3/10 rounded-xl">
                  <p className="text-xl font-bold text-chart-3">{result.earned_points}</p>
                  <p className="text-xs text-muted-foreground">درجاتك</p>
                </div>
                <div className="p-4 bg-muted rounded-xl">
                  <p className="text-xl font-bold text-foreground">{result.total_points}</p>
                  <p className="text-xs text-muted-foreground">الإجمالي</p>
                </div>
              </div>

              {/* مراجعة إجابات MCQ */}
              {exam && (
                <Button
                  onClick={() => setShowReview(!showReview)}
                  variant="outline"
                  className="w-full"
                >
                  {showReview ? "إخفاء" : "مراجعة"} الإجابات
                </Button>
              )}

              {showReview && exam && (
                <div className="text-right space-y-3">
                  {exam.questions.map((q, idx) => {
                    if (q.question_type !== "mcq") return null
                    const selectedChoiceId = answers[q.id]
                    const selectedChoice = q.choices.find(c => c.id === selectedChoiceId)
                    return (
                      <div key={q.id} className="p-4 rounded-xl border border-border bg-muted/30">
                        <p className="font-bold mb-2 text-sm">{idx + 1}. {q.text}</p>
                        <p className="text-sm text-muted-foreground">
                          إجابتك: <span className="text-foreground">{selectedChoice?.text || "لم تجب"}</span>
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}

              <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="/dashboard/courses">العودة للكورسات</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    // النتيجة مش فورية
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <CheckCircle className="w-16 h-16 text-chart-3 mx-auto mb-4" />
        <h2 className="text-2xl font-extrabold mb-2">تم تسليم الاختبار!</h2>
        <p className="text-muted-foreground mb-8">النتيجة هتظهر بعد مراجعة المدرس</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/courses">
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للكورسات
          </Link>
        </Button>
      </div>
    )
  }

  // ====== Taking Exam ======
  if (!exam) return null
  const question = exam.questions[currentQuestion]
  const answeredCount = Object.keys(answers).length

  return (
    <div className="max-w-3xl mx-auto">
      {/* شريط التايمر */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4 mb-6 -mx-4 lg:-mx-8 px-4 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className={`w-5 h-5 ${timeLeft < 60 ? "text-destructive animate-pulse" : "text-chart-4"}`} />
            <span className={`font-mono font-bold text-lg ${timeLeft < 60 ? "text-destructive" : ""}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {answeredCount} / {exam.questions.length} سؤال
          </span>
        </div>
      </div>

      {/* نافيجيتور الأسئلة */}
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

      {/* السؤال */}
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
          <CardTitle className="text-lg font-bold mt-2">{question.text}</CardTitle>
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
                  <RadioGroupItem value={choice.id} id={`choice-${choice.id}`} className="ml-3" />
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

      {/* التنقل */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion(prev => prev - 1)}
        >
          <ChevronRight className="w-4 h-4 ml-2" />
          السابق
        </Button>

        {currentQuestion < exam.questions.length - 1 ? (
          <Button
            onClick={() => setCurrentQuestion(prev => prev + 1)}
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
            {examState === "submitting" ? "جاري التسليم..." : "إنهاء الاختبار"}
          </Button>
        )}
      </div>
    </div>
  )
}