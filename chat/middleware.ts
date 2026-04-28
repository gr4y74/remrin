import { createClient } from "./lib/supabase/middleware"
import { i18nRouter } from "next-i18n-router"
import { NextResponse, type NextRequest } from "next/server"
import i18nConfig from "./i18nConfig"

export async function middleware(request: NextRequest) {
  // Skip i18n and heavy auth for isolated projects and api
  const isolatedPaths = ['/api', '/game', '/rem', '/sudodo'];
  if (isolatedPaths.some(path => request.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next()
  }

  const i18nResult = i18nRouter(request, i18nConfig)
  if (i18nResult) return i18nResult

  try {
    const { supabase, response } = createClient(request)

    const { data: { user } } = await supabase.auth.getUser()

    const isRootPath = request.nextUrl.pathname === "/" || request.nextUrl.pathname === "/en" || request.nextUrl.pathname === "/zh"

    if (user && isRootPath) {
      const { data: homeWorkspace, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("user_id", user.id)
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
  matcher: "/((?!static|.*\\..*|_next|auth|rem|sudodo|game).*)"
}
