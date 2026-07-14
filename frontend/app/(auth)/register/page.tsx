"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Phone, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";

const governorates = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحيرة",
  "الشرقية", "المنوفية", "القليوبية", "كفر الشيخ", "الغربية",
  "دمياط", "بورسعيد", "الإسماعيلية", "السويس", "الفيوم",
  "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا",
  "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد",
  "مطروح", "شمال سيناء", "جنوب سيناء",
];

const grades = [
  { value: "first_preparatory",  label: "الصف الأول الإعدادي" },
  { value: "second_preparatory", label: "الصف الثاني الإعدادي" },
  { value: "third_preparatory",  label: "الصف الثالث الإعدادي" },
  { value: "first_secondary",    label: "الصف الأول الثانوي" },
  { value: "second_secondary",   label: "الصف الثاني الثانوي" },
  { value: "third_secondary",    label: "الصف الثالث الثانوي" },
];

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    parentPhone: "",
    password: "",
    confirmPassword: "",
    gender: "",
    grade: "",
    governorate: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("كلمة المرور غير متطابقة");
      return;
    }
    if (!formData.gender || !formData.grade || !formData.governorate) {
      setError("من فضلك اختر النوع والمرحلة والمحافظة");
      return;
    }

    setIsLoading(true);
    try {
      await authAPI.register({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        parent_phone: formData.parentPhone,
        password: formData.password,
        gender: formData.gender,
        grade: formData.grade,
        governorate: formData.governorate,
      });
      router.push("/login?registered=true");
    } catch (err: any) {
      setError(err.message || "حصل خطأ — حاول تاني");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-12 overflow-y-auto">
        <div className="mx-auto w-full max-w-lg">
          <Link href="/" className="flex items-center gap-2 mb-8">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-BuyHgoZLI0SWgDwWIvZe8lSxWIu1dX.png"
              alt="العلومنجي"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-foreground">إنشاء حساب جديد</h1>
            <p className="mt-2 text-muted-foreground">سجل معانا وابدأ رحلة التفوق</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* الاسم */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">الاسم الأول</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="firstName"
                    placeholder="احمد"
                    value={formData.firstName}
                    onChange={(e) => handleChange("firstName", e.target.value)}
                    className="pr-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">الاسم الأخير</Label>
                <Input
                  id="lastName"
                  placeholder="السعيد"
                  value={formData.lastName}
                  onChange={(e) => handleChange("lastName", e.target.value)}
                  required
                />
              </div>
            </div>

            {/* الهاتف */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">رقم هاتف الطالب</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="01xxxxxxxxx"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    className="pr-10 text-left"
                    dir="ltr"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parentPhone">رقم هاتف ولي الأمر</Label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="parentPhone"
                    type="tel"
                    placeholder="01xxxxxxxxx"
                    value={formData.parentPhone}
                    onChange={(e) => handleChange("parentPhone", e.target.value)}
                    className="pr-10 text-left"
                    dir="ltr"
                    required
                  />
                </div>
              </div>
            </div>

            {/* النوع والمرحلة */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>النوع</Label>
                <Select value={formData.gender} onValueChange={(v) => handleChange("gender", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ذكر</SelectItem>
                    <SelectItem value="female">أنثى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>المرحلة الدراسية</Label>
                <Select value={formData.grade} onValueChange={(v) => handleChange("grade", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المرحلة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel className="text-xs text-muted-foreground">— الإعدادي —</SelectLabel>
                      <SelectItem value="first_preparatory">الصف الأول الإعدادي</SelectItem>
                      <SelectItem value="second_preparatory">الصف الثاني الإعدادي</SelectItem>
                      <SelectItem value="third_preparatory">الصف الثالث الإعدادي</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel className="text-xs text-muted-foreground">— الثانوي —</SelectLabel>
                      <SelectItem value="first_secondary">الصف الأول الثانوي</SelectItem>
                      <SelectItem value="second_secondary">الصف الثاني الثانوي</SelectItem>
                      <SelectItem value="third_secondary">الصف الثالث الثانوي</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* المحافظة */}
            <div className="space-y-2">
              <Label>المحافظة</Label>
              <Select value={formData.governorate} onValueChange={(v) => handleChange("governorate", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر المحافظة" />
                </SelectTrigger>
                <SelectContent>
                  {governorates.map((gov) => (
                    <SelectItem key={gov} value={gov}>{gov}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* كلمة المرور */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className="pr-10 pl-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="********"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    className="pr-10 pl-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6"
              disabled={isLoading}
            >
              {isLoading ? "جاري إنشاء الحساب..." : "اعمل حساب جديد"}
            </Button>
          </form>

          <p className="mt-8 text-center text-muted-foreground">
            عندك حساب بالفعل؟{" "}
            <Link href="/login" className="text-primary font-bold hover:underline">
              سجل دخول
            </Link>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-linear-to-br from-secondary to-secondary/80 items-center justify-center p-12">
        <div className="text-center">
          <div className="relative w-80 h-80 mx-auto mb-8">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/back_ground_teacher-aW1VvT7C4aJ8q9UzQPkekVkNmaXgnZ.png"
              alt=""
              fill
              className="object-contain opacity-30"
            />
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/teacher_pic-mGYVNXqSPGIcSjUAjZ1jmoFlCHW4n6.png"
              alt="د. محمود سعيد"
              fill
              className="object-contain"
            />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-4">انضم لمجتمع العلومنجي</h2>
          <p className="text-white/80 text-lg max-w-sm mx-auto">ابدأ رحلة التفوق الدراسي معانا النهاردة</p>
        </div>
      </div>
    </div>
  );
}