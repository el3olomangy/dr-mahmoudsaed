"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { KeyRound, CheckCircle, AlertCircle } from "lucide-react"

export default function ActivateCodePage() {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setIsLoading(true)
    setStatus("idle")

    // TODO: Implement actual code activation
    setTimeout(() => {
      setIsLoading(false)
      // Mock response
      if (code === "TEST123") {
        setStatus("success")
        setMessage("تم تفعيل الكود بنجاح! يمكنك الآن الوصول لكورس الكيمياء العضوية")
      } else {
        setStatus("error")
        setMessage("الكود غير صحيح أو منتهي الصلاحية. تأكد من الكود وحاول مرة أخرى")
      }
    }, 1500)
  }

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-extrabold">تفعيل كود الاشتراك</CardTitle>
          <CardDescription>
            أدخل كود الاشتراك اللي حصلت عليه لتفعيل الكورس
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="مثال: ABC123XYZ"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="text-center text-lg font-mono tracking-widest py-6"
                dir="ltr"
                maxLength={20}
              />
            </div>

            {status === "success" && (
              <div className="flex items-start gap-3 p-4 bg-chart-3/10 border border-chart-3/30 rounded-xl">
                <CheckCircle className="w-5 h-5 text-chart-3 flex-shrink-0 mt-0.5" />
                <p className="text-chart-3 text-sm">{message}</p>
              </div>
            )}

            {status === "error" && (
              <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-destructive text-sm">{message}</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-6"
              disabled={isLoading || !code.trim()}
            >
              {isLoading ? "جاري التفعيل..." : "تفعيل الكود"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-xl">
            <h3 className="font-bold text-foreground mb-2">ازاي تحصل على كود؟</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>- من خلال مراكز البيع المعتمدة</li>
              <li>- من خلال الوكلاء والموزعين</li>
              <li>- من خلال التواصل مع فريق العلومنجي</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
