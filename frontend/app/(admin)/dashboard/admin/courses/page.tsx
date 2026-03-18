"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { BookOpen, Plus, RefreshCw, PlayCircle } from "lucide-react"
import { coursesAPI } from "@/lib/api"

interface Course {
  id: string
  title: string
  description?: string
  grade?: string
  price?: number
  thumbnail?: string
  lectures_count: number
  is_active: boolean
}

const grades = [
  { value: "first_secondary", label: "أولى ثانوي" },
  { value: "second_secondary", label: "ثانية ثانوي" },
  { value: "third_secondary", label: "ثالثة ثانوي" },
]

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState("")
  const [form, setForm] = useState({
    title: "", description: "", grade: "", price: "", thumbnail: "",
  })

  useEffect(() => { fetchCourses() }, [])

  const fetchCourses = async () => {
    setIsLoading(true)
    setError("")
    try {
      const data = await coursesAPI.getAll() as Course[]
      setCourses(data)
    } catch (err: any) {
      setError(err.message || "حصل خطأ")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.grade) {
      setFormError("اسم الكورس والمرحلة مطلوبين")
      return
    }
    setIsSubmitting(true)
    setFormError("")
    try {
      const newCourse: any = await coursesAPI.create({
        title: form.title,
        description: form.description || null,
        grade: form.grade,
        price: form.price ? Number(form.price) : null,
        thumbnail: form.thumbnail || null,
      })
      setCourses(prev => [newCourse, ...prev])
      setIsDialogOpen(false)
      setForm({ title: "", description: "", grade: "", price: "", thumbnail: "" })
    } catch (err: any) {
      setFormError(err.message || "حصل خطأ في إنشاء الكورس")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">الكورسات</h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? "..." : `${courses.length} كورس`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCourses} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ml-2 ${isLoading ? "animate-spin" : ""}`} />
            تحديث
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-4 h-4 ml-2" />
                كورس جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg" dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة كورس جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>اسم الكورس *</Label>
                  <Input
                    placeholder="مثال: الكيمياء العضوية"
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>المرحلة الدراسية *</Label>
                  <Select value={form.grade} onValueChange={v => setForm(p => ({ ...p, grade: v }))}>
                    <SelectTrigger><SelectValue placeholder="اختر المرحلة" /></SelectTrigger>
                    <SelectContent>
                      {grades.map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الوصف</Label>
                  <Textarea
                    placeholder="وصف مختصر للكورس..."
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>السعر (جنيه)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={form.price}
                      onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>رابط الصورة</Label>
                    <Input
                      placeholder="https://..."
                      value={form.thumbnail}
                      onChange={e => setForm(p => ({ ...p, thumbnail: e.target.value }))}
                      dir="ltr"
                    />
                  </div>
                </div>

                {formError && (
                  <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">{formError}</p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
                    {isSubmitting ? "جاري الإنشاء..." : "إنشاء الكورس"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between">
          <p className="text-destructive text-sm">{error}</p>
          <Button variant="ghost" size="sm" onClick={fetchCourses}>إعادة المحاولة</Button>
        </div>
      )}

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-video w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">مفيش كورسات لسه</p>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 ml-2" />
              أضف أول كورس
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map(course => (
            <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative aspect-video bg-muted flex items-center justify-center">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-10 h-10 text-muted-foreground" />
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-foreground mb-1">{course.title}</h3>
                {course.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{course.description}</p>
                )}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <PlayCircle className="w-4 h-4" />
                    {course.lectures_count} محاضرة
                  </span>
                  <span>{grades.find(g => g.value === course.grade)?.label || course.grade}</span>
                </div>
                {course.price && (
                  <p className="mt-2 text-sm font-bold text-primary">{course.price} جنيه</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}