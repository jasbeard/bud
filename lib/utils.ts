import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { usePathname } from "next/navigation";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function usePageTitle() {
  const pathname = usePathname() || "/";
  // remove query/hash, strip leading slash, take last segment, decode, hyphens->spaces, capitalize
  const clean = pathname.split(/[?#]/, 1)[0];
  const withoutLeading = clean[0] === "/" ? clean.slice(1) : clean;
  const last = withoutLeading.split("/").filter(Boolean).pop() || "home";
  const human = decodeURIComponent(last).replaceAll("-", " ");
  return human.charAt(0).toUpperCase() + human.slice(1);
}
