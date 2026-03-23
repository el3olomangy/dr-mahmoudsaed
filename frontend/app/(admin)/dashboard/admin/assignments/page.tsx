"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  ClipboardCheck, Plus, Trash2, RefreshCw, Calendar, BookOpen, Eye, Pencil,
} from "lucide-react"
import { examsAPI, coursesAPI } from "@/lib/api"

interface Homework {
  id: string
  title: string
  lecture_id: string
  course_id: string
  deadline?: string
  pass_score: number
  duration_minutes?: number
}

interface Course {
  id: string
  title: string
}

interface EditForm {
  title: string
  pass_score: string
  duration_minutes: string
  deadline: string
}

interface Choice { text: string; is_correct: boolean }
interface QuestionForm {
  text: string
  question_type: "mcq" | "essay"
  points: number
  choices: Choice[]
}

export default function AssignmentsPage() {
  const router = useRouter()
  const [homeworks, setHomeworks] = useState<Homework[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // تعديل
  const [editHw, setEditHw] = useState<Homework | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({ title: "", pass_score: "50", duration_minutes: "30", deadline: "" })
  const [editQuestions, setEditQuestions] = useState<QuestionForm[]>([])
  const [loadingHw, setLoadingHw] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editErr, setEditErr] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    setError("")
    try {
      const coursesData = (await coursesAPI.getAll()) as Course[]
      setCourses(coursesData)

      // جيب الواجبات من كل الكورسات — فلتر is_homework: true
      const allHomeworks: Homework[] = []
      for (const course of coursesData) {
        try {
          const exams = (await examsAPI.getByCourse(course.id)) as any[]
          const courseHomeworks = exams.filter(e => e.is_homework === true)
          allHomeworks.push(...courseHomeworks)
        } catch {}
      }

      setHomeworks(allHomeworks)
    } catch (err: any) {
      setError(err.message || "حصل خطأ")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("هتحذف الواجب ده وكل تسليماته. متأكد؟")) return
    try {
      await examsAPI.deleteExam(id)
      setHomeworks(prev => prev.filter(h => h.id !== id))
    } catch (err: any) {
      alert(err.message || "حصل خطأ")
    }
  }

  const openEdit = async (hw: Homework) => {
    setEditHw(hw)
    setEditErr("")
    setLoadingHw(true)
    setEditForm({
      title: hw.title,
      pass_score: String(hw.pass_score || 50),
      duration_minutes: String(hw.duration_minutes || 30),
      deadline: hw.deadline ? new Date(hw.deadline).toISOString().slice(0, 16) : "",
    })
    try {
      const data = await examsAPI.getExamForAdmin(hw.id) as any
      const qs: QuestionForm[] = (data.questions || []).map((q: any) => ({
        text: q.text || "",
        question_type: q.question_type || "mcq",
        points: q.points || 1,
        choices: q.choices?.length
          ? q.choices.map((c: any) => ({ text: c.text || "", is_correct: !!c.is_correct }))
          : [{ text: "", is_correct: true }, { text: "", is_correct: false }, { text: "", is_correct: false }, { text: "", is_correct: false }],
      }))
      setEditQuestions(qs.length > 0 ? qs : [{ text: "", question_type: "mcq", points: 1, choices: [{ text: "", is_correct: true }, { text: "", is_correct: false }, { text: "", is_correct: false }, { text: "", is_correct: false }] }])
    } catch {
      setEditQuestions([])
    } finally {
      setLoadingHw(false)
    }
  }

  const saveEdit = async () => {
    if (!editHw) return
    if (!editForm.title.trim()) { setEditErr("العنوان مطلوب"); return }
    for (const q of editQuestions) {
      if (!q.text.trim()) { setEditErr("في سؤال فاضي"); return }
    }
    setSaving(true); setEditErr("")
    try {
      await examsAPI.updateExamFull(editHw.id, {
        title: editForm.title.trim(),
        pass_score: Number(editForm.pass_score) || 50,
        duration_minutes: Number(editForm.duration_minutes) || 30,
        deadline: editForm.deadline ? new Date(editForm.deadline).toISOString() : null,
        questions: editQuestions.map(q => ({
          text: q.text.trim(),
          question_type: q.question_type,
          points: q.points,
          choices: q.question_type === "mcq" ? q.choices : [],
        })),
      })
      setHomeworks(prev => prev.map(h =>
        h.id === editHw.id
          ? { ...h, title: editForm.title.trim(), pass_score: Number(editForm.pass_score), deadline: editForm.deadline || undefined }
          : h
      ))
      setEditHw(null)
    } catch (err: any) {
      setEditErr(err.message || "حصل خطأ في الحفظ")
    } finally {
      setSaving(false)
    }
  }

  // helpers للأسئلة
  const addQuestion = () => setEditQuestions(prev => [...prev, { text: "", question_type: "mcq", points: 1, choices: [{ text: "", is_correct: true }, { text: "", is_correct: false }, { text: "", is_correct: false }, { text: "", is_correct: false }] }])
  const removeQuestion = (i: number) => setEditQuestions(prev => prev.filter((_, idx) => idx !== i))
  const updateQuestion = (i: number, field: keyof QuestionForm, val: any) =>
    setEditQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: val } : q))
  const updateChoice = (qi: number, ci: number, field: "text" | "is_correct", val: any) =>
    setEditQuestions(prev => prev.map((q, idx) => {
      if (idx !== qi) return q
      const choices = q.choices.map((c, cidx) =>
        field === "is_correct" ? { ...c, is_correct: cidx === ci } : cidx === ci ? { ...c, [field]: val } : c
      )
      return { ...q, choices }
    }))

  const getCourseTitle = (courseId: string) =>
    courses.find(c => c.id === courseId)?.title || "—"

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">الواجبات</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? "..." : `${homeworks.length} واجب`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? "animate-spin" : ""}`} />
            تحديث
          </Button>
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => router.push("/dashboard/admin/assignments/new")}
          >
            <Plus className="w-4 h-4 ml-2" />
            واجب جديد
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between">
          <p className="text-destructive text-sm">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchData}>إعادة المحاولة</Button>
        </div>
      )}

      {/* القائمة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" />
            قائمة الواجبات
            {!isLoading && (
              <span className="text-sm font-normal text-muted-foreground">
                ({homeworks.length})
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : homeworks.length === 0 ? (
            <div className="text-center py-16">
              <ClipboardCheck className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">مفيش واجبات لسه</p>
              <p className="text-sm text-muted-foreground mt-1">ابدأ بإنشاء أول واجب</p>
              <Button
                className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={() => router.push("/dashboard/admin/assignments/new")}
              >
                <Plus className="w-4 h-4 ml-2" />
                واجب جديد
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {homeworks.map(hw => (
                <div key={hw.id} className="p-4 flex items-center gap-4">

                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <ClipboardCheck className="w-5 h-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground truncate">{hw.title}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {getCourseTitle(hw.course_id)}
                      </span>
                      {hw.deadline && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(hw.deadline).toLocaleDateString("ar-EG")}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/dashboard/admin/assignments/${hw.id}`)}
                    >
                      <Eye className="w-4 h-4 ml-1" />
                      النتائج
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(hw)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(hw.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog التعديل */}
      <Dialog open={!!editHw} onOpenChange={(o) => !o && setEditHw(null)}>
        <DialogContent dir="rtl" className="max-w-2xl p-0 gap-0 overflow-hidden" style={{maxHeight: "90vh", display: "flex", flexDirection: "column"}}>

          {/* Header */}
          <div className="shrink-0 px-6 pt-6 pb-4 border-b border-border">
            <DialogHeader>
              <DialogTitle>تعديل الواجب</DialogTitle>
            </DialogHeader>
          </div>

          {/* المحتوى القابل للسكرول */}
          <div style={{flex: 1, overflowY: "auto"}} className="px-6 py-4 space-y-5">

            {/* البيانات الأساسية */}
            <div className="space-y-3 p-4 bg-muted/50 rounded-xl">
              <div className="space-y-2">
                <Label>عنوان الواجب *</Label>
                <Input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} placeholder="عنوان الواجب" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>درجة النجاح (%)</Label>
                  <Input type="number" min="0" max="100" value={editForm.pass_score} onChange={e => setEditForm(p => ({ ...p, pass_score: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>المدة (دقيقة)</Label>
                  <Input type="number" min="5" value={editForm.duration_minutes} onChange={e => setEditForm(p => ({ ...p, duration_minutes: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>الموعد النهائي (اختياري)</Label>
                <Input type="datetime-local" value={editForm.deadline} onChange={e => setEditForm(p => ({ ...p, deadline: e.target.value }))} />
              </div>
            </div>

            {/* الأسئلة */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm">الأسئلة ({editQuestions.length})</h3>
                <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                  <Plus className="w-4 h-4 ml-1" /> إضافة سؤال
                </Button>
              </div>

              {loadingHw ? (
                <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
              ) : editQuestions.map((q, qi) => (
                <div key={qi} className="border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted-foreground">سؤال {qi + 1}</span>
                    <div className="flex items-center gap-2">
                      <select
                        value={q.question_type}
                        onChange={e => updateQuestion(qi, "question_type", e.target.value)}
                        className="text-xs border border-border rounded px-2 py-1 bg-background"
                      >
                        <option value="mcq">اختيار من متعدد</option>
                        <option value="essay">مقالي</option>
                      </select>
                      <Input type="number" min="1" value={q.points} onChange={e => updateQuestion(qi, "points", Number(e.target.value))} className="w-16 h-7 text-xs text-center" title="الدرجة" />
                      {editQuestions.length > 1 && (
                        <Button type="button" variant="ghost" size="sm" className="text-destructive p-1 h-7" onClick={() => removeQuestion(qi)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <Input placeholder="نص السؤال..." value={q.text} onChange={e => updateQuestion(qi, "text", e.target.value)} />
                  {q.question_type === "mcq" && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">اضغط الدائرة عشان تحدد الإجابة الصح</p>
                      {q.choices.map((c, ci) => (
                        <div key={ci} className="flex items-center gap-2">
                          <button type="button" onClick={() => updateChoice(qi, ci, "is_correct", true)}
                            className={`w-4 h-4 rounded-full border-2 shrink-0 transition-colors ${c.is_correct ? "border-green-500 bg-green-500" : "border-muted-foreground"}`} />
                          <Input placeholder={`الاختيار ${ci + 1}`} value={c.text} onChange={e => updateChoice(qi, ci, "text", e.target.value)} className={`h-8 text-sm ${c.is_correct ? "border-green-500/50" : ""}`} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* الأزرار ثابتة في الأسفل */}
          <div className="shrink-0 px-6 py-4 border-t border-border bg-background space-y-2">
            {editErr && <p className="text-sm text-destructive">{editErr}</p>}
            <div className="flex gap-3">
              <Button className="flex-1" disabled={saving} onClick={saveEdit}>
                {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
              </Button>
              <Button variant="outline" onClick={() => setEditHw(null)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}