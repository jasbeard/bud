"use client";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { usePathname } from "next/navigation";
import { AppPages } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function usePagePath({
  mode,
}: {
  mode: "path" | "title";
}): AppPages | string | null {
  const pathname = usePathname() || "/";
  // remove query/hash, strip leading slash, take last segment, decode, hyphens->spaces, capitalize
  const clean = pathname.split(/[?#]/, 1)[0];
  const withoutLeading = clean[0] === "/" ? clean.slice(1) : clean;
  const last = withoutLeading.split("/").filter(Boolean).pop() || "home";
  const human = decodeURIComponent(last).replaceAll("-", " ");

  if (mode === "title") {
    return (human.charAt(0).toUpperCase() + human.slice(1)) as string;
  }

  if (mode === "path") {
    return ("/" + human) as AppPages;
  }

  return null;
}
