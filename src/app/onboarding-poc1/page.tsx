"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { InputWithInfoTooltip } from "@/components/input-with-info-tooltip";
import { Input } from "@/components/ui/input";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import * as React from "react";
import {
  MoveRight,
  CheckCircle,
  Circle,
  HelpCircle,
  Info,
  Sparkles,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { type DateRange } from "react-day-picker";

const formSchema = z.object({
  budgetspace: z
    .string()
    .min(1, "Budgetspace name is required")
    .min(2, "Budgetspace name must be at least 2 characters")
    .max(50, "Budgetspace name must be less than 50 characters")
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      "Only letters, numbers, spaces, hyphens, and underscores are allowed"
    ),
  cycles: z
    .array(
      z.object({
        from: z.date(),
        to: z.date().optional(),
      })
    )
    .min(1, "At least one budget cycle is required")
    .optional(),
  maxCycles: z.number().min(1).max(12).optional(),
  cycleType: z.enum(["monthly", "custom"]),
});

type FormData = z.infer<typeof formSchema>;

// Define onboarding steps
const onboardingSteps = [
  {
    id: "budgetspace",
    title: "Create Budgetspace",
    description: "Set up your first budgetspace to organize your finances",
  },
  {
    id: "cycle",
    title: "Choose Budget Cycle",
    description: "Select how often you want to track your budget",
  },
  {
    id: "categories",
    title: "Set Up Categories",
    description: "Create spending categories for better organization",
  },
];

// Preset cycle templates
type CyclePreset = {
  name: string;
  description: string;
  icon?: string;
  type: "monthly" | "preset" | "custom";
  cycles?: Array<{ startDay: number; endDay: number }>;
};

const cyclePresets: CyclePreset[] = [
  {
    name: "Monthly",
    description: "Standard monthly budget (1st to last day of each month)",
    icon: "📆",
    type: "monthly",
  },
  {
    name: "Bi-weekly",
    description: "Perfect for bi-weekly paychecks (every 2 weeks)",
    icon: "💰",
    type: "preset",
    cycles: [
      { startDay: 1, endDay: 14 },
      { startDay: 15, endDay: 28 },
    ],
  },
  {
    name: "Semi-monthly",
    description: "1st-15th and 16th-end of month",
    icon: "📅",
    type: "preset",
    cycles: [
      { startDay: 1, endDay: 15 },
      { startDay: 16, endDay: 31 },
    ],
  },
  {
    name: "Weekly",
    description: "Four cycles per month",
    icon: "📆",
    type: "preset",
    cycles: [
      { startDay: 1, endDay: 7 },
      { startDay: 8, endDay: 14 },
      { startDay: 15, endDay: 21 },
      { startDay: 22, endDay: 28 },
    ],
  },
  {
    name: "Custom",
    description: "Create your own cycles with overlapping or multiple periods",
    icon: "⚙️",
    type: "custom",
  },
];

