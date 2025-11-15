"use client";

import * as React from "react";
import { Info, ChevronDown } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  InteractiveCycleTimeline,
  CycleTimelinePreview,
} from "@/components/cycle-timeline";
import { CyclePreset, presetToDateRanges } from "@/lib/utils";
import { type UseFormReturn } from "react-hook-form";

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

interface BudgetCycleStepProps {
  form: UseFormReturn<{
    budgetspace: string;
    cycles?: Array<{ from: Date; to?: Date }> | undefined;
    maxCycles?: number | undefined;
    cycleType: "monthly" | "custom";
  }>;
  error: string | null;
  selectedPreset: CyclePreset | null;
  onPresetChange: (preset: CyclePreset | null) => void;
  defaultMonth: Date;
}

export function BudgetCycleStep({
  form,
  error,
  selectedPreset,
  onPresetChange,
  defaultMonth,
}: BudgetCycleStepProps) {
  const watchedCycles = form.watch("cycles");

  const handlePresetSelect = (preset: CyclePreset) => {
    onPresetChange(preset);

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Choose Budget Cycle</h2>
        <p className="text-muted-foreground">
          Select how often you want to track and review your budget.
        </p>
      </div>

      {/* Enhanced explanation card */}
      <Collapsible defaultOpen={false}>
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-900">
          <CollapsibleTrigger asChild>
            <CardHeader className="group cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors">
              <CardTitle className="text-base flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  What is a budget cycle?
                </span>
                <ChevronDown className="h-4 w-4 text-blue-600 dark:text-blue-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
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
                  Want overlapping cycles (e.g., rent cycle vs. spending cycle)
                </li>
              </ul>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

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
                        <p className="text-xs text-muted-foreground mb-3">
                          Select a preset or create your own cycles.
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
                                    {preset.icon && <span>{preset.icon}</span>}
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
}
