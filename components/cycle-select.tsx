"use client";

import * as React from "react";
import {
  type DateRange,
  type CalendarMonth,
  type Matcher,
} from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CycleSelectProps = {
  cycles: DateRange[];
  onChange: (next: DateRange[]) => void;
  maxCycles: number;
  onMaxCyclesChange?: (next: number) => void;
  defaultMonth?: Date;
  numberOfMonths?: number;
  palette?: string[];
  hideNavigation?: boolean;
  showControls?: boolean;
  showLegend?: boolean;
  showReset?: boolean;
  label?: string;
  captionCurrentLabel?: string;
  captionNextLabel?: string;
  className?: string;
};

export function CycleSelect({
  cycles,
  onChange,
  maxCycles,
  onMaxCyclesChange,
  defaultMonth,
  numberOfMonths = 2,
  palette = [
    "#3b82f6", // blue-500
    "#10b981", // emerald-500
    "#f59e0b", // amber-500
    "#ef4444", // red-500
    "#8b5cf6", // violet-500
    "#06b6d4", // cyan-500
    "#84cc16", // lime-500
  ],
  hideNavigation = true,
  showControls = true,
  showLegend = true,
  showReset = true,
  label = "Create your budget cycle",
  captionCurrentLabel = "Current month",
  captionNextLabel = "Next Month",
  className,
}: CycleSelectProps) {
  const [draftCycle, setDraftCycle] = React.useState<DateRange | undefined>();

  const handleDayClick = React.useCallback(
    (day: Date) => {
      if (!draftCycle || (draftCycle.from && draftCycle.to)) {
        if (cycles.length >= maxCycles) return;
        setDraftCycle({ from: day, to: undefined });
        return;
      }

      const start = draftCycle.from!;
      if (day < start) {
        const newCycle: DateRange = { from: day, to: start };
        onChange([...cycles, newCycle]);
        setDraftCycle(undefined);
      } else if (day.getTime() === start.getTime()) {
        const newCycle: DateRange = { from: start, to: start };
        onChange([...cycles, newCycle]);
        setDraftCycle(undefined);
      } else {
        const newCycle: DateRange = { from: start, to: day };
        onChange([...cycles, newCycle]);
        setDraftCycle(undefined);
      }
    },
    [draftCycle, cycles, maxCycles, onChange]
  );

  const handleReset = React.useCallback(() => {
    setDraftCycle(undefined);
    if (cycles.length > 0) onChange([]);
  }, [cycles.length, onChange]);

  const { rangeStart, rangeMiddle, rangeEnd, colorModifiers, colorStyles } =
    React.useMemo(() => {
      const list: DateRange[] = draftCycle ? [...cycles, draftCycle] : cycles;

      const startMatchers: Matcher[] = [];
      const endMatchers: Matcher[] = [];
      const middleMatchers: Matcher[] = [];

      const colorModifiers: Record<string, Matcher | Matcher[]> = {};
      const colorStyles: Record<string, React.CSSProperties> = {};

      for (let i = 0; i < list.length; i++) {
        const r = list[i];
        if (!r?.from) continue;
        const from = r.from;
        const to = r.to ?? r.from;

        startMatchers.push(from);
        endMatchers.push(to);
        if (to > from) {
          middleMatchers.push({ after: from, before: to });
        }

        const startKey = `cycle${i}_start`;
        const endKey = `cycle${i}_end`;
        const middleKey = `cycle${i}_middle`;
        colorModifiers[startKey] = from;
        colorModifiers[endKey] = to;
        if (to > from) {
          colorModifiers[middleKey] = { after: from, before: to };
        }

        const color = palette[i % palette.length];
        const base: React.CSSProperties = {
          backgroundColor: color,
          color: "#ffffff",
        };
        colorStyles[startKey] = base;
        colorStyles[middleKey] = base;
        colorStyles[endKey] = base;
      }

      return {
        rangeStart: startMatchers,
        rangeMiddle: middleMatchers,
        rangeEnd: endMatchers,
        colorModifiers,
        colorStyles,
      };
    }, [cycles, draftCycle, palette]);

  const handleMaxCyclesChangeInternal = React.useCallback(
    (value: number) => {
      if (!onMaxCyclesChange) return;
      const safe = Number.isFinite(value) ? Math.max(1, Math.floor(value)) : 1;
      onMaxCyclesChange(safe);
      setDraftCycle((draft) => {
        if (!draft || (draft.from && draft.to)) return draft;
        if (cycles.length >= safe) return undefined;
        return draft;
      });
    },
    [onMaxCyclesChange, cycles.length]
  );

  return (
    <div className={cn("w-fit", className)}>
      <Calendar
        hideNavigation={hideNavigation}
        modifiers={{
          range_start: rangeStart,
          range_middle: rangeMiddle,
          range_end: rangeEnd,
          ...colorModifiers,
        }}
        modifiersStyles={colorStyles}
        onDayClick={handleDayClick}
        numberOfMonths={numberOfMonths}
        defaultMonth={defaultMonth}
        className="rounded-t-lg border [--cell-size:--spacing(11)] md:[--cell-size:--spacing(12)]"
        components={{
          Weekday: () => <td />,
          MonthCaption: ({
            displayIndex,
            calendarMonth, // eslint-disable-line @typescript-eslint/no-unused-vars
            ...divProps
          }: {
            calendarMonth: CalendarMonth;
            displayIndex: number;
          } & React.HTMLAttributes<HTMLDivElement>) => {
            return (
              <div {...divProps}>
                {displayIndex === 0 ? captionCurrentLabel : captionNextLabel}
              </div>
            );
          },
        }}
      />
      {showControls && (
        <div className="flex items-center gap-3 p-4 border-t-0 border rounded-b-lg">
          {onMaxCyclesChange && (
            <label className="flex items-center gap-2 text-sm">
              <span>Number of cycles</span>
              <input
                type="number"
                min={1}
                value={maxCycles}
                onChange={(e) =>
                  handleMaxCyclesChangeInternal(parseInt(e.target.value, 10))
                }
                className="w-16 rounded border px-2 py-1"
              />
            </label>
          )}
          <span className="text-xs text-muted-foreground">
            {cycles.length}/{maxCycles} selected
          </span>
          {showReset && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              className="ml-auto cursor-pointer"
            >
              Reset cycles
            </Button>
          )}
        </div>
      )}
      {showLegend && cycles.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          {cycles.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="inline-block size-3 rounded"
                style={{ backgroundColor: palette[i % palette.length] }}
              />
              <span>
                Cycle {i + 1}: {r.from?.toLocaleDateString()} —{" "}
                {r.to?.toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
