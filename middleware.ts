import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/19016d58-0868-4e7e-8a4b-3e1c265c5f6d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:5',message:'Middleware executing',data:{pathname:req.nextUrl.pathname,method:req.method},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/19016d58-0868-4e7e-8a4b-3e1c265c5f6d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'middleware.ts:8',message:'Auth check complete',data:{isLoggedIn,hasAuth:!!req.auth},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
  // #endregion

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    const role = req.auth?.user?.role
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  // Protect doctor routes
  if (pathname.startsWith("/doctor")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
    const role = req.auth?.user?.role
    if (role !== "DOCTOR") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}

