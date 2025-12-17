"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DayButton, getDefaultClassNames } from "react-day-picker";
import type { BudgetCycle } from "@/hooks/use-budget-cycles";

interface BudgetCycleCalendarProps {
  budgetCycles: BudgetCycle[];
}

// Generate colors for different cycles
const cycleDotColors = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
];

export function BudgetCycleCalendar({
  budgetCycles,
}: BudgetCycleCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date());

  // Helper function to check if a day falls within a cycle timeline
  const isDayInCycle = React.useCallback(
    (day: Date, cycle: BudgetCycle, displayMonth: Date): boolean => {
      // Only show dots for cycles that have timelines defined
      if (cycle.timelines.length === 0) {
        return false;
      }

      const dayOfMonth = day.getDate();

      // Normalize dates to compare months/years correctly
      // Create date objects at midnight to avoid timezone issues
      const dayDateNormalized = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate()
      );
      const displayDateNormalized = new Date(
        displayMonth.getFullYear(),
        displayMonth.getMonth(),
        1
      );

      // Only check days that are in the currently displayed month
      // This filters out "outside days" (days from previous/next month shown in calendar)
      if (
        dayDateNormalized.getMonth() !== displayDateNormalized.getMonth() ||
        dayDateNormalized.getFullYear() !== displayDateNormalized.getFullYear()
      ) {
        return false;
      }

      // Check each timeline
      return cycle.timelines.some((timeline) => {
        const startDate = timeline.startDate;
        const endDate = timeline.endDate;

        // If endDate < startDate, it spans to next month
        // Example: Day 25 - Day 8 means days 25-31 of current month and days 1-8 of next month
        if (endDate < startDate) {
          // Month-spanning cycle
          // We're viewing a specific month, so we need to check:
          // - If day >= startDate: we're in the start month portion (days 25-31)
          // - If day <= endDate: we're in the end month portion (days 1-8)
          // - Days between endDate and startDate (9-24) should NOT match
          const inStartPortion = dayOfMonth >= startDate;
          const inEndPortion = dayOfMonth <= endDate;
          return inStartPortion || inEndPortion;
        } else {
          // Regular cycle within the same month
          // Day is in range if it's between startDate and endDate (inclusive)
          return dayOfMonth >= startDate && dayOfMonth <= endDate;
        }
      });
    },
    []
  );

  const getCycleDotColor = React.useCallback((index: number) => {
    return cycleDotColors[index % cycleDotColors.length];
  }, []);

  // Filter cycles that have timelines for color assignment
  const cyclesWithTimelines = React.useMemo(
    () => budgetCycles.filter((cycle) => cycle.timelines.length > 0),
    [budgetCycles]
  );

  // Custom day button component that highlights cycle days
  // Create a component factory function
  const createCustomDayButton = React.useCallback(() => {
    const CustomDayButtonComponent = (
      props: React.ComponentProps<typeof DayButton>
    ) => {
      const { day, modifiers, ...restProps } = props;
      const dayDate = day.date;

      // Find all active timelines (cycles) across all budget cycles
      // Each timeline entry is what the user calls a "cycle"
      const activeTimelines: Array<{
        cycle: BudgetCycle;
        timeline: { startDate: number; endDate: number; id?: string };
        timelineIndex: number;
      }> = [];

      cyclesWithTimelines.forEach((cycle) => {
        cycle.timelines.forEach((timeline, timelineIndex) => {
          if (isDayInCycle(dayDate, cycle, currentMonth)) {
            // Double-check this specific timeline matches
            const dayOfMonth = dayDate.getDate();
            const startDate = timeline.startDate;
            const endDate = timeline.endDate;

            const dayDateNormalized = new Date(
              dayDate.getFullYear(),
              dayDate.getMonth(),
              dayDate.getDate()
            );
            const displayDateNormalized = new Date(
              currentMonth.getFullYear(),
              currentMonth.getMonth(),
              1
            );

            if (
              dayDateNormalized.getMonth() !==
                displayDateNormalized.getMonth() ||
              dayDateNormalized.getFullYear() !==
                displayDateNormalized.getFullYear()
            ) {
              return;
            }

            let timelineMatches = false;
            if (endDate < startDate) {
              // Month-spanning cycle
              timelineMatches =
                dayOfMonth >= startDate || dayOfMonth <= endDate;
            } else {
              // Regular cycle
              timelineMatches =
                dayOfMonth >= startDate && dayOfMonth <= endDate;
            }

            if (timelineMatches) {
              activeTimelines.push({ cycle, timeline, timelineIndex });
            }
          }
        });
      });

      const defaultClassNames = getDefaultClassNames();

      return (
        <Button
          variant="ghost"
          size="icon"
          data-day={dayDate.toLocaleDateString()}
          data-selected-single={
            modifiers.selected &&
            !modifiers.range_start &&
            !modifiers.range_end &&
            !modifiers.range_middle
          }
          data-range-start={modifiers.range_start}
          data-range-end={modifiers.range_end}
          data-range-middle={modifiers.range_middle}
          className={cn(
            "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground flex aspect-square size-auto w-full min-w-(--cell-size) flex-col gap-1 leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md",
            defaultClassNames.day,
            restProps.className
          )}
          {...restProps}
        >
          <div className="flex flex-col items-center justify-center gap-0.5 w-full">
            <span className="text-sm font-medium leading-none">
              {dayDate.getDate()}
            </span>
            {activeTimelines.length > 0 && (
              <div className="flex gap-0.5 justify-center items-center h-2">
                {activeTimelines
                  .slice(0, 3)
                  .map(({ cycle, timeline, timelineIndex }) => {
                    // Create a unique index for each timeline across all cycles
                    // Find the cycle index
                    const cycleIndex = cyclesWithTimelines.findIndex(
                      (c) => c.id === cycle.id
                    );

                    // Create unique index: cycleIndex * maxTimelines + timelineIndex
                    // This ensures each timeline (what user calls "cycle") gets a unique color
                    const maxTimelines = Math.max(
                      ...cyclesWithTimelines.map((c) => c.timelines.length),
                      1
                    );
                    const uniqueIndex =
                      cycleIndex * maxTimelines + timelineIndex;

                    const colorClass = getCycleDotColor(uniqueIndex);

                    // Debug: log to verify color assignment
                    console.log(
                      `Cycle ${cycle.id.substring(
                        0,
                        8
                      )}... -> cyclesWithTimelines index ${cycleIndex} -> color ${colorClass}`,
                      `cyclesWithTimelines length: ${cyclesWithTimelines.length}, budgetCycles length: ${budgetCycles.length}`
                    );

                    return (
                      <div
                        key={`${
                          cycle.id
                        }-${timelineIndex}-${dayDate.getTime()}`}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full flex-shrink-0",
                          colorClass
                        )}
                        title={`${cycle.budgetspace.name} - Day ${timeline.startDate}-${timeline.endDate}`}
                      />
                    );
                  })}
                {activeTimelines.length > 3 && (
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground flex-shrink-0" />
                )}
              </div>
            )}
          </div>
        </Button>
      );
    };
    return CustomDayButtonComponent;
  }, [
    budgetCycles,
    cyclesWithTimelines,
    isDayInCycle,
    getCycleDotColor,
    currentMonth,
  ]);

  const CustomDayButton = createCustomDayButton();

  if (budgetCycles.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendar View</CardTitle>
        <CardDescription>
          Visual representation of your budget cycles across the month
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="single"
          month={currentMonth}
          onMonthChange={setCurrentMonth}
          captionLayout="dropdown"
          className="w-full"
          components={{
            DayButton: CustomDayButton,
          }}
        />
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {cyclesWithTimelines.map((cycle, cycleIndex) => {
            const maxTimelines = Math.max(
              ...cyclesWithTimelines.map((c) => c.timelines.length),
              1
            );
            return cycle.timelines.map((timeline, timelineIndex) => {
              const uniqueIndex = cycleIndex * maxTimelines + timelineIndex;
              return (
                <div
                  key={`${cycle.id}-${timelineIndex}`}
                  className="flex items-center gap-2 text-sm"
                >
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full",
                      getCycleDotColor(uniqueIndex)
                    )}
                  />

                  <Badge variant="outline" className="text-xs">
                    Day {timeline.startDate} - Day {timeline.endDate}
                    {timeline.endDate < timeline.startDate && " (next month)"}
                  </Badge>
                </div>
              );
            });
          })}
        </div>
      </CardContent>
    </Card>
  );
}
