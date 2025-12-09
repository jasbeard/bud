import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/diaglog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const budgetNameFormSchema = z.object({
  name: z
    .string()
    .min(1, "Budget name is required")
    .max(100, "Budget name must be 100 characters or less"),
});

type BudgetNameFormValues = z.infer<typeof budgetNameFormSchema>;

interface EditBudgetDialogProps {
  budgetId: string;
  currentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (newName: string) => void;
}

export function EditBudgetDialog({
  budgetId,
  currentName,
  open,
  onOpenChange,
  onSuccess,
}: EditBudgetDialogProps) {
  const [isUpdatingBudget, setIsUpdatingBudget] = useState(false);

  const form = useForm<BudgetNameFormValues>({
    resolver: zodResolver(budgetNameFormSchema),
    defaultValues: {
      name: currentName,
    },
  });

  const handleUpdateBudget = async (values: BudgetNameFormValues) => {
    setIsUpdatingBudget(true);

    try {
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update budget");
      }

      await response.json();

      onSuccess(values.name);
      onOpenChange(false);
      toast.success("Budget renamed successfully");
    } catch (error) {
      console.error("Error updating budget:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update budget"
      );
    } finally {
      setIsUpdatingBudget(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          form.reset({ name: currentName });
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Budget</DialogTitle>
          <DialogDescription>Update the name of your budget.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleUpdateBudget)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Name</FormLabel>
                  <FormControl>
                    <Input
                      id="budget-name"
                      placeholder="Enter budget name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  form.reset({ name: currentName });
                }}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isUpdatingBudget}
                className="cursor-pointer"
              >
                {isUpdatingBudget ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
