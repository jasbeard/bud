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
import { CycleSelect } from "@/components/cycle-select";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import * as React from "react";
import { type DateRange } from "react-day-picker";
import { MoveRight, CheckCircle, Circle, HelpCircle } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { authClient } from "@/lib/auth-client";

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

export default function Page() {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [completedSteps, setCompletedSteps] = React.useState<number[]>([]);
  const [maxCycles, setMaxCycles] = React.useState<number>(2);
  const [cycles, setCycles] = React.useState<DateRange[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isCheckingExisting, setIsCheckingExisting] = React.useState(true);

  const defaultMonth = React.useMemo(() => new Date(2025, 5, 12), []);
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      budgetspace: "",
    },
  });

  // Check for existing budget spaces on component mount
  React.useEffect(() => {
    const checkExistingBudgetspaces = async () => {
      try {
        const session = await authClient.getSession();
        if (!session?.data?.user?.id) {
          setIsCheckingExisting(false);
          return;
        }

        const response = await fetch("/api/budgetspaces");
        if (response.ok) {
          const budgetspace = await response.json();
          // User already has a budget space, pre-populate with it
          form.reset({ budgetspace: budgetspace.name });
          // Mark step 0 as completed since they already have a budget space
          setCompletedSteps([0]);
          setCurrentStep(1); // Skip to next step
        } else if (response.status === 404) {
          // No budget space found, user needs to create one
          // This is expected for new users, so we just continue
        }
      } catch (error) {
        console.error("Error checking existing budgetspaces:", error);
      } finally {
        setIsCheckingExisting(false);
      }
    };

    checkExistingBudgetspaces();
  }, [form]);

  const handleNext = async () => {
    if (currentStep === 0) {
      // Validate and submit budgetspace creation
      const isValid = await form.trigger();
      if (isValid) {
        // Only create budgetspace if form is dirty (values have changed)
        if (form.formState.isDirty) {
          setIsLoading(true);
          setError(null);

          try {
            const data = form.getValues();

            // Create budgetspace via API
            const response = await fetch("/api/budgetspaces", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                name: data.budgetspace,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                errorData.error || "Failed to create budgetspace"
              );
            }

            const newBudgetspace = await response.json();
            console.log("Budgetspace created:", newBudgetspace);

            // Reset form to clean state with the created budget space name
            form.reset({ budgetspace: data.budgetspace });
          } catch (err) {
            console.error("Error creating budgetspace:", err);
            setError(
              err instanceof Error
                ? err.message
                : "Failed to create budgetspace"
            );
            setIsLoading(false);
            return; // Don't proceed to next step if there's an error
          } finally {
            setIsLoading(false);
          }
        }

        // Proceed to next step
        setCompletedSteps((prev) => [...prev, currentStep]);
        setCurrentStep(1);
      }
    } else if (currentStep === 1) {
      // Handle cycle selection completion
      setCompletedSteps((prev) => [...prev, currentStep]);
      setCurrentStep(2);
    } else {
      // Complete onboarding
      setCompletedSteps((prev) => [...prev, currentStep]);
      console.log("Onboarding completed!");
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

            <CycleSelect
              cycles={cycles}
              onChange={setCycles}
              maxCycles={maxCycles}
              onMaxCyclesChange={setMaxCycles}
              defaultMonth={defaultMonth}
              numberOfMonths={2}
            />
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
                ? "Creating..."
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
