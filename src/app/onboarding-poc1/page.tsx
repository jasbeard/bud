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
import {
  Stepper,
  StepperList,
  StepperItem,
  StepperTrigger,
  StepperIndicator,
  StepperContent,
  StepperTitle,
  StepperDescription,
  StepperSeparator,
} from "@/components/ui/stepper";
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
import { MoveRight, HelpCircle, Info, ChevronDown } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";

import {
  InteractiveCycleTimeline,
  CycleTimelinePreview,
} from "@/components/cycle-timeline";
import { CyclePreset, presetToDateRanges } from "@/lib/utils";

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
    id: "budgetcycle",
    title: "Choose Budget Cycle",
    description: "Select how often you want to track your budget",
  },
  {
    id: "categories",
    title: "Set Up Categories",
    description: "Create spending categories for better organization",
  },
];

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
        formData.cycles?.map((cycle, index) => ({
          order: index + 1,
          startDate: cycle.from?.getDate() || 1,
          endDate: cycle.to?.getDate() || 31,
        })) || [];

      const onboardingData = {
        budgetspace: {
          name: formData.budgetspace,
        },
        cycles: {
          type: selectedPreset?.name,
          timeline: cycleDates,
        },
      };

      // const response = await fetch("/api/onboarding", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify(onboardingData),
      // });

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.error || "Failed to complete onboarding");
      // }

      // const result = await response.json();
      // console.log("Onboarding completed:", result);

      // Mark final step as completed
      // setCompletedSteps((prev) => [...prev, currentStep]);

      // Redirect to dashboard or next page
      // You can add navigation logic here
      console.log("results: ", onboardingData);
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
    <div className="flex flex-col h-screen bg-background">
      {/* Header with Title and Help */}
      <div className="border-b bg-muted/30 px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold">Budget Setup</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Get started with bud by completing these essential steps.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground shrink-0"
          >
            <HelpCircle className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Need Help?</span>
          </Button>
        </div>
      </div>

      {/* Stepper Navigation */}
      <div className="border-b bg-background px-4 sm:px-6 py-3 sm:py-4 overflow-x-auto">
        <div className="max-w-4xl mx-auto min-w-0">
          <Stepper
            activeStep={currentStep}
            onStepChange={(step) => {
              // Only allow navigation to completed steps or the next step
              if (completedSteps.includes(step) || step === currentStep + 1) {
                setError(null);
                setCurrentStep(step);
              }
            }}
            orientation="horizontal"
            className="w-full"
          >
            <StepperList className="w-full">
              {onboardingSteps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <StepperItem step={index}>
                    <StepperTrigger
                      disabled={
                        !completedSteps.includes(index) &&
                        index !== currentStep &&
                        index !== currentStep + 1
                      }
                    >
                      <StepperIndicator
                        step={index}
                        size="sm"
                        showCheck={completedSteps.includes(index)}
                      />
                      <StepperContent>
                        <StepperTitle className="text-xs sm:text-sm">
                          {step.title}
                        </StepperTitle>
                        <StepperDescription className="hidden sm:block text-xs">
                          {step.description}
                        </StepperDescription>
                      </StepperContent>
                    </StepperTrigger>
                  </StepperItem>
                  {index < onboardingSteps.length - 1 && (
                    <StepperSeparator step={index} />
                  )}
                </React.Fragment>
              ))}
            </StepperList>
          </Stepper>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col overflow-auto">
        <div className="flex-1 p-6 sm:p-8">
          <div className="max-w-2xl mx-auto w-full">{renderStepContent()}</div>
        </div>

        {/* Bottom Navigation */}
        <div className="border-t p-4 sm:p-6 bg-background">
          <div className="flex justify-between items-center max-w-2xl mx-auto w-full">
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
