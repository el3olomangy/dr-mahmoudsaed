"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion"
import {
  ArrowRight, Plus, Trash2, PlayCircle, FileText,
  FileCheck, AlertCircle, GripVertical, BookOpen,
} from "lucide-react"
import { coursesAPI, examsAPI } from "@/lib/api"

// ====== Types ======
interface Lecture {
  id: string
  title: string
  description?: string
  video_url?: string
  pdf_url?: string
  order: number
  lecture_type: string
  duration_minutes?: number
}

interface Unit {
  id: string
  title: string
  order: number
  lectures: Lecture[]
}

interface Course {
  id: string
  title: string
  description?: string
  grade: string
  units: Unit[]
  is_enrolled: boolean
}

interface ExamSummary {
  id: string
  title: string
  duration_minutes: number
}

// ====== Add Unit Dialog ======
function AddUnitDialog({ courseId, order, onAdded }: { courseId: string; order: number; onAdded: (unit: Unit) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true); setErr("")
    try {
      const unit = await coursesAPI.createUnit(courseId, { title: title.trim(), order }) as Unit
      onAdded(unit)
      setTitle(""); setOpen(false)
    } catch (e: any) { setErr(e.message || "حصل خطأ") }
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 ml-1" /> إضافة وحدة
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader><DialogTitle>إضافة وحدة جديدة</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>اسم الوحدة *</Label>
            <Input placeholder="مثال: الوحدة الأولى — المقدمة" value={title}
              onChange={e => setTitle(e.target.value)} required />
          </div>
          {err && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{err}</p>}
          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "جاري الإضافة..." : "إضافة الوحدة"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ====== Add Lecture Dialog ======
function AddLectureDialog({ courseId, unitId, order, onAdded }: {
  courseId: string; unitId: string; order: number; onAdded: (lec: Lecture) => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")
  const [form, setForm] = useState({
    title: "", description: "", video_url: "", pdf_url: "",
    lecture_type: "paid", duration_minutes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.video_url.trim()) { setErr("العنوان ورابط الفيديو مطلوبين"); return }
    setLoading(true); setErr("")
    try {
      const lec = await coursesAPI.createLecture(courseId, unitId, {
        title: form.title.trim(),
        description: form.description || null,
        video_url: form.video_url.trim(),
        pdf_url: form.pdf_url || null,
        order,
        lecture_type: form.lecture_type,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
      }) as Lecture
      onAdded(lec)
      setForm({ title: "", description: "", video_url: "", pdf_url: "", lecture_type: "paid", duration_minutes: "" })
      setOpen(false)
    } catch (e: any) { setErr(e.message || "حصل خطأ") }
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary">
          <Plus className="w-4 h-4 ml-1" /> محاضرة
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="max-w-lg">
        <DialogHeader><DialogTitle>إضافة محاضرة</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>عنوان المحاضرة *</Label>
            <Input placeholder="مثال: مقدمة وأساسيات" value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>رابط الفيديو * <span className="text-xs text-muted-foreground">(YouTube embed أو رابط مباشر)</span></Label>
            <Input placeholder="https://www.youtube.com/embed/..." dir="ltr"
              value={form.video_url} onChange={e => setForm(p => ({ ...p, video_url: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label>رابط PDF <span className="text-xs text-muted-foreground">(اختياري)</span></Label>
            <Input placeholder="https://..." dir="ltr"
              value={form.pdf_url} onChange={e => setForm(p => ({ ...p, pdf_url: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>النوع</Label>
              <Select value={form.lecture_type} onValueChange={v => setForm(p => ({ ...p, lecture_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">مدفوع</SelectItem>
                  <SelectItem value="free">مجاني</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المدة (دقيقة)</Label>
              <Input type="number" placeholder="45" min="1"
                value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>وصف المحاضرة <span className="text-xs text-muted-foreground">(اختياري)</span></Label>
            <Textarea placeholder="وصف مختصر..." rows={2}
              value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
          </div>
          {err && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{err}</p>}
          <div className="flex gap-3">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "جاري الإضافة..." : "إضافة المحاضرة"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ====== Add Exam Dialog ======
interface QuestionForm {
  text: string
  question_type: "mcq" | "essay"
  points: number
  choices: { text: string; is_correct: boolean }[]
}

function AddExamDialog({ courseId, lectureId, onAdded }: {
  courseId: string; lectureId?: string; onAdded: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState("")
  const [form, setForm] = useState({ title: "", duration_minutes: "30", pass_score: "50", show_result_immediately: true })
  const [questions, setQuestions] = useState<QuestionForm[]>([
    { text: "", question_type: "mcq", points: 1, choices: [{ text: "", is_correct: true }, { text: "", is_correct: false }, { text: "", is_correct: false }, { text: "", is_correct: false }] }
  ])

  const addQuestion = () => {
    setQuestions(prev => [...prev, {
      text: "", question_type: "mcq", points: 1,
      choices: [{ text: "", is_correct: true }, { text: "", is_correct: false }, { text: "", is_correct: false }, { text: "", is_correct: false }]
    }])
  }

  const removeQuestion = (idx: number) => setQuestions(prev => prev.filter((_, i) => i !== idx))

  const updateQuestion = (idx: number, field: keyof QuestionForm, value: any) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q))
  }

  const updateChoice = (qIdx: number, cIdx: number, field: "text" | "is_correct", value: any) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q
      const choices = q.choices.map((c, ci) => {
        if (field === "is_correct") return { ...c, is_correct: ci === cIdx }
        return ci === cIdx ? { ...c, [field]: value } : c
      })
      return { ...q, choices }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { setErr("عنوان الاختبار مطلوب"); return }
    if (questions.length === 0) { setErr("لازم تضيف سؤال واحد على الأقل"); return }
    for (const q of questions) {
      if (!q.text.trim()) { setErr("في سؤال فاضي — اكتب نص لكل سؤال"); return }
      if (q.question_type === "mcq") {
        if (q.choices.some(c => !c.text.trim())) { setErr("في اختيار فاضي في أحد الأسئلة"); return }
        if (!q.choices.some(c => c.is_correct)) { setErr("لازم يكون في إجابة صح واحدة على الأقل في كل سؤال"); return }
      }
    }
    setLoading(true); setErr("")
    try {
      await examsAPI.create({
        title: form.title.trim(),
        course_id: courseId,
        lecture_id: lectureId || null,
        duration_minutes: Number(form.duration_minutes),
        pass_score: Number(form.pass_score),
        show_result_immediately: form.show_result_immediately,
        questions: questions.map(q => ({
          text: q.text.trim(),
          question_type: q.question_type,
          points: q.points,
          choices: q.question_type === "mcq" ? q.choices : [],
          correct_answer: null,
        })),
      })
      onAdded()
      setForm({ title: "", duration_minutes: "30", pass_score: "50", show_result_immediately: true })
      setQuestions([{ text: "", question_type: "mcq", points: 1, choices: [{ text: "", is_correct: true }, { text: "", is_correct: false }, { text: "", is_correct: false }, { text: "", is_correct: false }] }])
      setOpen(false)
    } catch (e: any) { setErr(e.message || "حصل خطأ") }
    finally { setLoading(false) }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-chart-4 hover:text-chart-4">
          <FileCheck className="w-4 h-4 ml-1" /> اختبار
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{lectureId ? "إضافة اختبار للمحاضرة" : "إضافة اختبار للكورس"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          {/* إعدادات الاختبار */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-xl">
            <h3 className="font-bold text-sm">إعدادات الاختبار</h3>
            <div className="space-y-2">
              <Label>عنوان الاختبار *</Label>
              <Input placeholder="مثال: اختبار الوحدة الأولى" value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المدة (دقيقة)</Label>
                <Input type="number" min="5" value={form.duration_minutes}
                  onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>درجة النجاح (%)</Label>
                <Input type="number" min="0" max="100" value={form.pass_score}
                  onChange={e => setForm(p => ({ ...p, pass_score: e.target.value }))} />
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.show_result_immediately}
                onChange={e => setForm(p => ({ ...p, show_result_immediately: e.target.checked }))}
                className="w-4 h-4 rounded" />
              <span className="text-sm">عرض النتيجة فوراً بعد التسليم</span>
            </label>
          </div>

          {/* الأسئلة */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold">الأسئلة ({questions.length})</h3>
              <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="w-4 h-4 ml-1" /> إضافة سؤال
              </Button>
            </div>

            {questions.map((q, qIdx) => (
              <div key={qIdx} className="border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-muted-foreground">سؤال {qIdx + 1}</span>
                  <div className="flex items-center gap-2">
                    <Select value={q.question_type} onValueChange={v => updateQuestion(qIdx, "question_type", v)}>
                      <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mcq">اختيار من متعدد</SelectItem>
                        <SelectItem value="essay">مقالي</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input type="number" min="1" value={q.points} className="w-16 h-8 text-sm text-center"
                      onChange={e => updateQuestion(qIdx, "points", Number(e.target.value))}
                      title="الدرجة" />
                    {questions.length > 1 && (
                      <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive p-1"
                        onClick={() => removeQuestion(qIdx)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <Textarea placeholder="نص السؤال..." rows={2} value={q.text}
                  onChange={e => updateQuestion(qIdx, "text", e.target.value)} />

                {q.question_type === "mcq" && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">الاختيارات — اضغط على الدائرة عشان تحدد الإجابة الصح</p>
                    {q.choices.map((c, cIdx) => (
                      <div key={cIdx} className="flex items-center gap-2">
                        <button type="button"
                          onClick={() => updateChoice(qIdx, cIdx, "is_correct", true)}
                          className={`w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${c.is_correct ? "border-chart-3 bg-chart-3" : "border-muted-foreground"}`}
                        />
                        <Input placeholder={`الاختيار ${cIdx + 1}`} value={c.text}
                          onChange={e => updateChoice(qIdx, cIdx, "text", e.target.value)}
                          className={c.is_correct ? "border-chart-3/50" : ""} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {err && <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{err}</p>}

          <div className="flex gap-3">
            <Button type="submit" className="flex-1 bg-chart-4 hover:bg-chart-4/90 text-white" disabled={loading}>
              {loading ? "جاري الإنشاء..." : "إنشاء الاختبار"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ====== Main Page ======
export default function AdminCourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params)
  const [course, setCourse] = useState<Course | null>(null)
  const [exams, setExams] = useState<ExamSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const fetchData = async () => {
    setIsLoading(true); setError("")
    try {
      const [courseData, examsData] = await Promise.all([
        coursesAPI.getOne(courseId) as Promise<Course>,
        examsAPI.getByCourse(courseId) as Promise<ExamSummary[]>,
      ])
      setCourse(courseData)
      setExams(examsData)
    } catch (e: any) {
      setError(e.message || "حصل خطأ في تحميل الكورس")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [courseId])

  const handleUnitAdded = (unit: Unit) => {
    setCourse(prev => prev ? { ...prev, units: [...prev.units, { ...unit, lectures: [] }] } : prev)
  }

  const handleLectureAdded = (unitId: string, lecture: Lecture) => {
    setCourse(prev => {
      if (!prev) return prev
      return {
        ...prev,
        units: prev.units.map(u => u.id === unitId ? { ...u, lectures: [...u.lectures, lecture] } : u)
      }
    })
  }

  const totalLectures = course?.units.flatMap(u => u.lectures).length || 0

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-64" />
        <Card><CardContent className="p-6 space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </CardContent></Card>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">{error || "الكورس مش موجود"}</p>
        <Button asChild variant="outline">
          <Link href="/dashboard/admin/courses"><ArrowRight className="w-4 h-4 ml-2" />رجوع</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/admin/courses"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowRight className="w-4 h-4" /> الكورسات
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="font-bold text-foreground truncate">{course.title}</span>
      </div>

      {/* Stats + actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">{course.title}</h1>
          <p className="text-muted-foreground mt-1">
            {course.units.length} وحدة &bull; {totalLectures} محاضرة &bull; {exams.length} اختبار
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <AddUnitDialog courseId={courseId} order={course.units.length + 1} onAdded={handleUnitAdded} />
          <AddExamDialog courseId={courseId} onAdded={fetchData} />
        </div>
      </div>

      {/* اختبارات الكورس العامة */}
      {exams.filter(e => !e.hasOwnProperty("lecture_id")).length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-chart-4" /> اختبارات الكورس
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {exams.map(exam => (
              <div key={exam.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                <span className="font-medium text-sm">{exam.title}</span>
                <span className="text-xs text-muted-foreground">{exam.duration_minutes} دقيقة</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* الوحدات */}
      {course.units.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">مفيش وحدات لسه — ابدأ بإضافة أول وحدة</p>
            <AddUnitDialog courseId={courseId} order={1} onAdded={handleUnitAdded} />
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={course.units.map(u => u.id)} className="space-y-3">
          {course.units.map((unit) => (
            <Card key={unit.id} className="overflow-hidden">
              <AccordionItem value={unit.id} className="border-none">
                <AccordionTrigger className="px-6 py-4 hover:bg-muted/30 hover:no-underline">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-muted-foreground" />
                    <div className="text-right">
                      <p className="font-bold text-foreground">{unit.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{unit.lectures.length} محاضرة</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-0">
                  <div className="border-t border-border">
                    {/* قائمة المحاضرات */}
                    {unit.lectures.length > 0 && (
                      <div className="divide-y divide-border">
                        {unit.lectures.map((lec) => (
                          <div key={lec.id} className="flex items-center gap-3 px-6 py-3">
                            {lec.video_url
                              ? <PlayCircle className="w-4 h-4 text-primary shrink-0" />
                              : <FileText className="w-4 h-4 text-secondary shrink-0" />}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground truncate">{lec.title}</p>
                              <div className="flex items-center gap-3 mt-0.5">
                                {lec.duration_minutes && (
                                  <span className="text-xs text-muted-foreground">{lec.duration_minutes} دقيقة</span>
                                )}
                                <span className={`text-xs px-1.5 py-0.5 rounded ${lec.lecture_type === "free" ? "bg-chart-3/10 text-chart-3" : "bg-primary/10 text-primary"}`}>
                                  {lec.lecture_type === "free" ? "مجاني" : "مدفوع"}
                                </span>
                                {lec.pdf_url && <span className="text-xs text-muted-foreground">+ PDF</span>}
                              </div>
                            </div>
                            {/* اختبار للمحاضرة */}
                            <AddExamDialog courseId={courseId} lectureId={lec.id} onAdded={fetchData} />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* إضافة محاضرة */}
                    <div className="px-6 py-3 bg-muted/20">
                      <AddLectureDialog
                        courseId={courseId}
                        unitId={unit.id}
                        order={unit.lectures.length + 1}
                        onAdded={(lec) => handleLectureAdded(unit.id, lec)}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Card>
          ))}
        </Accordion>
      )}
    </div>
  )
}