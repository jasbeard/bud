import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/diaglog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Budget } from "@/contexts/budget-context";
import { BudgetCategoryResponse } from "@/hooks/use-budget-categories";

const transactionSchema = z.object({
  spentAmount: z
    .string()
    .min(1, "Spent amount is required")
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      "Spent amount must be a positive number"
    ),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

interface NewTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCategory: BudgetCategoryResponse | null;
  selectedBudget: Budget | null;
}

export function NewTransactionDialog({
  open,
  onOpenChange,
  selectedCategory,
  selectedBudget,
}: NewTransactionDialogProps) {
  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      spentAmount: "",
      notes: "",
    },
  });

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      form.reset();
    }
  };

  const onSubmit = async (values: TransactionFormValues) => {
    try {
      // TODO: Implement transaction creation API call
      console.log("Transaction data:", {
        spentAmount: parseFloat(values.spentAmount),
        notes: values.notes,
        categoryId: selectedCategory?.id,
        budgetId: selectedBudget?.id,
        type: selectedCategory?.allocationType,
      });

      // Reset form and close dialog on success
      form.reset();
      handleOpenChange(false);
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Failed to create transaction",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md gap-8">
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
          <DialogDescription>
            {selectedCategory && selectedBudget
              ? `${selectedCategory.name} for ${selectedBudget.name} plan`
              : "Create a new transaction by filling out the details below."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            {form.formState.errors.root && (
              <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                {form.formState.errors.root.message}
              </div>
            )}
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm text-muted-foreground mb-1">
                Budget Category
              </div>
              <div className="font-medium">
                {selectedCategory?.name || "Not selected"}
              </div>
            </div>
            <FormField
              control={form.control}
              name="spentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Spent Amount</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about this transaction..."
                      rows={3}
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
                onClick={() => handleOpenChange(false)}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                className="cursor-pointer"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? "Creating..."
                  : "Create Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
