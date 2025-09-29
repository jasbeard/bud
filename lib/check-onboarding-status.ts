"use server";

import { getSessionCookie } from "better-auth/cookies";
import { NextRequest } from "next/server";

export function checkOnboardingStatus(req: NextRequest) {
  const sessionCookie = getSessionCookie(req);
}
