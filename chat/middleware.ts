import { createClient } from "./lib/supabase/middleware"
import { i18nRouter } from "next-i18n-router"
import { NextResponse, type NextRequest } from "next/server"
import i18nConfig from "./i18nConfig"

export async function middleware(request: NextRequest) {
  // Skip i18n for api routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Continue through auth logic below
  } else {
    const i18nResult = i18nRouter(request, i18nConfig)
    if (i18nResult) return i18nResult
  }

  try {
    const { supabase, response } = createClient(request)

    const { data: { session } } = await supabase.auth.getSession()

    if (request.nextUrl.pathname.startsWith('/api/v2/chat')) {
      const cookieCount = request.cookies.getAll().length
      console.log(`🛡️ [Middleware] PATH: ${request.nextUrl.pathname}, SESSION: ${!!session}, COOKIES: ${cookieCount}`)
    }

    const isRootPath = request.nextUrl.pathname === "/" || request.nextUrl.pathname === "/en" || request.nextUrl.pathname === "/zh"

    if (session && isRootPath) {
      const { data: homeWorkspace, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("is_home", true)
        .single()

      if (homeWorkspace) {
        return NextResponse.redirect(
          new URL(`/${homeWorkspace.id}/chat`, request.url)
        )
      }
    }


    return response
  } catch (e) {
    return NextResponse.next({
      request: {
        headers: request.headers
      }
    })
  }
}

export const config = {
  matcher: "/((?!static|.*\\..*|_next|auth).*)"
}
