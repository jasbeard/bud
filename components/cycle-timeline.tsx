"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles } from "lucide-react";
import { type DateRange } from "react-day-picker";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

// Interactive timeline for creating custom cycles
export function InteractiveCycleTimeline({
  cycles,
  onChange,
  maxCycles,
  onMaxCyclesChange,
  baseDate,
}: {
  cycles: DateRange[];
  onChange: (cycles: DateRange[]) => void;
  maxCycles: number;
  onMaxCyclesChange?: (value: number) => void;
  baseDate: Date;
}) {
  const currentMonth = baseDate.getMonth();
  const currentYear = baseDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Helper to get cycle length in days
  const getCycleLength = React.useCallback((cycle: DateRange): number => {
    if (!cycle.from) return 0;
    if (!cycle.to) return 1;
    const diffTime = Math.abs(cycle.to.getTime() - cycle.from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Inclusive
  }, []);

  // Helper to find next available start day (prevent day overlap in same month)
  const getNextAvailableStartDay = React.useCallback((): number => {
    if (cycles.length === 0) return 1;

    // Find the latest end day in the current month
    // If a cycle ends on Day X in current month, next cycle must start on Day X+1 or later
    const latestEndDayInCurrentMonth = Math.max(
      ...cycles.map((cycle) => {
        if (!cycle.from) return 0;
        if (!cycle.to) return cycle.from.getDate();
        // Only consider cycles that end in the current month (not month-spanning)
        if (cycle.to.getMonth() === cycle.from.getMonth()) {
          return cycle.to.getDate();
        }
        // Month-spanning cycles end in next month, so they don't block current month
        return 0;
      }),
      0
    );

    // Start after the latest cycle ends in current month, or at day 1 if no cycles end in current month
    // Add 1 to ensure no overlap: if last cycle ends on Day 24, next starts on Day 25
    return Math.min(latestEndDayInCurrentMonth + 1, daysInMonth);
  }, [cycles, daysInMonth]);

  // Add a new cycle (default 5 days, starting from next available position)
  const handleAddCycle = React.useCallback(() => {
    if (cycles.length >= maxCycles) return;

    const startDay = getNextAvailableStartDay();
    const defaultLength = 5;
    const endDay = Math.min(startDay + defaultLength - 1, daysInMonth);

    const from = new Date(currentYear, currentMonth, startDay);
    const to = new Date(currentYear, currentMonth, endDay);

    onChange([...cycles, { from, to }]);
  }, [
    cycles,
    maxCycles,
    getNextAvailableStartDay,
    daysInMonth,
    currentYear,
    currentMonth,
    onChange,
  ]);

  // Adjust cycle length (minus button) - supports month-spanning
  const handleDecreaseCycle = React.useCallback(
    (index: number) => {
      const cycle = cycles[index];
      if (!cycle.from) return;

      const currentLength = getCycleLength(cycle);
      if (currentLength <= 1) return; // Can't go below 1 day

      const isCurrentlySpanning =
        cycle.to && cycle.to.getMonth() !== cycle.from.getMonth();
      const startDay = cycle.from.getDate();
      const currentEndDay = cycle.to ? cycle.to.getDate() : startDay;

      let newEndDay: number;
      let isNextMonth: boolean;

      if (isCurrentlySpanning) {
        // Currently spanning months
        if (currentEndDay > 1) {
          // Decrease in next month
          newEndDay = currentEndDay - 1;
          isNextMonth = true;
        } else {
          // Move back to current month at the end
          newEndDay = daysInMonth;
          isNextMonth = false;
        }
      } else {
        // Currently in same month
        newEndDay = Math.max(startDay, currentEndDay - 1);
        isNextMonth = false;
      }

      const to = isNextMonth
        ? new Date(currentYear, currentMonth + 1, newEndDay)
        : new Date(currentYear, currentMonth, newEndDay);

      const newCycles = [...cycles];
      newCycles[index] = { from: cycle.from, to };
      onChange(newCycles);
    },
    [cycles, getCycleLength, daysInMonth, currentYear, currentMonth, onChange]
  );

  // Adjust cycle length (plus button) - supports month-spanning
  const handleIncreaseCycle = React.useCallback(
    (index: number) => {
      const cycle = cycles[index];
      if (!cycle.from) return;

      const isCurrentlySpanning =
        cycle.to && cycle.to.getMonth() !== cycle.from.getMonth();
      const currentEndDay = cycle.to
        ? cycle.to.getDate()
        : cycle.from.getDate();
      const daysInNextMonth = new Date(
        currentYear,
        currentMonth + 2,
        0
      ).getDate();

      let newEndDay: number;
      let isNextMonth = isCurrentlySpanning;

      if (isCurrentlySpanning) {
        // Already spanning months - extend in next month
        newEndDay = Math.min(currentEndDay + 1, daysInNextMonth);
        isNextMonth = true;
      } else {
        // Currently in same month
        if (currentEndDay >= daysInMonth) {
          // Can't extend further in current month, move to next month
          newEndDay = 1;
          isNextMonth = true;
        } else {
          // Check for overlap with next cycle in same month
          const nextCycle = cycles[index + 1];
          let maxEndDay = daysInMonth;

          if (nextCycle?.from && nextCycle.from.getMonth() === currentMonth) {
            // Next cycle starts in current month - prevent overlap
            const nextStartDay = nextCycle.from.getDate();
            maxEndDay = nextStartDay - 1;
          }

          newEndDay = Math.min(currentEndDay + 1, maxEndDay);
          isNextMonth = false;

          // If we hit the limit and can't extend in current month, move to next month
          if (newEndDay >= daysInMonth && currentEndDay < daysInMonth) {
            newEndDay = 1;
            isNextMonth = true;
          }
        }
      }

      const to = isNextMonth
        ? new Date(currentYear, currentMonth + 1, newEndDay)
        : new Date(currentYear, currentMonth, newEndDay);

      const newCycles = [...cycles];
      newCycles[index] = { from: cycle.from, to };
      onChange(newCycles);
    },
    [cycles, daysInMonth, currentYear, currentMonth, onChange]
  );

  // Remove a cycle
  const handleRemoveCycle = React.useCallback(
    (index: number) => {
      const newCycles = cycles.filter((_, i) => i !== index);
      onChange(newCycles);
    },
    [cycles, onChange]
  );

  // Update cycle start day
  const handleUpdateStartDay = React.useCallback(
    (index: number, newStartDay: number) => {
      const cycle = cycles[index];
      if (!cycle.from) return;

      // Validate: must be between 1 and daysInMonth
      const validStartDay = Math.max(1, Math.min(newStartDay, daysInMonth));

      // Validate: must be before end day (within same month)
      const currentEndDay = cycle.to
        ? cycle.to.getDate()
        : cycle.from.getDate();
      const isEndInNextMonth =
        cycle.to && cycle.to.getMonth() !== cycle.from.getMonth();

      // If end is in current month, start must be before end
      if (!isEndInNextMonth && validStartDay >= currentEndDay) return;

      // Check for overlap with previous cycle (only within same month)
      const prevCycle = cycles[index - 1];
      if (prevCycle?.from && prevCycle?.to) {
        const prevEndDay = prevCycle.to.getDate();
        const prevIsNextMonth =
          prevCycle.to.getMonth() !== prevCycle.from.getMonth();

        // Only prevent overlap if both cycles are in the same month
        if (!prevIsNextMonth && validStartDay <= prevEndDay) return;
      }

      const from = new Date(currentYear, currentMonth, validStartDay);
      const to = cycle.to || cycle.from;

      const newCycles = [...cycles];
      newCycles[index] = { from, to };
      onChange(newCycles);
    },
    [cycles, daysInMonth, currentYear, currentMonth, onChange]
  );

  // Update cycle end day (can be in next month if < startDay)
  const handleUpdateEndDay = React.useCallback(
    (index: number, newEndDay: number) => {
      const cycle = cycles[index];
      if (!cycle.from) return;

      const currentStartDay = cycle.from.getDate();
      const daysInNextMonth = new Date(
        currentYear,
        currentMonth + 2,
        0
      ).getDate();

      // Determine if this is a next-month day or current-month day
      let validEndDay: number;
      let isNextMonth = false;

      if (newEndDay < currentStartDay && newEndDay <= daysInMonth) {
        // End day is less than start day - this means it's in the next month
        isNextMonth = true;
        validEndDay = Math.max(1, Math.min(newEndDay, daysInNextMonth));
      } else {
        // End day is in current month
        validEndDay = Math.max(1, Math.min(newEndDay, daysInMonth));
        // But if it's less than start day, it's actually next month
        if (validEndDay < currentStartDay) {
          isNextMonth = true;
          validEndDay = Math.max(1, Math.min(newEndDay, daysInNextMonth));
        }
      }

      // Validate: prevent day overlap within same month, but allow month-spanning
      // If end is in current month, it must be after start day
      if (!isNextMonth) {
        const currentStartDay = cycle.from.getDate();
        if (validEndDay <= currentStartDay) return;
      }

      // Check for overlap with next cycle (only within same month)
      const nextCycle = cycles[index + 1];
      if (nextCycle?.from) {
        const nextStartDay = nextCycle.from.getDate();
        const nextIsNextMonth = nextCycle.from.getMonth() !== currentMonth;

        // Only prevent overlap if both cycles are in the same month
        if (!isNextMonth && !nextIsNextMonth && validEndDay >= nextStartDay)
          return;
        // If our end is in next month and next cycle starts in next month, prevent overlap
        if (isNextMonth && nextIsNextMonth && validEndDay >= nextStartDay)
          return;
      }

      const from = cycle.from;
      const to = isNextMonth
        ? new Date(currentYear, currentMonth + 1, validEndDay)
        : new Date(currentYear, currentMonth, validEndDay);

      const newCycles = [...cycles];
      newCycles[index] = { from, to };
      onChange(newCycles);
    },
    [cycles, daysInMonth, currentYear, currentMonth, onChange]
  );

  // Create visual representation of cycles for timeline preview (two months)
  const { currentMonthBars, nextMonthBars, spanningBars, hasMonthSpanning } =
    React.useMemo(() => {
      const daysInNextMonth = new Date(
        currentYear,
        currentMonth + 2,
        0
      ).getDate();
      const currentBars: React.ReactNode[] = [];
      const nextBars: React.ReactNode[] = [];
      const spanningBarsList: React.ReactNode[] = [];
      let hasSpanning = false;

      cycles.forEach((cycle, index) => {
        if (!cycle.from) return;
        const startDay = cycle.from.getDate();
        const endDay = cycle.to ? cycle.to.getDate() : startDay;
        const isSpanningMonths =
          cycle.to && cycle.to.getMonth() !== cycle.from.getMonth();

        if (isSpanningMonths) {
          hasSpanning = true;
        }

        if (isSpanningMonths) {
          // Cycle spans both months - create two connected bars
          const daysInCurrentMonth = new Date(
            currentYear,
            currentMonth + 1,
            0
          ).getDate();
          const daysFromStart = daysInCurrentMonth - startDay + 1;

          // Current month portion
          const currentWidth = (daysFromStart / daysInMonth) * 100;
          const currentLeft = ((startDay - 1) / daysInMonth) * 100;

          // Next month portion
          const nextWidth = (endDay / daysInNextMonth) * 100;
          const nextLeft = 0;

          currentBars.push(
            <div
              key={`current-${index}`}
              className="absolute h-8 rounded-l-md border-l border-t border-b bg-primary/20 border-primary/40 flex items-center justify-center text-xs font-medium text-primary"
              style={{
                left: `${currentLeft}%`,
                width: `${currentWidth}%`,
              }}
            >
              <span className="truncate px-1">{startDay}</span>
            </div>
          );

          nextBars.push(
            <div
              key={`next-${index}`}
              className="absolute h-8 rounded-r-md border-r border-t border-b bg-primary/20 border-primary/40 flex items-center justify-center text-xs font-medium text-primary"
              style={{
                left: `${nextLeft}%`,
                width: `${nextWidth}%`,
              }}
            >
              <span className="truncate px-1">{endDay}</span>
            </div>
          );

          // Add a visual connector indicator (shown as a small arrow/line)
          // This will be positioned at the end of current month bar
          spanningBarsList.push(
            <div
              key={`span-${index}`}
              className="absolute top-1/2 -translate-y-1/2 flex items-center"
              style={{
                left: `${currentLeft + currentWidth}%`,
              }}
            >
              <div className="h-0.5 w-2 bg-primary/40" />
              <div className="w-0 h-0 border-l-[4px] border-l-primary/40 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent" />
            </div>
          );
        } else {
          // Cycle is only in current month
          const width = ((endDay - startDay + 1) / daysInMonth) * 100;
          const left = ((startDay - 1) / daysInMonth) * 100;

          currentBars.push(
            <div
              key={`current-${index}`}
              className="absolute h-8 rounded-md border bg-primary/20 border-primary/40 flex items-center justify-center text-xs font-medium text-primary"
              style={{
                left: `${left}%`,
                width: `${width}%`,
              }}
            >
              <span className="truncate px-1">
                {startDay}-{endDay}
              </span>
            </div>
          );
        }
      });

      return {
        currentMonthBars: currentBars,
        nextMonthBars: nextBars,
        spanningBars: spanningBarsList,
        hasMonthSpanning: hasSpanning,
      };
    }, [cycles, daysInMonth, currentYear, currentMonth]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium mb-1">Create custom cycles</h3>
            <span>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    tabIndex={0}
                    className="ml-1 group rounded-full p-0.5 hover:bg-muted transition"
                    aria-label="How to span months"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-help-circle w-4 h-4 text-muted-foreground"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8.5 9.5a3.5 3.5 0 0 1 7 0c0 1.5-2 2.5-2 2.5" />
                      <path d="M12 17h.01" />
                    </svg>
                  </button>
                </HoverCardTrigger>
                <HoverCardContent side="top" className="w-56 text-xs">
                  Add and customize cycles below.
                  <br />
                  <strong>To span months:</strong> Set the end day{" "}
                  <em>before</em> the start day.
                  <br />
                  <span className="text-muted-foreground">
                    (e.g., 25-9 goes from day 25 to day 9 next month)
                  </span>
                </HoverCardContent>
              </HoverCard>
            </span>
          </div>
        </div>
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
          <div className="flex items-center gap-4 md:gap-2">
            {onMaxCyclesChange && (
              <label className="flex items-center gap-2 text-sm font-medium">
                <span>Max cycles:</span>
                <Input
                  type="number"
                  min={1}
                  max={12}
                  value={maxCycles}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    if (!isNaN(value) && value >= 1 && value <= 12) {
                      onMaxCyclesChange(value);
                    }
                  }}
                  className="w-16 h-auto"
                />
              </label>
            )}
            <span className="text-xs text-muted-foreground">
              {cycles.length}/{maxCycles} cycles
            </span>
          </div>
          <Button
            type="button"
            variant="default"
            onClick={handleAddCycle}
            size="sm"
            disabled={cycles.length >= maxCycles}
          >
            + Add Cycle
          </Button>
        </div>
      </div>

      {/* Cycle bars with controls */}
      {cycles.length > 0 && (
        <div className="space-y-3">
          {cycles.map((cycle, index) => {
            if (!cycle.from) return null;
            const startDay = cycle.from.getDate();
            const endDay = cycle.to ? cycle.to.getDate() : startDay;
            const isSpanningMonths =
              cycle.to && cycle.to.getMonth() !== cycle.from.getMonth();
            const daysInNextMonth = new Date(
              currentYear,
              currentMonth + 2,
              0
            ).getDate();
            const length = getCycleLength(cycle);

            return (
              <div
                key={index}
                className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30"
              >
                {/* Minus button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleDecreaseCycle(index)}
                  disabled={length <= 1}
                  className="h-8 w-8 p-0"
                >
                  −
                </Button>

                {/* Cycle representation with editable inputs */}
                <div className="flex-1 flex items-center justify-center gap-2">
                  <div className="text-center w-full">
                    <div className="text-xs text-muted-foreground mb-1">
                      Cycle {index + 1}
                    </div>
                    <div className="flex items-center gap-2 justify-center pb-4">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          Day
                        </span>
                        <Input
                          type="number"
                          min={1}
                          max={daysInMonth}
                          value={startDay}
                          onChange={(e) => {
                            const value = parseInt(e.target.value, 10);
                            if (!isNaN(value)) {
                              handleUpdateStartDay(index, value);
                            }
                          }}
                          className="w-16 h-7 text-sm text-center font-medium"
                        />
                      </div>
                      <span className="text-muted-foreground">-</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          Day
                        </span>
                        <div className="relative">
                          <Input
                            type="number"
                            min={1}
                            max={
                              isSpanningMonths ? daysInNextMonth : daysInMonth
                            }
                            value={endDay}
                            onChange={(e) => {
                              const value = parseInt(e.target.value, 10);
                              if (!isNaN(value)) {
                                handleUpdateEndDay(index, value);
                              }
                            }}
                            placeholder={
                              isSpanningMonths ? "Next month" : "End day"
                            }
                            className="w-16 h-7 text-sm text-center font-medium"
                          />
                          {!isSpanningMonths && endDay >= startDay && (
                            <span
                              className="absolute -bottom-4 left-0 right-0 text-[10px] text-muted-foreground whitespace-nowrap"
                              title="Enter a number less than start day to span to next month"
                            >
                              Tip: &lt;{startDay} = next month
                            </span>
                          )}
                        </div>
                        {isSpanningMonths && (
                          <span className="text-xs text-muted-foreground">
                            (next month)
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {length} day{length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                {/* Plus button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleIncreaseCycle(index)}
                  className="h-8 w-8 p-0"
                >
                  +
                </Button>

                {/* Remove button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCycle(index)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  ×
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Timeline preview - two months */}
      {cycles.length > 0 && (
        <div className="p-4 border rounded-lg bg-muted/30">
          <div className="mb-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Timeline Preview
            </h4>
          </div>
          <div className="space-y-3">
            {/* Current Month */}
            <div>
              <div className="text-xs text-muted-foreground mb-1.5">
                Current Month
              </div>
              <div className="relative h-8 bg-background rounded border">
                {currentMonthBars}
                {hasMonthSpanning && spanningBars}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground px-1 mt-1">
                <span>Day 1</span>
                <span>Day {daysInMonth}</span>
              </div>
            </div>

            {/* Next Month - only show if cycles span into next month */}
            {hasMonthSpanning && (
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">
                  Next Month
                </div>
                <div className="relative h-8 bg-background rounded border">
                  {nextMonthBars}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground px-1 mt-1">
                  <span>Day 1</span>
                  <span>
                    Day {new Date(currentYear, currentMonth + 2, 0).getDate()}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {cycles.length === 0 && (
        <div className="p-8 border rounded-lg bg-muted/30 text-center">
          <p className="text-sm text-muted-foreground">
            Click &quot;Add Cycle&quot; to create your first budget cycle
          </p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        These cycles will repeat every month automatically.
      </p>
    </div>
  );
}

// Component to preview cycles on a timeline (read-only)
export function CycleTimelinePreview({
  cycles,
  baseDate,
}: {
  cycles: DateRange[];
  baseDate: Date;
}) {
  if (cycles.length === 0) return null;

  const currentMonth = baseDate.getMonth();
  const currentYear = baseDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Create a visual representation
  const cycleBars = cycles.map((cycle, index) => {
    if (!cycle.from) return null;
    const startDay = cycle.from.getDate();
    const endDay = cycle.to ? cycle.to.getDate() : startDay;
    const width = ((endDay - startDay + 1) / daysInMonth) * 100;
    const left = ((startDay - 1) / daysInMonth) * 100;

    return (
      <div
        key={index}
        className="absolute h-8 rounded-md bg-primary/20 border border-primary/40 flex items-center justify-center text-xs font-medium text-primary"
        style={{
          left: `${left}%`,
          width: `${width}%`,
        }}
      >
        <span className="truncate px-1">
          {startDay}-{endDay}
        </span>
      </div>
    );
  });

  return (
    <div className="mt-4 p-4 border rounded-lg bg-muted/30">
      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        Preview: How your cycles will repeat
      </h4>
      <div className="relative h-8 bg-background rounded border mb-2">
        {cycleBars}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        <span>Day 1</span>
        <span>Day {daysInMonth}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        These cycles will repeat every month automatically.
      </p>
    </div>
  );
}
