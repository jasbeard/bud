import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/diaglog";
import { Button } from "@/components/ui/button";
import { Budget } from "@/contexts/budget-context";
import { BudgetCategoryResponse } from "@/hooks/use-budget-categories";

export function RemainingBudgetsView({ budgets }: { budgets: Budget[] }) {
  const [selectedCategory, setSelectedCategory] =
    useState<BudgetCategoryResponse | null>(null);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // Format currency (assuming PHP based on image)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Memoize budgets with their categories to ensure reactivity
  const budgetsWithCategories = useMemo(() => {
    return budgets.map((budget) => {
      const categories = budget.budgetCategories || [];
      const expenseCategories = categories.filter(
        (cat) => cat.allocationType === "expense"
      );
      const incomeCategories = categories.filter(
        (cat) => cat.allocationType === "income"
      );
      return {
        ...budget,
        expenseCategories,
        incomeCategories,
        allCategories: categories,
      };
    });
  }, [budgets]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4">
      {budgetsWithCategories.map((budget) => {
        const expenseCategories = budget.expenseCategories;
        const incomeCategories = budget.incomeCategories;
        const allCategories = budget.allCategories;

        // Calculate totals for this budget
        const totalExpenseAllocated = expenseCategories.reduce((sum, cat) => {
          return sum + (parseFloat(cat.allocationAmount) || 0);
        }, 0);
        const totalIncomeAllocated = incomeCategories.reduce((sum, cat) => {
          return sum + (parseFloat(cat.allocationAmount) || 0);
        }, 0);
        const totalAllocated = totalExpenseAllocated + totalIncomeAllocated;

        // For now, remaining = allocated (since no transactions exist yet)
        // Later, this will be: remaining = allocated - spent
        const totalRemaining = totalAllocated;

        return (
          <Card key={budget.id} className="md:min-h-[120px] border rounded">
            <CardHeader>
              <CardTitle className="mt-0.5">{budget.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Summary */}
              <div className="flex flex-col gap-2 p-3 bg-muted rounded-md">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Remaining
                  </span>
                  <span className="text-lg font-semibold">
                    {formatCurrency(totalRemaining)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>From {allCategories.length} categories</span>
                  <span>{formatCurrency(totalAllocated)} allocated</span>
                </div>
              </div>

              {/* Category List */}
              {allCategories.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {allCategories.map((category) => {
                    const allocationAmount =
                      parseFloat(category.allocationAmount) || 0;
                    // For now, remaining = allocated (no transactions yet)
                    const remaining = allocationAmount;

                    return (
                      <button
                        key={`${budget.id}-${category.id}`}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(category);
                          setSelectedBudget(budget);
                          setIsDialogOpen(true);
                        }}
                        className="relative w-full text-left text-sm px-3 py-2.5 bg-muted rounded-md flex justify-between items-center border border-transparent hover:border-border hover:shadow-sm cursor-pointer transition-all active:scale-[0.98] group"
                      >
                        <div className="flex flex-col gap-0.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-normal">{category.name}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-muted-foreground/10 text-muted-foreground uppercase">
                              {category.allocationType}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatCurrency(allocationAmount)} allocated
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-0.5">
                          <span
                            className={`font-semibold ${
                              category.allocationType === "income"
                                ? "text-green-600 dark:text-green-400"
                                : "text-green-600 dark:text-green-400"
                            }`}
                          >
                            {formatCurrency(remaining)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            remaining
                          </span>
                        </div>
                        {/* Overlay text */}
                        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <span className="text-xs text-muted-foreground font-medium [text-shadow:0_1px_2px_rgba(255,255,255,0.8),0_-1px_1px_rgba(0,0,0,0.15)] dark:[text-shadow:0_1px_2px_rgba(0,0,0,0.3),0_-1px_1px_rgba(255,255,255,0.1)]">
                            Add transaction
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground py-2 text-center">
                  No categories yet
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
      {/* Transaction Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setSelectedCategory(null);
            setSelectedBudget(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md gap-8">
          <DialogHeader>
            <DialogTitle>New Transaction</DialogTitle>
            <DialogDescription>
              {selectedCategory && selectedBudget
                ? `${selectedCategory.name} for ${selectedBudget.name} plan`
                : "Create a new transaction by filling out the details below."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm text-muted-foreground mb-1">
                Budget Category
              </div>
              <div className="font-medium">
                {selectedCategory?.name || "Not selected"}
              </div>
            </div>
            <div className="text-sm text-muted-foreground text-center py-4">
              Transaction form will be implemented here
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="default"
              className="cursor-pointer"
              disabled
            >
              Create Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
