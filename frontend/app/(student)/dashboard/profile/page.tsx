"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  User, Phone, MapPin, GraduationCap, Lock,
  BookOpen, PlayCircle, FileCheck, CheckCircle, AlertCircle, Eye, EyeOff
} from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { usersAPI, progressAPI, authAPI, coursesAPI } from "@/lib/api"

const gradeLabels: Record<string, string> = {
  first_secondary: "الصف الأول الثانوي",
  second_secondary: "الصف الثاني الثانوي",
  third_secondary: "الصف الثالث الثانوي",
}

type Status = "idle" | "success" | "error"

export default function ProfilePage() {
  const { user, updateUser } = useAuth()

  // ====== Profile Edit ======
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileStatus, setProfileStatus] = useState<Status>("idle")
  const [profileMsg, setProfileMsg] = useState("")
  const [editName, setEditName] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    governorate: user?.governorate || "",
  })

  // ====== Password Change ======
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isSubmittingPw, setIsSubmittingPw] = useState(false)
  const [pwStatus, setPwStatus] = useState<Status>("idle")
  const [pwMsg, setPwMsg] = useState("")
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" })
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false })

  // ====== Stats ======
  const [stats, setStats] = useState({ watched: 0, exams_taken: 0, exams_passed: 0 })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profileData, coursesData]: [any, any] = await Promise.all([
          usersAPI.getMyProfile(),
          coursesAPI.getAll(),
        ])

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

  // ====== handlers ======

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
      setProfileMsg("تم تحديث البيانات بنجاح ✓")
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
    setPwStatus("idle")

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
    if (passwords.new === passwords.current) {
      setPwStatus("error")
      setPwMsg("كلمة المرور الجديدة لازم تكون مختلفة عن الحالية")
      return
    }

    setIsSubmittingPw(true)
    try {
      await authAPI.changePassword({
        old_password: passwords.current,
        new_password: passwords.new,
      })
      setPwStatus("success")
      setPwMsg("تم تغيير كلمة المرور بنجاح ✓")
      setIsChangingPassword(false)
      setPasswords({ current: "", new: "", confirm: "" })
      setShowPw({ current: false, new: false, confirm: false })
    } catch (err: any) {
      setPwStatus("error")
      setPwMsg(err.message || "حصل خطأ في تغيير كلمة المرور")
    } finally {
      setIsSubmittingPw(false)
    }
  }

  const handleCancelPassword = () => {
    setIsChangingPassword(false)
    setPwStatus("idle")
    setPwMsg("")
    setPasswords({ current: "", new: "", confirm: "" })
    setShowPw({ current: false, new: false, confirm: false })
  }

  // ====== Password Input مع زرار إظهار/إخفاء ======
  const PasswordInput = ({
    label, field, placeholder,
  }: {
    label: string
    field: "current" | "new" | "confirm"
    placeholder?: string
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={showPw[field] ? "text" : "password"}
          value={passwords[field]}
          onChange={e => setPasswords(p => ({ ...p, [field]: e.target.value }))}
          placeholder={placeholder}
          required
          minLength={field !== "current" ? 6 : undefined}
          className="pl-10"
        />
        <button
          type="button"
          onClick={() => setShowPw(p => ({ ...p, [field]: !p[field] }))}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {showPw[field]
            ? <EyeOff className="w-4 h-4" />
            : <Eye className="w-4 h-4" />
          }
        </button>
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ====== Profile Info ====== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
                {user?.gender === "male" || user?.gender === "female" ? (
                  <img
                    src={user.gender === "male" ? "/boy-face.svg" : "/girl-face.svg"}
                    alt="صورة الطالب"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-primary font-extrabold text-2xl">
                    {user?.first_name?.[0]}{user?.last_name?.[0]}
                  </span>
                )}
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
                  <AlertCircle className="w-4 h-4" />{profileMsg}
                </div>
              )}
              <div className="flex gap-3">
                <Button type="submit" disabled={isSavingProfile}>
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
                <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg text-green-600 text-sm mb-4">
                  <CheckCircle className="w-4 h-4" />{profileMsg}
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

      {/* ====== Stats ====== */}
      <Card>
        <CardHeader>
          <CardTitle>إحصائياتك</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "كورسات مشترك", value: user?.enrolled_courses?.length || 0, icon: BookOpen, color: "text-primary" },
              { label: "محاضرات اتشافت", value: stats.watched, icon: PlayCircle, color: "text-blue-500" },
              { label: "اختبارات اتجازت", value: `${stats.exams_passed}/${stats.exams_taken}`, icon: FileCheck, color: "text-green-500" },
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

      {/* ====== Change Password ====== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            تغيير كلمة المرور
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* رسالة النجاح بعد التغيير */}
          {pwStatus === "success" && !isChangingPassword && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg text-green-600 text-sm mb-4">
              <CheckCircle className="w-4 h-4" />{pwMsg}
            </div>
          )}

          {!isChangingPassword ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                لو عاوز تغير كلمة المرور، اضغط الزرار وهتحتاج كلمة المرور الحالية.
                لو نسيتها تواصل مع الدعم.
              </p>
              <Button
                variant="outline"
                onClick={() => { setIsChangingPassword(true); setPwStatus("idle") }}
              >
                <Lock className="w-4 h-4 ml-2" />
                تغيير كلمة المرور
              </Button>
            </div>
          ) : (
            <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
              <PasswordInput label="كلمة المرور الحالية" field="current" />
              <PasswordInput label="كلمة المرور الجديدة" field="new" placeholder="6 أحرف على الأقل" />
              <PasswordInput label="تأكيد كلمة المرور الجديدة" field="confirm" />

              {pwStatus === "error" && (
                <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg text-destructive text-sm">
                  <AlertCircle className="w-4 h-4" />{pwMsg}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={isSubmittingPw}>
                  {isSubmittingPw ? "جاري التغيير..." : "حفظ كلمة المرور"}
                </Button>
                <Button type="button" variant="ghost" onClick={handleCancelPassword}>
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