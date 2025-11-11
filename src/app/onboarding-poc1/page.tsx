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
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
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
import * as React from "react";
import {
  MoveRight,
  CheckCircle,
  Circle,
  HelpCircle,
  Info,
  ChevronDown,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";
import { type DateRange } from "react-day-picker";
import {
  InteractiveCycleTimeline,
  CycleTimelinePreview,
} from "@/components/cycle-timeline";

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
                      people use monthly cycles, but you might need custom
                      cycles if you:
                    </CardDescription>
                    <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside ml-2">
                      <li>
                        Get paid bi-weekly and want cycles aligned to paydays
                      </li>
                      <li>
                        Have multiple income sources with different schedules
                      </li>
                      <li>
                        Want overlapping cycles (e.g., rent cycle vs. spending
                        cycle)
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
