"use client";

import { Button } from "@/components/ui/button";
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
import * as React from "react";
import { MoveRight, HelpCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { authClient } from "@/db/auth-client";

import { CyclePreset, presetToDateRanges } from "@/lib/utils";
import { BudgetCycleStep } from "@/components/onboarding/budget-cycle-step";
import { BudgetspaceStep } from "@/components/onboarding/budgetspace-step";
import { CategoriesStep } from "@/components/onboarding/categories-step";

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
  categories: z
    .array(z.string().min(1, "Category name cannot be empty"))
    .min(1, "At least one category is required")
    .optional(),
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

// Default preset for initialization - Monthly
const defaultPreset: CyclePreset = {
  name: "Monthly",
  description: "Standard monthly budget (1st to last day of each month)",
  icon: "📆",
  type: "monthly",
};

// Helper functions to convert between step names and indices
const getStepIndexFromName = (stepName: string): number | null => {
  const index = onboardingSteps.findIndex((step) => step.id === stepName);
  return index >= 0 ? index : null;
};

const getStepNameFromIndex = (index: number): string | null => {
  return onboardingSteps[index]?.id ?? null;
};

export default function Page() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize step from query param or default to 0
  const stepFromQuery = React.useMemo(() => {
    const stepName = searchParams.get("step");
    if (stepName) {
      const index = getStepIndexFromName(stepName);
      if (index !== null) {
        return index;
      }
    }
    return null;
  }, [searchParams]);

  const [currentStep, setCurrentStep] = React.useState(stepFromQuery ?? 0);
  const [completedSteps, setCompletedSteps] = React.useState<number[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isCheckingExisting, setIsCheckingExisting] = React.useState(true);
  const hasInitializedRef = React.useRef(false);
  // Default to Monthly preset
  const [selectedPreset, setSelectedPreset] =
    React.useState<CyclePreset | null>(defaultPreset);

  const defaultMonth = React.useMemo(() => new Date(2025, 5, 12), []);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      budgetspace: "",
      cycles: [],
      maxCycles: 2,
      cycleType: "monthly",
      categories: [],
    },
  });

  // Helper function to update step and sync with URL
  const updateStep = React.useCallback(
    (newStep: number) => {
      setCurrentStep(newStep);
      const params = new URLSearchParams(searchParams.toString());
      const stepName = getStepNameFromIndex(newStep);
      if (newStep === 0 || !stepName) {
        // Remove step param for first step or invalid step
        params.delete("step");
      } else {
        params.set("step", stepName);
      }
      const newUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname;
      router.replace(newUrl, { scroll: false });
    },
    [router, pathname, searchParams]
  );

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

  // Check for existing budget spaces and cycles on component mount
  // Only run once and only if no step is specified in URL (fresh load)
  React.useEffect(() => {
    // Skip if we've already initialized or if there's a step in the URL
    const stepInUrl = searchParams.get("step");
    if (hasInitializedRef.current || stepInUrl) {
      setIsCheckingExisting(false);
      return;
    }

    const checkExistingData = async () => {
      try {
        hasInitializedRef.current = true;
        const session = await authClient.getSession();
        if (!session?.data?.user?.id) {
          setIsCheckingExisting(false);
          return;
        }

        // Note: Onboarding status check is handled in middleware
        // This only checks for partial progress to pre-populate the form

        // Check for existing budget spaces

        // TODO: move away from useEffect and use swr
        // sample implementation at @/hooks/use-onboarding-status
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
        // TODO: move away from useEffect and use swr
        // sample implementation at @/hooks/use-onboarding-status
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
          setCurrentStep(2);
          router.replace(`${pathname}?step=categories`, { scroll: false });
        } else if (budgetspaceExists) {
          setCurrentStep(1);
          router.replace(`${pathname}?step=budgetcycle`, { scroll: false });
        }
        // If budget space doesn't exist, stay on step 0
      } catch (error) {
        console.error("Error checking existing data:", error);
      } finally {
        setIsCheckingExisting(false);
      }
    };

    checkExistingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleNext = async () => {
    if (currentStep < onboardingSteps.length - 1) {
      // Validate current step
      const fieldsToValidate =
        currentStep === 0
          ? ["budgetspace" as const]
          : currentStep === 1
          ? ["cycles" as const]
          : ["categories" as const];
      const isValid = await form.trigger(fieldsToValidate);

      if (isValid) {
        setCompletedSteps((prev) => [...prev, currentStep]);
        updateStep(currentStep + 1);
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

      // Get default categories to filter them out
      // Only send newly added categories (not default ones)
      const defaultCategoriesResponse = await fetch("/api/default-categories");
      let defaultCategoryNames: string[] = [];
      if (defaultCategoriesResponse.ok) {
        const defaultCategoriesData = await defaultCategoriesResponse.json();
        defaultCategoryNames = defaultCategoriesData.map(
          (cat: { name: string }) => cat.name
        );
      }

      const formCategories = formData.categories || [];
      const newCategories = formCategories.filter(
        (category) => !defaultCategoryNames.includes(category)
      );

      // Ensure cycles.type is always a valid preset name
      // Fallback to "Monthly" if selectedPreset is null (shouldn't happen, but safety check)
      const cycleType = selectedPreset?.name || "Monthly";

      const onboardingData = {
        budgetspace: {
          name: formData.budgetspace,
        },
        cycles: {
          type: cycleType,
          timeline: cycleDates.length > 0 ? cycleDates : null,
        },
        categories: newCategories.length > 0 ? newCategories : null,
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
      // console.log("Onboarding completed:", result);

      // Only redirect if onboarding was successful
      if (result.success) {
        // Mark final step as completed
        setCompletedSteps((prev) => [...prev, currentStep]);

        // Redirect to budget page
        router.push("/budget");
      } else {
        throw new Error(
          result.error ||
            "Onboarding completed but returned unsuccessful status"
        );
      }
    } catch (err) {
      console.error("Error completing onboarding:", err);
      setError(
        err instanceof Error ? err.message : "Failed to complete onboarding"
      );
    } finally {
      setIsLoading(false);
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
          <BudgetspaceStep form={form} error={error} isLoading={isLoading} />
        );

      case 1:
        return (
          <BudgetCycleStep
            form={form}
            error={error}
            selectedPreset={selectedPreset}
            onPresetChange={setSelectedPreset}
            defaultMonth={defaultMonth}
          />
        );

      case 2:
        return (
          <CategoriesStep form={form} error={error} isLoading={isLoading} />
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
                updateStep(step);
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
              className="cursor-pointer"
              disabled={currentStep === 0 || isCheckingExisting}
              onClick={() => {
                setError(null); // Clear any errors when going back
                updateStep(currentStep - 1);
              }}
            >
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {currentStep === 2 && (
                <Button
                  variant="ghost"
                  className="cursor-pointer disabled:cursor-not-allowed"
                  onClick={handleCompleteOnboarding}
                  disabled={
                    isLoading ||
                    isCheckingExisting ||
                    (form.getValues("categories") || []).length === 0
                  }
                >
                  Skip
                </Button>
              )}

              <Button
                onClick={handleNext}
                className="flex items-center gap-2 cursor-pointer"
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
    </div>
  );
}
