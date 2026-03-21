"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageIcon, CheckCircle, AlertCircle, ExternalLink, Upload, Link2 } from "lucide-react"
import { gradeImagesAPI, uploadAPI } from "@/lib/api"

const gradesMeta = [
  { id: "first_preparatory",  label: "الصف الأول الإعدادي" },
  { id: "second_preparatory", label: "الصف الثاني الإعدادي" },
  { id: "third_preparatory",  label: "الصف الثالث الإعدادي" },
  { id: "first_secondary",    label: "الصف الأول الثانوي" },
  { id: "second_secondary",   label: "الصف الثاني الثانوي" },
  { id: "third_secondary",    label: "الصف الثالث الثانوي" },
]

type InputMode = "url" | "upload"

export default function GradeImagesPage() {
  const [images, setImages] = useState<Record<string, string>>({})
  const [inputs, setInputs] = useState<Record<string, string>>({})
  const [modes, setModes] = useState<Record<string, InputMode>>({})
  const [loadingGrade, setLoadingGrade] = useState<string | null>(null)
  const [statusGrade, setStatusGrade] = useState<Record<string, "success" | "error">>({})
  const [uploadingGrade, setUploadingGrade] = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    gradeImagesAPI.getAll()
      .then((data: any) => {
        setImages(data)
        setInputs(data)
      })
      .catch(() => {})
  }, [])

  const handleSave = async (gradeId: string) => {
    setLoadingGrade(gradeId)
    setStatusGrade(prev => ({ ...prev, [gradeId]: undefined as any }))
    try {
      await gradeImagesAPI.update(gradeId, inputs[gradeId] || "")
      setImages(prev => ({ ...prev, [gradeId]: inputs[gradeId] || "" }))
      setStatusGrade(prev => ({ ...prev, [gradeId]: "success" }))
      setTimeout(() => setStatusGrade(prev => ({ ...prev, [gradeId]: undefined as any })), 3000)
    } catch {
      setStatusGrade(prev => ({ ...prev, [gradeId]: "error" }))
    } finally {
      setLoadingGrade(null)
    }
  }

  const handleFileUpload = async (gradeId: string, file: File) => {
    setUploadingGrade(gradeId)
    setStatusGrade(prev => ({ ...prev, [gradeId]: undefined as any }))
    try {
      const { url } = await uploadAPI.image(file)
      // حفظ الـ URL تلقائياً بعد الرفع
      setInputs(prev => ({ ...prev, [gradeId]: url }))
      await gradeImagesAPI.update(gradeId, url)
      setImages(prev => ({ ...prev, [gradeId]: url }))
      setStatusGrade(prev => ({ ...prev, [gradeId]: "success" }))
      setTimeout(() => setStatusGrade(prev => ({ ...prev, [gradeId]: undefined as any })), 3000)
    } catch {
      setStatusGrade(prev => ({ ...prev, [gradeId]: "error" }))
    } finally {
      setUploadingGrade(null)
    }
  }

  const getMode = (gradeId: string): InputMode => modes[gradeId] || "url"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">صور المراحل الدراسية</h1>
        <p className="text-muted-foreground mt-1">
          ضيف صورة لكل مرحلة — هتظهر في الصفحة الرئيسية
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {gradesMeta.map(grade => (
          <Card key={grade.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-primary" />
                {grade.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">

              {/* Preview */}
              <div className="w-full h-36 rounded-xl bg-muted overflow-hidden flex items-center justify-center border border-border relative">
                {images[grade.id] ? (
                  <img
                    src={images[grade.id]}
                    alt={grade.label}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
                  />
                ) : (
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground/40 mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">مفيش صورة</p>
                  </div>
                )}
              </div>

              {/* Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setModes(prev => ({ ...prev, [grade.id]: "url" }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    getMode(grade.id) === "url"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  رابط URL
                </button>
                <button
                  onClick={() => setModes(prev => ({ ...prev, [grade.id]: "upload" }))}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    getMode(grade.id) === "upload"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  رفع من الجهاز
                </button>
              </div>

              {/* URL Mode */}
              {getMode(grade.id) === "url" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">رابط الصورة (URL)</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://example.com/image.jpg"
                      value={inputs[grade.id] || ""}
                      onChange={e => setInputs(prev => ({ ...prev, [grade.id]: e.target.value }))}
                      className="text-left text-xs"
                      dir="ltr"
                      />
                      {inputs[grade.id] && (
                      <a
                        href={inputs[grade.id]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-md border border-border hover:bg-muted transition-colors flex items-center"
                      >
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </a>
                    )}
                  </div>
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={loadingGrade === grade.id || inputs[grade.id] === images[grade.id]}
                    onClick={() => handleSave(grade.id)}
                  >
                    {loadingGrade === grade.id ? "جاري الحفظ..." : "حفظ الصورة"}
                  </Button>
                </div>
              )}

              {/* Upload Mode */}
              {getMode(grade.id) === "upload" && (
                <div className="space-y-1.5">
                  <Label className="text-xs">اختار صورة من جهازك</Label>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={el => { fileRefs.current[grade.id] = el }}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(grade.id, file)
                    }}
                  />
                  <button
                    onClick={() => fileRefs.current[grade.id]?.click()}
                    disabled={uploadingGrade === grade.id}
                    className="w-full border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center gap-2 hover:bg-muted/50 transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {uploadingGrade === grade.id ? "جاري الرفع..." : "اضغط لاختيار صورة"}
                    </span>
                    <span className="text-xs text-muted-foreground/60">JPG, PNG, WebP</span>
                  </button>
                </div>
              )}

              {/* Status */}
              {statusGrade[grade.id] === "success" && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" /> تم الحفظ بنجاح
                </p>
              )}
              {statusGrade[grade.id] === "error" && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> حصل خطأ في الرفع أو الحفظ
                </p>
              )}

            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}