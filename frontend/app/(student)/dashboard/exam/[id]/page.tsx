"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react"

// Mock exam data
const examData = {
  id: 4,
  title: "اختبار الوحدة الأولى",
  courseId: 1,
  courseName: "الكيمياء العضوية",
  duration: 30, // minutes
  questions: [
    {
      id: 1,
      type: "mcq",
      text: "ما هو العنصر الأساسي في المركبات العضوية؟",
      options: ["الكربون", "الهيدروجين", "الأكسجين", "النيتروجين"],
      correctAnswer: 0,
    },
    {
      id: 2,
      type: "mcq",
      text: "أي من التالي يُعد من الهيدروكربونات المشبعة؟",
      options: ["الإيثين", "الإيثاين", "الإيثان", "البنزين"],
      correctAnswer: 2,
    },
    {
      id: 3,
      type: "mcq",
      text: "الصيغة العامة للألكانات هي:",
      options: ["CnH2n", "CnH2n+2", "CnH2n-2", "CnHn"],
      correctAnswer: 1,
    },
    {
      id: 4,
      type: "essay",
      text: "اشرح بإيجاز الفرق بين الروابط الأحادية والمزدوجة والثلاثية في المركبات العضوية.",
    },
    {
      id: 5,
      type: "mcq",
      text: "ما نوع التهجين في ذرة الكربون في الميثان؟",
      options: ["sp", "sp2", "sp3", "sp3d"],
      correctAnswer: 2,
    },
  ],
}

type ExamState = "intro" | "taking" | "result"

