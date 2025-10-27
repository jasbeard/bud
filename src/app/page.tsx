"use client";

import * as React from "react";
import { type DateRange } from "react-day-picker";
import { CycleSelect } from "@/components/cycle-select";

export default function Home() {
  const [maxCycles, setMaxCycles] = React.useState<number>(2);
  const [cycles, setCycles] = React.useState<DateRange[]>([]);

  // Trim cycles if max is reduced
  const handleMaxCyclesChange = React.useCallback((next: number) => {
    const safe = Number.isFinite(next) ? Math.max(1, Math.floor(next)) : 1;
    setMaxCycles(safe);
    setCycles((prev) => (prev.length > safe ? prev.slice(0, safe) : prev));
  }, []);

  const defaultMonth = React.useMemo(() => new Date(2025, 5, 12), []);

  return (
    <>
      <div className="pl-4">
        <CycleSelect
          cycles={cycles}
          onChange={setCycles}
          maxCycles={maxCycles}
          onMaxCyclesChange={handleMaxCyclesChange}
          defaultMonth={defaultMonth}
          numberOfMonths={2}
          showLegend
          captionCurrentLabel="Current month"
          captionNextLabel="Next Month"
        />
      </div>
    </>
  );
}
