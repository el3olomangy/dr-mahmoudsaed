"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  User, Phone, MapPin, GraduationCap, Lock,
  BookOpen, PlayCircle, FileCheck, CheckCircle, AlertCircle
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { usersAPI, progressAPI } from "@/lib/api"

const gradeLabels: Record<string, string> = {
  first_secondary: "الصف الأول الثانوي",
  second_secondary: "الصف الثاني الثانوي",
  third_secondary: "الصف الثالث الثانوي",
}

type PasswordStatus = "idle" | "success" | "error"

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileStatus, setProfileStatus] = useState<PasswordStatus>("idle")
  const [profileMsg, setProfileMsg] = useState("")
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" })
  const [pwStatus, setPwStatus] = useState<PasswordStatus>("idle")
  const [pwMsg, setPwMsg] = useState("")
  const [isChangingPw, setIsChangingPw] = useState(false)

  // Editable fields
  const [editName, setEditName] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    governorate: user?.governorate || "",
  })
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [stats, setStats] = useState({ watched: 0, exams_taken: 0, exams_passed: 0 })

  // جيب أحدث بيانات الطالب من الـ API وحدّث الـ AuthContext
  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileData, coursesData]: [any, any] = await Promise.all([
          usersAPI.getMyProfile(),
          // جيب الكورسات الموجودة فعلاً عشان نفلتر المحذوفة
          import("@/lib/api").then(m => m.coursesAPI.getAll()),
        ])

        // فلتر الـ enrolled_courses بالكورسات الموجودة فعلاً
        const existingCourseIds = new Set(coursesData.map((c: any) => c.id))
        const validCourses = (profileData.enrolled_courses || []).filter(
          (id: string) => existingCourseIds.has(id)
        )

        updateUser({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          governorate: profileData.governorate,
          enrolled_courses: validCourses,
        })
        setEditName({
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          governorate: profileData.governorate || "",
        })

        // جيب إحصائيات التقدم من الكورسات الموجودة بس
        let totalWatched = 0, totalTaken = 0, totalPassed = 0
        await Promise.all(validCourses.map(async (courseId: string) => {
          try {
            const p: any = await progressAPI.getCourseProgress(courseId)
            totalWatched += p.watched || 0
            totalTaken += p.exam_stats?.taken || 0
            totalPassed += p.exam_stats?.passed || 0
          } catch {}
        }))
        setStats({ watched: totalWatched, exams_taken: totalTaken, exams_passed: totalPassed })
      } catch {}
    }
    loadData()
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    setProfileStatus("idle")
    try {
      await usersAPI.updateProfile({
        first_name: editName.first_name,
        last_name: editName.last_name,
        governorate: editName.governorate || null,
      })
      updateUser({
        first_name: editName.first_name,
        last_name: editName.last_name,
        governorate: editName.governorate,
      })
      setProfileStatus("success")
      setProfileMsg("تم تحديث البيانات بنجاح")
      setIsEditingProfile(false)
    } catch (err: any) {
      setProfileStatus("error")
      setProfileMsg(err.message || "حصل خطأ في حفظ البيانات")
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.new !== passwords.confirm) {
      setPwStatus("error")
      setPwMsg("كلمة المرور الجديدة غير متطابقة")
      return
    }
    if (passwords.new.length < 6) {
      setPwStatus("error")
      setPwMsg("كلمة المرور لازم تكون 6 أحرف على الأقل")
      return
    }
    setIsChangingPw(true)
    setPwStatus("idle")
    try {
      // استخدم الـ auth change-password endpoint
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ old_password: passwords.current, new_password: passwords.new }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "حصل خطأ")
      setPwStatus("success")
      setPwMsg("تم تغيير كلمة المرور بنجاح")
      setIsChangingPassword(false)
      setPasswords({ current: "", new: "", confirm: "" })
    } catch (err: any) {
      setPwStatus("error")
      setPwMsg(err.message || "حصل خطأ في تغيير كلمة المرور")
    } finally {
      setIsChangingPw(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-extrabold text-2xl">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              </div>
              <div>
                <CardTitle className="text-2xl">{user?.first_name} {user?.last_name}</CardTitle>
                <p className="text-muted-foreground text-sm mt-0.5">
                  {gradeLabels[user?.grade || ""] || user?.grade || "طالب"}
                </p>
              </div>
            </div>
            {!isEditingProfile && (
              <Button variant="outline" size="sm" onClick={() => {
                setEditName({
                  first_name: user?.first_name || "",
                  last_name: user?.last_name || "",
                  governorate: user?.governorate || "",
                })
                setIsEditingProfile(true)
                setProfileStatus("idle")
              }}>
                تعديل
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isEditingProfile ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>الاسم الأول</Label>
                  <Input
                    value={editName.first_name}
                    onChange={e => setEditName(p => ({ ...p, first_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>الاسم الأخير</Label>
                  <Input
                    value={editName.last_name}
                    onChange={e => setEditName(p => ({ ...p, last_name: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>المحافظة</Label>
                <Input
                  value={editName.governorate}
                  onChange={e => setEditName(p => ({ ...p, governorate: e.target.value }))}
                  placeholder="القاهرة"
                />
              </div>
              {profileStatus === "error" && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {profileMsg}
                </div>
              )}
              <div className="flex gap-3">
                <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSavingProfile}>
                  {isSavingProfile ? "جاري الحفظ..." : "حفظ التغييرات"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setIsEditingProfile(false)}>
                  إلغاء
                </Button>
              </div>
            </form>
          ) : (
            <>
              {profileStatus === "success" && (
                <div className="flex items-center gap-2 p-3 bg-chart-3/10 rounded-lg text-chart-3 text-sm mb-4">
                  <CheckCircle className="w-4 h-4" />
                  {profileMsg}
                </div>
              )}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">رقم الهاتف</p>
                      <p className="font-medium" dir="ltr">{user?.phone || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <GraduationCap className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">المرحلة الدراسية</p>
                      <p className="font-medium">{gradeLabels[user?.grade || ""] || user?.grade || "—"}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">المحافظة</p>
                      <p className="font-medium">{user?.governorate || "—"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">الكورسات المشترك فيها</p>
                      <p className="font-medium">{user?.enrolled_courses?.length || 0} كورس</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>إحصائياتك</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "كورسات مشترك", value: user?.enrolled_courses?.length || 0, icon: BookOpen, color: "text-primary" },
              { label: "محاضرات اتشافت", value: stats.watched, icon: PlayCircle, color: "text-chart-4" },
              { label: "اختبارات اتجازت", value: `${stats.exams_passed}/${stats.exams_taken}`, icon: FileCheck, color: "text-chart-3" },
            ].map((stat, i) => (
              <div key={i} className="text-center p-4 bg-muted/50 rounded-xl">
                <stat.icon className={`w-8 h-8 ${stat.color} mx-auto mb-2`} />
                <p className="text-2xl font-extrabold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            تغيير كلمة المرور
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pwStatus === "success" && !isChangingPassword && (
            <div className="flex items-center gap-2 p-3 bg-chart-3/10 rounded-lg text-chart-3 text-sm mb-4">
              <CheckCircle className="w-4 h-4" />
              {pwMsg}
            </div>
          )}

          {!isChangingPassword ? (
            <Button variant="outline" onClick={() => { setIsChangingPassword(true); setPwStatus("idle") }}>
              تغيير كلمة المرور
            </Button>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>كلمة المرور الحالية</Label>
                <Input
                  type="password"
                  value={passwords.current}
                  onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>كلمة المرور الجديدة</Label>
                <Input
                  type="password"
                  value={passwords.new}
                  onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <Label>تأكيد كلمة المرور الجديدة</Label>
                <Input
                  type="password"
                  value={passwords.confirm}
                  onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>

              {pwStatus === "error" && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {pwMsg}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  disabled={isChangingPw}
                >
                  {isChangingPw ? "جاري التغيير..." : "حفظ التغييرات"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setIsChangingPassword(false); setPwStatus("idle") }}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}