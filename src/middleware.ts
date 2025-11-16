import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";
import { AppPages } from "@/lib/types";

// 1. Specify protected and public routes
const protectedRoutes: string[] = [
  AppPages.DASHBOARD,
  AppPages.BUDGET,
  AppPages.ONBOARDING,
  AppPages.ONBOARDINGPOC,
];
const publicRoutes: string[] = [AppPages.LOGIN, AppPages.SIGNUP, AppPages.HOME];

export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.includes(path);
  const isPublicRoute = publicRoutes.includes(path);

  // 3. get better-auth session
  // const session = await auth.api.getSession({
  //   headers: await headers(),
  // });

  const sessionCookie = getSessionCookie(req);
  console.log("sessiontx: ", sessionCookie);
  // 4. Redirect to /login if the user is not authenticated
  if (isProtectedRoute && !sessionCookie) {
    return NextResponse.redirect(new URL(AppPages.LOGIN, req.nextUrl));
  }

  // 5. Redirect to /budget if the user is authenticated
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
