import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Budget } from "@/contexts/budget-context";
import { BudgetCategoryResponse } from "@/hooks/use-budget-categories";
import { DatePickerTransaction } from "@/components/date-picker-transaction";

const transactionSchema = z.object({
  spentAmount: z
    .string()
    .min(1, "Spent amount is required")
    .refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      "Spent amount must be a positive number"
    ),
  notes: z.string().optional(),
  date: z.string().optional(),
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
      date: "Today",
    },
  });

  // Watch spent amount for real-time balance calculation
  const spentAmount = useWatch({
    control: form.control,
    name: "spentAmount",
  });

  // Calculate remaining balance in real-time
  const remainingBalance = useMemo(() => {
    if (!selectedCategory) return 0;
    const allocationAmount = parseFloat(selectedCategory.allocationAmount) || 0;
    const spent = parseFloat(spentAmount) || 0;
    return allocationAmount - spent;
  }, [selectedCategory, spentAmount]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
        date: values.date,
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
      <DialogContent className="sm:max-w-md gap-6">
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            {selectedCategory && selectedBudget ? (
              <>
                <span>{selectedBudget.name}</span>
                <Badge variant="outline" className="uppercase">
                  {selectedCategory.allocationType}
                </Badge>
              </>
            ) : (
              "Create a new transaction by filling out the details below."
            )}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-2"
          >
            {form.formState.errors.root && (
              <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
                {form.formState.errors.root.message}
              </div>
            )}

            {/* Large Transaction Amount Display */}
            <FormField
              control={form.control}
              name="spentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex flex-col gap-2">
                      <div className="relative">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-4xl font-bold text-muted-foreground/50">
                          ₱
                        </span>
                        <Input
                          type="number"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          className="shadow-none !text-4xl font-bold text-left border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 pl-8 pr-4 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          onKeyDown={(e) => {
                            // Allow: backspace, delete, tab, escape, enter
                            if (
                              [
                                "Backspace",
                                "Delete",
                                "Tab",
                                "Escape",
                                "Enter",
                              ].includes(e.key)
                            ) {
                              return;
                            }
                            // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
                            if (
                              (e.ctrlKey || e.metaKey) &&
                              ["a", "c", "v", "x", "z"].includes(
                                e.key.toLowerCase()
                              )
                            ) {
                              return;
                            }
                            // Allow: arrow keys, home, end
                            if (
                              [
                                "ArrowLeft",
                                "ArrowRight",
                                "ArrowUp",
                                "ArrowDown",
                                "Home",
                                "End",
                              ].includes(e.key)
                            ) {
                              return;
                            }
                            // Allow: numbers and single decimal point
                            if (
                              !/^[0-9.]$/.test(e.key) ||
                              (e.key === "." && field.value?.includes("."))
                            ) {
                              e.preventDefault();
                            }
                          }}
                          onInput={(e) => {
                            // Filter out any non-numeric characters (except decimal point)
                            const value = e.currentTarget.value;
                            const filtered = value.replace(/[^0-9.]/g, "");
                            // Ensure only one decimal point
                            const parts = filtered.split(".");
                            const sanitized =
                              parts.length > 2
                                ? parts[0] + "." + parts.slice(1).join("")
                                : filtered;
                            if (sanitized !== value) {
                              field.onChange(sanitized);
                            }
                          }}
                          {...field}
                        />
                      </div>
                      {form.formState.errors.spentAmount && (
                        <FormMessage className="text-center" />
                      )}
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Budget Category Display */}
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm text-muted-foreground mb-1">
                Budget Category
              </div>
              <div className="font-medium text-base">
                {selectedCategory?.name || "Not selected"}
              </div>
            </div>

            {/* Date Component */}
            <div>
              <DatePickerTransaction />
            </div>

            {/* Notes Field */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="p-3 bg-muted rounded-md flex flex-col gap-2">
                      <div className="text-sm text-muted-foreground">Notes</div>
                      <Textarea
                        placeholder="Add any additional notes about this transaction..."
                        rows={1}
                        className="bg-transparent font-bold shadow-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 resize-none min-h-[1.5rem] field-sizing-content"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Remaining Balance Display */}
            {selectedCategory && (
              <div className="p-3 bg-muted rounded-md">
                <div className="text-sm text-muted-foreground mb-1">
                  Remaining allocation
                </div>
                <div className={`font-semibold text-lg`}>
                  {formatCurrency(remainingBalance)}
                </div>
              </div>
            )}

            <DialogFooter className="sm:justify-end mt-6">
              <Button
                type="submit"
                variant="default"
                className="cursor-pointer w-full"
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
