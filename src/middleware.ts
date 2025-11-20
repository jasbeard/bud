import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";
import { AppPages } from "@/lib/types";

// 1. Specify protected and public routes
const protectedRoutes: string[] = [
  AppPages.DASHBOARD,
  AppPages.BUDGET,
  AppPages.ONBOARDING,
];
const publicRoutes: string[] = [AppPages.LOGIN, AppPages.SIGNUP, AppPages.HOME];

export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = publicRoutes.includes(path);

  // 3. Get better-auth session
  const sessionCookie = getSessionCookie(req);
  console.log("sessiontx: ", sessionCookie);
  // 4. Redirect to /login if the user is not authenticated
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL(AppPages.LOGIN, req.nextUrl));
  }

  // 5. Check onboarding status only when navigating to /onboarding
  if (sessionCookie && path === AppPages.ONBOARDING) {
    try {
      // Call the onboarding API endpoint to check status
      // Forward all headers to ensure session is properly authenticated
      const apiUrl = new URL("/api/onboarding", req.nextUrl.origin);
      const headers = new Headers();
      req.headers.forEach((value, key) => {
        headers.set(key, value);
      });

      const response = await fetch(apiUrl.toString(), {
        headers,
      });

      if (response.ok) {
        const { isOnboarded } = await response.json();

        // Redirect from /onboarding to /budget if already onboarded
        if (isOnboarded) {
          return NextResponse.redirect(new URL(AppPages.BUDGET, req.nextUrl));
        }
      }
    } catch (error) {
      // If there's an error checking onboarding status, allow the request to proceed
      // This prevents middleware from breaking if there's a database issue
      console.error("Error checking onboarding status in middleware:", error);
    }
  }

  // 6. Redirect to /budget if the user is authenticated on public routes
  if (
    isPublicRoute &&
    sessionCookie &&
    !req.nextUrl.pathname.startsWith(AppPages.BUDGET)
  ) {
    return NextResponse.redirect(new URL(AppPages.BUDGET, req.nextUrl));
  }

  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