// Helper to convert preset to DateRange
function presetToDateRanges(preset: CyclePreset, baseDate: Date): DateRange[] {
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

// Interactive timeline for creating custom cycles
function InteractiveCycleTimeline({
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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium mb-1">Create your cycles</h3>
          <p className="text-xs text-muted-foreground">
            Add cycles and adjust their length using the buttons below. To span
            into the next month, set the end day to a number less than the start
            day (e.g., Day 25-9 spans from Day 25 to Day 9 of next month).
          </p>
        </div>
        <div className="flex items-center gap-2">
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
function CycleTimelinePreview({
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

export default function Page() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [completedSteps, setCompletedSteps] = React.useState<number[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isCheckingExisting, setIsCheckingExisting] = React.useState(true);
  // Default to Monthly preset
  const [selectedPreset, setSelectedPreset] =
    React.useState<CyclePreset | null>(
      cyclePresets.find((p) => p.type === "monthly") || null
    );

  const defaultMonth = React.useMemo(() => new Date(2025, 5, 12), []);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      budgetspace: "",
      cycles: [],
      maxCycles: 2,
      cycleType: "monthly",
    },
  });

  // Initialize with Monthly preset on mount
  React.useEffect(() => {
    if (selectedPreset?.type === "monthly") {
      const dateRanges = presetToDateRanges(selectedPreset, defaultMonth);
      const validRanges = dateRanges.filter(
        (r): r is { from: Date; to?: Date } => !!r.from
      );
      form.setValue("cycles", validRanges);
      form.setValue("cycleType", "monthly");
      form.setValue("maxCycles", 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const watchedCycles = form.watch("cycles");

  // Check for existing budget spaces and cycles on component mount
  React.useEffect(() => {
    const checkExistingData = async () => {
      try {
        const session = await authClient.getSession();
        if (!session?.data?.user?.id) {
          setIsCheckingExisting(false);
          return;
        }

        // Check for existing budget spaces
        const budgetspaceResponse = await fetch("/api/budgetspaces");
        let budgetspaceExists = false;

        if (budgetspaceResponse.ok) {
          const budgetspace = await budgetspaceResponse.json();
          // User already has a budget space, pre-populate with it
          form.reset({
            budgetspace: budgetspace.name,
            cycles: [],
            maxCycles: 2,
            cycleType: "custom",
          });
          budgetspaceExists = true;
          setCompletedSteps((prev) => [...prev, 0]);
        }

        // Check for existing budget cycles
        const cyclesResponse = await fetch("/api/budgetcycles");
        let cyclesExist = false;
        if (cyclesResponse.ok) {
          const existingCycles = await cyclesResponse.json();
          if (existingCycles.length > 0) {
            setCompletedSteps((prev) => [...prev, 1]);
            cyclesExist = true;
          }
        }

        // Determine which step to start on
        if (budgetspaceExists && cyclesExist) {
          setCurrentStep(2); // Skip to categories step
        } else if (budgetspaceExists) {
          setCurrentStep(1); // Skip to cycles step
        }
        // If budget space doesn't exist, stay on step 0
      } catch (error) {
        console.error("Error checking existing data:", error);
      } finally {
        setIsCheckingExisting(false);
      }
    };

    checkExistingData();
  }, [form]);

  const handleNext = async () => {
    if (currentStep < onboardingSteps.length - 1) {
      // Validate current step
      const fieldsToValidate =
        currentStep === 0 ? ["budgetspace" as const] : ["cycles" as const];
      const isValid = await form.trigger(fieldsToValidate);

      if (isValid) {
        setCompletedSteps((prev) => [...prev, currentStep]);
        setCurrentStep(currentStep + 1);
        setError(null); // Clear any previous errors
      }
    } else {
      // Final step - submit all data
      await handleCompleteOnboarding();
    }
  };

  const handleCompleteOnboarding = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    setIsLoading(true);
    setError(null);

    try {
      const formData = form.getValues();

      // Convert cycles data to API format
      const cycleDates =
        formData.cycles?.map((cycle) => ({
          startDate: cycle.from?.getDate() || 1,
          endDate: cycle.to?.getDate() || 31,
        })) || [];

      const onboardingData = {
        budgetspace: {
          name: formData.budgetspace,
        },
        cycles: {
          type: formData.cycleType,
          dates: formData.cycleType === "custom" ? cycleDates : undefined,
        },
      };

      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(onboardingData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to complete onboarding");
      }

      const result = await response.json();
      console.log("Onboarding completed:", result);

      // Mark final step as completed
      setCompletedSteps((prev) => [...prev, currentStep]);

      // Redirect to dashboard or next page
      // You can add navigation logic here
      console.log("Onboarding completed successfully!");
    } catch (err) {
      console.error("Error completing onboarding:", err);
      setError(
        err instanceof Error ? err.message : "Failed to complete onboarding"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetSelect = (preset: CyclePreset) => {
    setSelectedPreset(preset);

    if (preset.type === "monthly") {
      const dateRanges = presetToDateRanges(preset, defaultMonth);
      const validRanges = dateRanges.filter(
        (r): r is { from: Date; to?: Date } => !!r.from
      );
      form.setValue("cycles", validRanges);
      form.setValue("cycleType", "monthly");
      form.setValue("maxCycles", 1);
    } else if (preset.type === "preset") {
      const dateRanges = presetToDateRanges(preset, defaultMonth);
      const validRanges = dateRanges.filter(
        (r): r is { from: Date; to?: Date } => !!r.from
      );
      form.setValue("cycles", validRanges);
      form.setValue("cycleType", "custom");
      form.setValue("maxCycles", preset.cycles?.length || 2);
    } else if (preset.type === "custom") {
      // Clear cycles and let user build custom
      form.setValue("cycles", []);
      form.setValue("cycleType", "custom");
      form.setValue("maxCycles", 2);
    }
  };

  const renderStepContent = () => {
    // Show loading state while checking for existing budget spaces
    if (isCheckingExisting) {
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Loading...</h2>
            <p className="text-muted-foreground">
              Checking your existing budget spaces...
            </p>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Create Budgetspace</h2>
              <p className="text-muted-foreground">
                Set up your first budgetspace to organize your finances and
                start budgeting.
              </p>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                {error}
              </div>
            )}

            <Form {...form}>
              <form className="space-y-6">
                <FormField
                  control={form.control}
                  name="budgetspace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budgetspace Name</FormLabel>
                      <FormControl>
                        <InputWithInfoTooltip
                          placeholder="e.g., Household"
                          type="text"
                          tooltipMessage="letters, numbers, spaces, hyphens, and underscores are okay"
                          className=" max-w-sm"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Choose Budget Cycle</h2>
              <p className="text-muted-foreground">
                Select how often you want to track and review your budget.
              </p>
            </div>

            {/* Enhanced explanation card */}
            <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  What is a budget cycle?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <CardDescription className="text-sm">
                  A budget cycle is the period you track your spending. Most
                  people use monthly cycles, but you might need custom cycles if
                  you:
                </CardDescription>
                <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside ml-2">
                  <li>Get paid bi-weekly and want cycles aligned to paydays</li>
                  <li>Have multiple income sources with different schedules</li>
                  <li>
                    Want overlapping cycles (e.g., rent cycle vs. spending
                    cycle)
                  </li>
                </ul>
              </CardContent>
            </Card>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                {error}
              </div>
            )}

            <Form {...form}>
              <form className="space-y-6">
                <FormField
                  control={form.control}
                  name="cycles"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="space-y-4">
                          {/* All preset templates */}
                          <div className="space-y-3">
                            <div>
                              <h3 className="text-sm font-medium mb-2">
                                Choose your budget cycle
                              </h3>
                              <p className="text-xs text-muted-foreground mb-3">
                                Select a preset or create your own custom
                                cycles.
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {cyclePresets.map((preset) => {
                                  const isSelected =
                                    selectedPreset?.name === preset.name;
                                  return (
                                    <Card
                                      key={preset.name}
                                      className={`cursor-pointer transition-colors py-4 ${
                                        isSelected
                                          ? "border-primary bg-primary/5"
                                          : "hover:border-primary"
                                      }`}
                                      onClick={() => handlePresetSelect(preset)}
                                    >
                                      <CardHeader className="pb-2">
                                        <CardTitle className="text-sm flex items-center gap-2">
                                          {preset.icon && (
                                            <span>{preset.icon}</span>
                                          )}
                                          {preset.name}
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                          {preset.description}
                                        </CardDescription>
                                      </CardHeader>
                                    </Card>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* Interactive timeline for custom cycles */}
                          {selectedPreset?.type === "custom" && (
                            <InteractiveCycleTimeline
                              cycles={field.value || []}
                              onChange={field.onChange}
                              maxCycles={form.watch("maxCycles") || 2}
                              onMaxCyclesChange={(value) =>
                                form.setValue("maxCycles", value)
                              }
                              baseDate={defaultMonth}
                            />
                          )}

                          {/* Visual timeline preview - show for non-custom presets when cycles are selected */}
                          {selectedPreset?.type !== "custom" &&
                            watchedCycles &&
                            watchedCycles.length > 0 && (
                              <CycleTimelinePreview
                                cycles={watchedCycles}
                                baseDate={defaultMonth}
                              />
                            )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Set Up Categories</h2>
              <p className="text-muted-foreground">
                Create spending categories to organize your transactions.
              </p>
            </div>

            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Category setup coming soon...
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Steps Navigation */}
      <div className="w-80 border-r bg-muted/30 p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Budget Setup</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Get started with bud by completing these essential steps. Make
              sure to review your information carefully.
            </p>
          </div>

          <div className="space-y-4">
            {onboardingSteps.map((step, index) => {
              const isCompleted = completedSteps.includes(index);
              const isCurrent = currentStep === index;

              return (
                <div key={step.id}>
                  <Item
                    variant={isCurrent ? "default" : "muted"}
                    className={`cursor-pointer transition-colors ${
                      isCurrent ? "bg-background shadow-sm" : ""
                    }`}
                  >
                    <ItemMedia>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : isCurrent ? (
                        <Circle className="h-5 w-5 text-blue-500 fill-blue-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300" />
                      )}
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle
                        className={
                          isCurrent
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }
                      >
                        {step.title}
                      </ItemTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.description}
                      </p>
                    </ItemContent>
                  </Item>
                  {index < onboardingSteps.length - 1 && (
                    <Separator className="ml-6 mt-2" />
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <HelpCircle className="h-4 w-4 mr-2" />
              Need Help?
            </Button>
          </div>
        </div>
      </div>

      {/* Right Panel - Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-8">
          <div className="max-w-2xl">{renderStepContent()}</div>
        </div>

        {/* Bottom Navigation */}
        <div className="border-t p-6">
          <div className="flex justify-between items-center max-w-2xl">
            <Button
              variant="ghost"
              disabled={currentStep === 0 || isCheckingExisting}
              onClick={() => {
                setError(null); // Clear any errors when going back
                setCurrentStep(currentStep - 1);
              }}
            >
              Previous
            </Button>

            <Button
              onClick={handleNext}
              className="flex items-center gap-2"
              disabled={isLoading || isCheckingExisting}
            >
              {isCheckingExisting
                ? "Loading..."
                : isLoading
                ? "Completing Setup..."
                : currentStep === onboardingSteps.length - 1
                ? "Complete Setup"
                : "Next Step"}
              {!isLoading && <MoveRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
