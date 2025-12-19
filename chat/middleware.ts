// TEMP: Minimal middleware to test Edge Runtime __dirname error
// Original imports commented out to isolate the issue
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Just pass through - no external imports
  return NextResponse.next()
}

export const config = {
  matcher: "/((?!api|static|.*\\..*|_next|auth).*)"
}