export default function ExamPage() {
  const [examState, setExamState] = useState<ExamState>("intro")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<number, string | number>>({})
  const [timeLeft, setTimeLeft] = useState(examData.duration * 60)
  const [showResults, setShowResults] = useState(false)

  // Timer
  useEffect(() => {
    if (examState !== "taking") return
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
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
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleAnswer = (questionId: number, answer: string | number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }

  const handleSubmit = () => {
    setExamState("result")
  }

  const calculateScore = () => {
    let correct = 0
    examData.questions.forEach((q) => {
      if (q.type === "mcq" && answers[q.id] === q.correctAnswer) {
        correct++
      }
    })
    const mcqCount = examData.questions.filter(q => q.type === "mcq").length
    return Math.round((correct / mcqCount) * 100)
  }

  // Intro Screen
  if (examState === "intro") {
    return (
      <div className="max-w-2xl mx-auto">
        <Link 
          href={`/dashboard/courses/${examData.courseId}`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للكورس</span>
        </Link>

        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-chart-4/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-chart-4" />
            </div>
            <CardTitle className="text-2xl font-extrabold">{examData.title}</CardTitle>
            <p className="text-muted-foreground">{examData.courseName}</p>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted rounded-xl">
                <p className="text-2xl font-bold text-foreground">{examData.questions.length}</p>
                <p className="text-sm text-muted-foreground">عدد الأسئلة</p>
              </div>
              <div className="p-4 bg-muted rounded-xl">
                <p className="text-2xl font-bold text-foreground">{examData.duration} دقيقة</p>
                <p className="text-sm text-muted-foreground">مدة الاختبار</p>
              </div>
            </div>

            <div className="p-4 bg-chart-4/10 border border-chart-4/30 rounded-xl text-right">
              <h3 className="font-bold text-foreground mb-2">تعليمات مهمة:</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>- الاختبار يحتوي على أسئلة اختيار من متعدد ومقالية</li>
                <li>- سيتم حساب الوقت تلقائياً</li>
                <li>- بعد انتهاء الوقت سيتم تسليم الاختبار تلقائياً</li>
                <li>- يمكنك التنقل بين الأسئلة قبل التسليم</li>
              </ul>
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

  // Result Screen
  if (examState === "result") {
    const score = calculateScore()
    const isPassed = score >= 50

    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${isPassed ? 'bg-chart-3/10' : 'bg-destructive/10'}`}>
              {isPassed ? (
                <CheckCircle className="w-10 h-10 text-chart-3" />
              ) : (
                <XCircle className="w-10 h-10 text-destructive" />
              )}
            </div>
            <CardTitle className="text-2xl font-extrabold">
              {isPassed ? "أحسنت!" : "حاول مرة أخرى"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="text-6xl font-extrabold text-primary">{score}%</div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-xl">
                <p className="text-xl font-bold text-foreground">{examData.questions.length}</p>
                <p className="text-xs text-muted-foreground">عدد الأسئلة</p>
              </div>
              <div className="p-4 bg-chart-3/10 rounded-xl">
                <p className="text-xl font-bold text-chart-3">
                  {examData.questions.filter(q => q.type === "mcq" && answers[q.id] === q.correctAnswer).length}
                </p>
                <p className="text-xs text-muted-foreground">إجابات صحيحة</p>
              </div>
              <div className="p-4 bg-destructive/10 rounded-xl">
                <p className="text-xl font-bold text-destructive">
                  {examData.questions.filter(q => q.type === "mcq" && answers[q.id] !== q.correctAnswer).length}
                </p>
                <p className="text-xs text-muted-foreground">إجابات خاطئة</p>
              </div>
            </div>

            <Button 
              onClick={() => setShowResults(!showResults)}
              variant="outline"
              className="w-full"
            >
              {showResults ? "إخفاء" : "مراجعة"} الإجابات
            </Button>

            {showResults && (
              <div className="text-right space-y-4 mt-4">
                {examData.questions.map((q, index) => {
                  if (q.type !== "mcq") return null
                  const isCorrect = answers[q.id] === q.correctAnswer
                  return (
                    <div key={q.id} className={`p-4 rounded-xl border ${isCorrect ? 'bg-chart-3/5 border-chart-3/30' : 'bg-destructive/5 border-destructive/30'}`}>
                      <p className="font-bold mb-2">{index + 1}. {q.text}</p>
                      <p className="text-sm">
                        <span className="text-muted-foreground">إجابتك: </span>
                        <span className={isCorrect ? 'text-chart-3' : 'text-destructive'}>
                          {(q.options ?? [])[answers[q.id] as number] ?? "لم تجب"}
                        </span>
                      </p>
                      {!isCorrect && (
                        <p className="text-sm">
                          <span className="text-muted-foreground">الإجابة الصحيحة: </span>
                          <span className="text-chart-3">{(q.options ?? [])[q.correctAnswer ?? 0]}</span>
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <Button 
              asChild
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Link href={`/dashboard/courses/${examData.courseId}`}>
                العودة للكورس
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Taking Exam Screen
  const question = examData.questions[currentQuestion]
  const answeredCount = Object.keys(answers).length

  return (
    <div className="max-w-3xl mx-auto">
      {/* Timer Bar */}
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4 mb-6 -mx-4 lg:-mx-8 px-4 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className={`w-5 h-5 ${timeLeft < 60 ? 'text-destructive animate-pulse' : 'text-chart-4'}`} />
            <span className={`font-mono font-bold text-lg ${timeLeft < 60 ? 'text-destructive' : ''}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
          <div className="text-sm text-muted-foreground">
            {answeredCount} / {examData.questions.length} سؤال
          </div>
        </div>
      </div>

      {/* Question Navigator */}
      <div className="flex flex-wrap gap-2 mb-6">
        {examData.questions.map((q, index) => (
          <button
            key={q.id}
            onClick={() => setCurrentQuestion(index)}
            className={`w-10 h-10 rounded-lg font-bold text-sm transition-colors ${
              currentQuestion === index 
                ? 'bg-primary text-primary-foreground'
                : answers[q.id] !== undefined
                  ? 'bg-chart-3 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {index + 1}
          </button>
        ))}
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              السؤال {currentQuestion + 1} من {examData.questions.length}
            </span>
            <span className="text-xs px-2 py-1 bg-muted rounded-full">
              {question.type === "mcq" ? "اختيار من متعدد" : "مقالي"}
            </span>
          </div>
          <CardTitle className="text-lg font-bold mt-2">{question.text}</CardTitle>
        </CardHeader>
        <CardContent>
          {question.type === "mcq" && question.options && (
            <RadioGroup
              value={answers[question.id]?.toString() || ""}
              onValueChange={(value) => handleAnswer(question.id, parseInt(value))}
              className="space-y-3"
            >
              {question.options.map((option, index) => (
                <div key={index} className="flex items-center">
                  <RadioGroupItem 
                    value={index.toString()} 
                    id={`option-${index}`}
                    className="ml-3"
                  />
                  <Label 
                    htmlFor={`option-${index}`}
                    className="flex-1 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {question.type === "essay" && (
            <Textarea
              placeholder="اكتب إجابتك هنا..."
              value={(answers[question.id] as string) || ""}
              onChange={(e) => handleAnswer(question.id, e.target.value)}
              className="min-h-37.5"
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          disabled={currentQuestion === 0}
          onClick={() => setCurrentQuestion((prev) => prev - 1)}
        >
          <ChevronRight className="w-4 h-4 ml-2" />
          السابق
        </Button>

        {currentQuestion < examData.questions.length - 1 ? (
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
            className="bg-chart-3 hover:bg-chart-3/90 text-white"
          >
            إنهاء الاختبار
          </Button>
        )}
      </div>
    </div>
  )
}
