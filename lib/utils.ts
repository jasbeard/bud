"use client";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { usePathname } from "next/navigation";
import { AppPages } from "./types";
import { type DateRange } from "react-day-picker";

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

// Preset cycle templates
export type CyclePreset = {
  name: string;
  description: string;
  icon?: string;
  type: "monthly" | "preset" | "custom";
  cycles?: Array<{ startDay: number; endDay: number }>;
};

// Helper to convert preset to DateRange at budget cycle (onboarding)
export function presetToDateRanges(
  preset: CyclePreset,
  baseDate: Date
): DateRange[] {
  if (preset.type === "monthly") {
    // Monthly: 1st to last day of month
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    return [
      {
        from: new Date(year, month, 1),
        to: new Date(year, month, lastDay),
      },
    ];
  }

  if (preset.type === "preset" && preset.cycles) {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();

    return preset.cycles.map((cycle) => {
      const from = new Date(year, month, cycle.startDay);
      const to = new Date(year, month, cycle.endDay);
      // Handle end of month edge cases
      if (to.getMonth() !== month) {
        to.setDate(0); // Last day of the month
      }
      return { from, to };
    });
  }

  return [];
}
