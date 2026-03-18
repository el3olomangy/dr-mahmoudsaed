"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  FileText, 
  FileCheck,
  Play,
  Pause,
  Maximize,
  Volume2
} from "lucide-react"

// Mock lecture data
const lectureData = {
  id: 1,
  title: "مقدمة وأساسيات الكيمياء العضوية",
  courseId: 1,
  courseName: "الكيمياء العضوية",
  unitName: "الوحدة الأولى",
  videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
  duration: "45:00",
  hasAttachment: true,
  attachmentName: "ملف شرح المحاضرة الأولى.pdf",
  hasExam: true,
  examId: 4,
  prevLectureId: null,
  nextLectureId: 2,
}

// Mock student name for watermark
const studentName = "محمد أحمد - 01012345678"

export default function WatchPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [watermarkPosition, setWatermarkPosition] = useState({ x: 50, y: 50 })

  // Moving watermark effect
  useEffect(() => {
    const interval = setInterval(() => {
      setWatermarkPosition({
        x: Math.random() * 60 + 20,
        y: Math.random() * 60 + 20,
      })
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link 
        href={`/dashboard/courses/${lectureData.courseId}`}
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        <span>العودة للكورس</span>
      </Link>

      {/* Video Player */}
      <Card className="overflow-hidden">
        <div className="relative aspect-video bg-black">
          {/* Video */}
          <iframe 
            src={lectureData.videoUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          
          {/* Watermark */}
          <div 
            className="absolute text-white/40 text-sm font-bold pointer-events-none select-none transition-all duration-1000"
            style={{
              left: `${watermarkPosition.x}%`,
              top: `${watermarkPosition.y}%`,
              transform: 'translate(-50%, -50%)',
              textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            {studentName}
          </div>

          {/* Custom Controls Overlay (placeholder) */}
          <div className="absolute bottom-0 right-0 left-0 bg-linear-to-t from-black/80 to-transparent p-4 opacity-0 hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <button className="hover:text-primary transition-colors">
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                <button className="hover:text-primary transition-colors">
                  <Volume2 className="w-5 h-5" />
                </button>
                <span className="text-sm">00:00 / {lectureData.duration}</span>
              </div>
              <button className="hover:text-primary transition-colors">
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
        
        <CardContent className="p-4 md:p-6">
          {/* Lecture Info */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-1">
              {lectureData.courseName} &bull; {lectureData.unitName}
            </p>
            <h1 className="text-xl md:text-2xl font-bold text-foreground">
              {lectureData.title}
            </h1>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              disabled={!lectureData.prevLectureId}
              asChild={!!lectureData.prevLectureId}
            >
              {lectureData.prevLectureId ? (
                <Link href={`/dashboard/watch/${lectureData.prevLectureId}`} className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" />
                  المحاضرة السابقة
                </Link>
              ) : (
                <span className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" />
                  المحاضرة السابقة
                </span>
              )}
            </Button>
            
            <Button
              disabled={!lectureData.nextLectureId}
              asChild={!!lectureData.nextLectureId}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {lectureData.nextLectureId ? (
                <Link href={`/dashboard/watch/${lectureData.nextLectureId}`} className="flex items-center gap-2">
                  المحاضرة التالية
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              ) : (
                <span className="flex items-center gap-2">
                  المحاضرة التالية
                  <ChevronLeft className="w-4 h-4" />
                </span>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Related Content */}
      <div className="grid md:grid-cols-2 gap-4">
        {lectureData.hasAttachment && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-secondary" />
                ملف الشرح
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                {lectureData.attachmentName}
              </p>
              <Button variant="outline" className="w-full">
                عرض الملف
              </Button>
            </CardContent>
          </Card>
        )}

        {lectureData.hasExam && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-chart-4" />
                اختبار المحاضرة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                اختبر نفسك بعد مشاهدة المحاضرة
              </p>
              <Button asChild className="w-full bg-chart-4 hover:bg-chart-4/90 text-white">
                <Link href={`/dashboard/exam/${lectureData.examId}`}>
                  ابدأ الاختبار
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
