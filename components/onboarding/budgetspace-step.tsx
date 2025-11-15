"use client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { InputWithInfoTooltip } from "@/components/input-with-info-tooltip";
import { type UseFormReturn } from "react-hook-form";

interface BudgetspaceStepProps {
  form: UseFormReturn<{
    budgetspace: string;
    cycles?: Array<{ from: Date; to?: Date }> | undefined;
    maxCycles?: number | undefined;
    cycleType: "monthly" | "custom";
  }>;
  error: string | null;
  isLoading: boolean;
}

export function BudgetspaceStep({
  form,
  error,
  isLoading,
}: BudgetspaceStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Create Budgetspace</h2>
        <p className="text-muted-foreground">
          Set up your first budgetspace to organize your finances and start
          budgeting.
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
}
