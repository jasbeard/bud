import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";
import { AppPages } from "@/lib/types";

// 1. Specify protected routes
const protectedRoutes: string[] = [
  AppPages.DASHBOARD,
  AppPages.BUDGET,
  AppPages.TRANSACTIONS,
  AppPages.ONBOARDING,
  AppPages.BUDGETCYCLE_SETTINGS,
];

export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;

  // Skip middleware for API routes (should be handled by matcher, but extra safety check)
  if (path.startsWith("/api")) {
    return NextResponse.next();
  }

  const isProtectedRoute = protectedRoutes.includes(path);

  // 3. Get better-auth session
  const sessionCookie = getSessionCookie(req);
  console.log("sessiontx: ", sessionCookie);
  // 4. Redirect to /login if the user is not authenticated
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL(AppPages.LOGIN, req.nextUrl));
  }

  // 5. Check onboarding status only when navigating to /onboarding
  // Only call API when explicitly on the onboarding page
  if (sessionCookie && path === AppPages.ONBOARDING) {
    try {
      console.log("Middleware");
      // Call the user API endpoint to check onboarding status
      // Forward all headers to ensure session is properly authenticated
      const apiUrl = new URL("/api/user", req.nextUrl.origin);
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

  // 6. Redirect authenticated users away from login/signup pages
  // Check onboarding status: new users → /onboarding, onboarded users → /budget
  if (sessionCookie && (path === AppPages.LOGIN || path === AppPages.SIGNUP)) {
    try {
      const apiUrl = new URL("/api/user", req.nextUrl.origin);
      const headers = new Headers();
      req.headers.forEach((value, key) => {
        headers.set(key, value);
      });
      const response = await fetch(apiUrl.toString(), { headers });
      if (response.ok) {
        const { isOnboarded } = await response.json();
        const redirectTo = isOnboarded ? AppPages.BUDGET : AppPages.ONBOARDING;
        return NextResponse.redirect(new URL(redirectTo, req.nextUrl));
      }
    } catch (error) {
      console.error("Error checking onboarding status for login/signup redirect:", error);
    }
    // Fallback: redirect to onboarding if we can't check (safer for new users)
    return NextResponse.redirect(new URL(AppPages.ONBOARDING, req.nextUrl));
  }

  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
