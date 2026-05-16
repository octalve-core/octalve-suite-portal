import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password", "/reset-password", "/api/auth"];

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  // Allow public routes through
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    // // If already logged in and hitting login/signup, redirect away
    // if (sessionCookie && (pathname === "/login" || pathname === "/signup")) {
    //   return NextResponse.redirect(new URL("/", request.url));
    // }
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    return response;
  }

  // Protected routes — redirect to login if no session cookie
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const response = NextResponse.next();

  // Prevent caching of pages to ensure the back button triggers a new session check after logout
  response.headers.set("Cache-Control", "no-store, max-age=0, must-revalidate");
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico, static assets (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|octalve-logo\\.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
