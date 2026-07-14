"use client";

import { useEffect, useRef, useState } from "react";
import { gradeImagesAPI, uploadAPI } from "@/lib/api";
import { getImageUrl } from "@/lib/utils/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, Link2, Upload, Loader2, Check } from "lucide-react";

const GRADES = [
  { id: "first_preparatory", title: "الصف الأول الإعدادي" },
  { id: "second_preparatory", title: "الصف الثاني الإعدادي" },
  { id: "third_preparatory", title: "الصف الثالث الإعدادي" },
  { id: "first_secondary", title: "الصف الأول الثانوي" },
  { id: "second_secondary", title: "الصف الثاني الثانوي" },
  { id: "third_secondary", title: "الصف الثالث الثانوي" },
];

export default function GradeImagesPage() {
  const [images, setImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gradeImagesAPI
      .getAll()
      .then(setImages)
      .catch(() => alert("فشل تحميل الصور"))
      .finally(() => setLoading(false));
  }, []);

  const handleSaved = (grade: string, url: string) => {
    setImages((prev) => ({ ...prev, [grade]: url }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">صور السنوات الدراسية</h1>
        <p className="text-muted-foreground mt-1">
          حدد صورة لكل صف دراسي تظهر في الصفحة الرئيسية، إما برابط جوجل درايف أو
          برفع صورة من جهازك.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {GRADES.map((grade) => (
          <GradeImageCard
            key={grade.id}
            gradeId={grade.id}
            title={grade.title}
            currentUrl={images[grade.id] || ""}
            onSaved={(url) => handleSaved(grade.id, url)}
          />
        ))}
      </div>
    </div>
  );
}

function GradeImageCard({
  gradeId,
  title,
  currentUrl,
  onSaved,
}: {
  gradeId: string;
  title: string;
  currentUrl: string;
  onSaved: (url: string) => void;
}) {
  const [driveLink, setDriveLink] = useState("");
  const [savingLink, setSavingLink] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const preview = getImageUrl(currentUrl);

  const saveUrl = async (url: string) => {
    try {
      await gradeImagesAPI.update(gradeId, url);
      onSaved(url);
    } catch (err: any) {
      alert(err.message || "فشل حفظ الصورة");
      throw err;
    }
  };

  const handleSaveDriveLink = async () => {
    if (!driveLink.trim()) return;
    setSavingLink(true);
    try {
      await saveUrl(driveLink.trim());
      setDriveLink("");
    } catch {
      // تم عرض رسالة الخطأ بالفعل داخل saveUrl
    } finally {
      setSavingLink(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadAPI.image(file);
      try {
        await saveUrl(url);
      } catch {
        // تم عرض رسالة الخطأ بالفعل داخل saveUrl
      }
    } catch (err: any) {
      alert(err.message || "فشل رفع الصورة");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* معاينة الصورة الحالية */}
      <div className="h-36 bg-muted relative flex items-center justify-center">
        {preview ? (
          <img
            src={preview}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
        )}
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-md">
          {title}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* رابط جوجل درايف */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
            <Link2 className="w-4 h-4 text-secondary" />
            رابط من Google Drive
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="الصق رابط مشاركة الصورة من درايف هنا"
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
              dir="ltr"
              className="text-left"
            />
            <Button
              onClick={handleSaveDriveLink}
              disabled={savingLink || !driveLink.trim()}
              size="sm"
            >
              {savingLink ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            لازم يكون الملف متاح لأي شخص لديه الرابط (Anyone with the link).
          </p>
        </div>

        {/* أو رفع من الجهاز */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-primary" />
            أو ارفع صورة من جهازك
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={uploading}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary file:text-primary-foreground file:font-medium hover:file:bg-primary/90 file:cursor-pointer cursor-pointer"
          />
          {uploading && (
            <p className="text-xs text-primary flex items-center gap-1 mt-1">
              <Loader2 className="w-3 h-3 animate-spin" /> جاري الرفع...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
