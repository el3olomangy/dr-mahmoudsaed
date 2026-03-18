"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  KeyRound, Plus, RefreshCw, Copy, CheckCircle, XCircle, Clock, Ban
} from "lucide-react"
import { codesAPI, coursesAPI } from "@/lib/api"

interface Code {
  id: string
  code: string
  code_type: "course" | "bundle"
  status: "active" | "used" | "expired" | "disabled"
  course_id?: string
  used_by?: string
  used_at?: string
  expires_at?: string
  created_at: string
}

interface Course {
  id: string
  title: string
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  active:   { label: "نشط",       color: "text-chart-3 bg-chart-3/10",    icon: CheckCircle },
  used:     { label: "مستخدم",    color: "text-blue-500 bg-blue-500/10",  icon: CheckCircle },
  expired:  { label: "منتهي",     color: "text-muted-foreground bg-muted",icon: Clock },
  disabled: { label: "معطل",      color: "text-destructive bg-destructive/10", icon: Ban },
}

export default function CodesPage() {
  const [codes, setCodes] = useState<Code[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [form, setForm] = useState({
    code_type: "course", course_id: "", quantity: "1", expires_days: "30",
  })

  useEffect(() => {
    fetchCodes()
    fetchCourses()
  }, [])

  const fetchCodes = async () => {
    setIsLoading(true)
    setError("")
    try {
      const data = await codesAPI.getAll() as Code[]
      setCodes(data)
    } catch (err: any) {
      setError(err.message || "حصل خطأ")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCourses = async () => {
    try {
      const data = await coursesAPI.getAll() as Course[]
      setCourses(data)
    } catch {}
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.code_type === "course" && !form.course_id) {
      setFormError("اختر الكورس")
      return
    }
    setIsSubmitting(true)
    setFormError("")
    try {
      await codesAPI.generate({
        code_type: form.code_type,
        course_id: form.code_type === "course" ? form.course_id : null,
        quantity: Number(form.quantity),
        expires_days: Number(form.expires_days),
      })
      await fetchCodes()
      setIsDialogOpen(false)
      setForm({ code_type: "course", course_id: "", quantity: "1", expires_days: "30" })
    } catch (err: any) {
      setFormError(err.message || "حصل خطأ في توليد الأكواد")
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDisable = async (id: string) => {
    if (!confirm("هتعطل الكود ده — مش هيتفعّل تاني. متأكد؟")) return
    try {
      await codesAPI.disable(id)
      setCodes(prev => prev.map(c => c.id === id ? { ...c, status: "disabled" } : c))
    } catch (err: any) {
      alert(err.message || "حصل خطأ")
    }
  }

  const filtered = filterStatus === "all" ? codes : codes.filter(c => c.status === filterStatus)

  const counts = {
    all: codes.length,
    active: codes.filter(c => c.status === "active").length,
    used: codes.filter(c => c.status === "used").length,
    expired: codes.filter(c => c.status === "expired").length,
    disabled: codes.filter(c => c.status === "disabled").length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">الأكواد</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? "..." : `${codes.length} كود`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCodes} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? "animate-spin" : ""}`} />
            تحديث
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-4 h-4 ml-2" />
                توليد أكواد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle>توليد أكواد جديدة</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleGenerate} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>نوع الكود</Label>
                  <Select value={form.code_type} onValueChange={v => setForm(p => ({ ...p, code_type: v, course_id: "" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course">كورس محدد</SelectItem>
                      <SelectItem value="bundle">باقة كورسات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {form.code_type === "course" && (
                  <div className="space-y-2">
                    <Label>الكورس *</Label>
                    <Select value={form.course_id} onValueChange={v => setForm(p => ({ ...p, course_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="اختر الكورس" /></SelectTrigger>
                      <SelectContent>
                        {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الكمية</Label>
                    <Input
                      type="number"
                      min="1" max="100"
                      value={form.quantity}
                      onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>صلاحية (يوم)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={form.expires_days}
                      onChange={e => setForm(p => ({ ...p, expires_days: e.target.value }))}
                    />
                  </div>
                </div>

                {formError && (
                  <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{formError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
                    {isSubmitting ? "جاري التوليد..." : "توليد الأكواد"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(counts).map(([key, count]) => (
          <button
            key={key}
            onClick={() => setFilterStatus(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filterStatus === key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {key === "all" ? "الكل" : statusConfig[key]?.label} ({count})
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between">
          <p className="text-destructive text-sm">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchCodes}>إعادة المحاولة</Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            قائمة الأكواد
            {!isLoading && (
              <span className="text-sm font-normal text-muted-foreground">({filtered.length})</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y divide-border">
              {[1,2,3,4].map(i => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-6 w-16" />
                  <div className="flex-1" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <KeyRound className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">مفيش أكواد</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(code => {
                const sc = statusConfig[code.status] || statusConfig.active
                const StatusIcon = sc.icon
                const course = courses.find(c => c.id === code.course_id)
                return (
                  <div key={code.id} className="p-4 flex items-center gap-4">
                    {/* Code */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-foreground tracking-widest text-sm bg-muted px-3 py-1.5 rounded-lg">
                        {code.code}
                      </span>
                      {code.status === "active" && (
                        <button
                          onClick={() => copyCode(code.id, code.code)}
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          title="نسخ الكود"
                        >
                          {copiedId === code.id
                            ? <CheckCircle className="w-4 h-4 text-chart-3" />
                            : <Copy className="w-4 h-4" />
                          }
                        </button>
                      )}
                    </div>

                    {/* Status badge */}
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full shrink-0 ${sc.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {sc.label}
                    </span>

                    {/* Course name */}
                    <span className="text-sm text-muted-foreground flex-1 truncate">
                      {course?.title || (code.code_type === "bundle" ? "باقة" : "—")}
                    </span>

                    {/* Date */}
                    <span className="text-xs text-muted-foreground hidden md:block shrink-0">
                      {code.used_at
                        ? `استُخدم ${new Date(code.used_at).toLocaleDateString("ar-EG")}`
                        : code.expires_at
                        ? `تنتهي ${new Date(code.expires_at).toLocaleDateString("ar-EG")}`
                        : "—"}
                    </span>

                    {/* Disable button */}
                    {code.status === "active" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => handleDisable(code.id)}
                      >
                        <Ban className="w-4 h-4 ml-1" />
                        تعطيل
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}