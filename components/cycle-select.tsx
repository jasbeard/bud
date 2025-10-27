"use client";

import * as React from "react";
import {
  type DateRange,
  type CalendarMonth,
  type Matcher,
} from "react-day-picker";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CycleChoiceCard, CycleChoises } from "./cycle-choice-card";
import { forwardRef } from "react";

export type CycleSelectProps = {
  cycles?: DateRange[];
  onChange?: (next: DateRange[]) => void;
  maxCycles?: number;
  onMaxCyclesChange?: (next: number) => void;
  defaultMonth?: Date;
  numberOfMonths?: number;
  hideNavigation?: boolean;
  showLegend?: boolean;
  showReset?: boolean;
  captionCurrentLabel?: string;
  captionNextLabel?: string;
  className?: string;
  id?: string;
  // Form integration props
  value?: DateRange[];
  name?: string;
};

export const CycleSelect = forwardRef<HTMLDivElement, CycleSelectProps>(
  (
    {
      cycles: cyclesProp,
      onChange: onChangeProp,
      maxCycles: maxCyclesProp = 2,
      onMaxCyclesChange,
      defaultMonth,
      numberOfMonths = 2,
      hideNavigation = true,
      showLegend = true,
      showReset = true,
      captionCurrentLabel = "Current month",
      captionNextLabel = "Next Month",
      className,
      id,
      // Form integration props
      value,
      name,
    },
    ref
  ) => {
    // Use value prop for form integration, fallback to cycles prop for backward compatibility
    const cycles = React.useMemo(
      () => value ?? cyclesProp ?? [],
      [value, cyclesProp]
    );
    const onChange = onChangeProp;
    const maxCycles = maxCyclesProp;
    const [draftCycle, setDraftCycle] = React.useState<DateRange | undefined>();

    // Helper to check if a date is in the current month (first month displayed)
    const isInCurrentMonth = React.useCallback(
      (date: Date) => {
        if (!defaultMonth) return true;
        return (
          date.getFullYear() === defaultMonth.getFullYear() &&
          date.getMonth() === defaultMonth.getMonth()
        );
      },
      [defaultMonth]
    );

    // Helper to check if a cycle is valid (starts in current month)
    const isValidCycle = React.useCallback(
      (cycle: DateRange) => {
        if (!cycle.from) return false;
        return isInCurrentMonth(cycle.from);
      },
      [isInCurrentMonth]
    );

    const handleDayClick = React.useCallback(
      (day: Date) => {
        if (!draftCycle || (draftCycle.from && draftCycle.to)) {
          // Starting a new cycle - must start in current month
          if (cycles.length >= maxCycles) return;
          if (!isInCurrentMonth(day)) return;
          setDraftCycle({ from: day, to: undefined });
          return;
        }

        const start = draftCycle.from!;

        // If clicking before start, swap but ensure start is still in current month
        if (day < start) {
          if (!isInCurrentMonth(day)) return; // New start must be in current month
          const newCycle: DateRange = { from: day, to: start };
          if (isValidCycle(newCycle)) {
            onChange?.([...cycles, newCycle]);
            setDraftCycle(undefined);
          }
        } else if (day.getTime() === start.getTime()) {
          // Single-day range - already validated start is in current month
          const newCycle: DateRange = { from: start, to: start };
          onChange?.([...cycles, newCycle]);
          setDraftCycle(undefined);
        } else {
          // Extending to later date - can be in next month
          const newCycle: DateRange = { from: start, to: day };
          if (isValidCycle(newCycle)) {
            onChange?.([...cycles, newCycle]);
            setDraftCycle(undefined);
          }
        }
      },
      [draftCycle, cycles, maxCycles, onChange, isInCurrentMonth, isValidCycle]
    );

    const handleReset = React.useCallback(() => {
      setDraftCycle(undefined);
      if (cycles.length > 0) onChange?.([]);
    }, [cycles.length, onChange]);

    const { rangeStart, rangeMiddle, rangeEnd } = React.useMemo(() => {
      const list: DateRange[] = draftCycle ? [...cycles, draftCycle] : cycles;

      const startMatchers: Matcher[] = [];
      const endMatchers: Matcher[] = [];
      const middleMatchers: Matcher[] = [];

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
      }

      return {
        rangeStart: startMatchers,
        rangeMiddle: middleMatchers,
        rangeEnd: endMatchers,
      };
    }, [cycles, draftCycle]);

    const handleMaxCyclesChangeInternal = React.useCallback(
      (value: number) => {
        if (!onMaxCyclesChange) return;
        const safe = Number.isFinite(value)
          ? Math.max(1, Math.floor(value))
          : 1;
        onMaxCyclesChange(safe);
        setDraftCycle((draft) => {
          if (!draft || (draft.from && draft.to)) return draft;
          if (cycles.length >= safe) return undefined;
          return draft;
        });
      },
      [onMaxCyclesChange, cycles.length]
    );

    const [cycleChoice, setCycleChoice] = React.useState<
      CycleChoises.MONTHLY | CycleChoises.CUSTOM
    >(CycleChoises.MONTHLY);

    return (
      <div ref={ref} className={`flex flex-col gap-4 ${className || ""}`}>
        {/* part1 */}
        <CycleChoiceCard
          defaultValue={CycleChoises.MONTHLY}
          value={cycleChoice}
          onValueChange={(current) =>
            current === CycleChoises.MONTHLY
              ? setCycleChoice(CycleChoises.MONTHLY)
              : setCycleChoice(CycleChoises.CUSTOM)
          }
        />
        {cycleChoice === CycleChoises.CUSTOM && (
          <div className="w-fit">
            <div className="border rounded-t-xl">
              <div className="flex items-center gap-2 p-2">
                {onMaxCyclesChange && (
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <span>Number of cycles</span>
                    <Input
                      type="number"
                      min={2}
                      value={maxCycles}
                      onChange={(e) =>
                        handleMaxCyclesChangeInternal(
                          parseInt(e.target.value, 10)
                        )
                      }
                      className="w-14 h-auto"
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
                    size="sm"
                    className="ml-auto"
                  >
                    Reset
                  </Button>
                )}
              </div>
            </div>
            {/* part3 */}
            <Calendar
              hideNavigation={hideNavigation}
              modifiers={{
                range_start: rangeStart,
                range_middle: rangeMiddle,
                range_end: rangeEnd,
              }}
              // modifiersStyles={colorStyles}
              onDayClick={handleDayClick}
              numberOfMonths={numberOfMonths}
              defaultMonth={defaultMonth}
              // [--cell-size:--spacing(11)] md:[--cell-size:--spacing(12)]
              className="border [--cell-size:--spacing(6)] md:[--cell-size:--spacing(7.5)]"
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
                      {displayIndex === 0
                        ? captionCurrentLabel
                        : captionNextLabel}
                    </div>
                  );
                },
              }}
            />
            {showLegend && cycles.length > 0 && (
              // part4
              <div
                className={`w-full border border-t-0 p-4 flex items-center gap-2 text-sm" ${
                  cycles.length < 5 && "flex flex-wrap"
                }`}
              >
                {cycles.map((r, i) => (
                  <div key={i} className="font-medium text-sm">
                    <span>
                      Cycle {i + 1}:{" "}
                      {r.from?.toLocaleDateString("en-US", { day: "numeric" })}{" "}
                      — {r.to?.toLocaleDateString("en-US", { day: "numeric" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

CycleSelect.displayName = "CycleSelect";
