"use client";

import * as React from "react";
import { type DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { ModeToggle } from "@/components/mode-toggle";
export default function Home() {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  return (
    <>
      <ModeToggle />
      <Calendar
        mode="range"
        // defaultMonth={dateRange?.from}
        selected={dateRange}
        onSelect={setDateRange}
        numberOfMonths={2}
        className="rounded-lg border shadow-sm"
      />
    </>
  );
}
