"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen } from "lucide-react"
import { useEffect, useState } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"
const BACKEND_URL = API_URL.replace("/api/v1", "")

const gradesMeta = [
  {
    id: "first_preparatory",
    title: "الصف الأول الإعدادي",
    description: "كورسات وشروحات متكاملة لمنهج أولى إعدادي",
    color: "from-blue-400 to-blue-500",
  },
  {
    id: "second_preparatory",
    title: "الصف الثاني الإعدادي",
    description: "كورسات وشروحات متكاملة لمنهج تانية إعدادي",
    color: "from-cyan-400 to-cyan-500",
  },
  {
    id: "third_preparatory",
    title: "الصف الثالث الإعدادي",
    description: "كورسات وشروحات متكاملة لمنهج تالتة إعدادي",
    color: "from-teal-400 to-teal-500",
  },
  {
    id: "first_secondary",
    title: "الصف الأول الثانوي",
    description: "كورسات وشروحات متكاملة لمنهج أولى ثانوي",
    color: "from-primary to-primary/80",
  },
  {
    id: "second_secondary",
    title: "الصف الثاني الثانوي",
    description: "كورسات وشروحات متكاملة لمنهج تانية ثانوي",
    color: "from-secondary to-secondary/80",
  },
  {
    id: "third_secondary",
    title: "الصف الثالث الثانوي",
    description: "كورسات وشروحات متكاملة لمنهج تالتة ثانوي",
    color: "from-chart-3 to-chart-3/80",
  },
]

function resolveImageUrl(url?: string): string | null {
  if (!url) return null
  if (url.startsWith("http://") || url.startsWith("https://")) return url
  return `${BACKEND_URL}${url}`
}

export function GradesSection() {
  const [images, setImages] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch(`${API_URL}/grade-images/`)
      .then(r => r.json())
      .then(data => setImages(data))
      .catch(() => {})
  }, [])

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-balance">
            <span className="text-secondary">السنوات</span>{" "}
            <span className="text-primary">الدراسية</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            اختار سنتك الدراسية وابدأ رحلة التفوق معانا
          </p>
        </div>

        {/* الإعدادي */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex-1 h-px bg-border" />
            <span className="text-sm font-bold text-muted-foreground">المرحلة الإعدادية</span>
            <span className="flex-1 h-px bg-border" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {gradesMeta.slice(0, 3).map(grade => (
              <GradeCard
                key={grade.id}
                grade={grade}
                imageUrl={resolveImageUrl(images[grade.id])}
              />
            ))}
          </div>
        </div>

        {/* الثانوي */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="flex-1 h-px bg-border" />
            <span className="text-sm font-bold text-muted-foreground">المرحلة الثانوية</span>
            <span className="flex-1 h-px bg-border" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {gradesMeta.slice(3).map(grade => (
              <GradeCard
                key={grade.id}
                grade={grade}
                imageUrl={resolveImageUrl(images[grade.id])}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function GradeCard({
  grade,
  imageUrl,
}: {
  grade: typeof gradesMeta[0]
  imageUrl: string | null
}) {
  return (
    <div className="group relative bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-all hover:shadow-lg">
      <div className={`h-40 bg-linear-to-l ${grade.color} flex items-center justify-center relative overflow-hidden`}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={grade.title}
            className="absolute inset-0 w-full h-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = "none" }}
          />
        ) : (
          <BookOpen className="w-16 h-16 text-white/90" />
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2 text-card-foreground">{grade.title}</h3>
        <p className="text-muted-foreground mb-4">{grade.description}</p>
        <Button variant="ghost" asChild className="group/btn hover:text-primary p-0 h-auto">
          <Link href={`/courses?grade=${grade.id}`} className="flex items-center gap-2">
            <span>استعرض الكورسات</span>
            <ArrowLeft className="w-4 h-4 group-hover/btn:-translate-x-1 transition-transform" />
          </Link>
        </Button>
      </div>
    </div>
  )
}