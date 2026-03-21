import { NextRequest, NextResponse } from "next/server"

const PROTECTED_PATHS = ["/dashboard"]

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("token")?.value

  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p))

  // لو حاول يدخل dashboard من غير login — روحه للـ login
  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}