import { useState, useMemo, useEffect } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { BudgetSpaceProvider } from "@/contexts/budgetspace-context";
import { Budget } from "@/contexts/budget-context";
import { AddCategoryDialog } from "./add-category-dialog";
import { EditBudgetDialog } from "./edit-budget-dialog";
import { BudgetCardHeader } from "./budget-card-header";
import { BudgetCategoryList } from "./budget-category-list";
import { useBudgetCategories } from "@/hooks/use-budget-categories";
import { BudgetCategoryResponse } from "@/hooks/use-budget-categories";
import { BudgetChart } from "./budget-chart";

export function BudgetMainContent({
  onClose,
  budgets,
  mutateBudgets,
}: {
  onClose?: () => void;
  budgets: Budget[];
  mutateBudgets?: () => Promise<Budget[] | undefined>;
}) {
  return (
    <BudgetSpaceProvider>
      <BudgetChart budgets={budgets} />
      <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-4 mt-4">
        {budgets.map((budget) => (
          <BaseBudgetCard
            key={budget.id}
            budget={budget}
            onClose={onClose}
            mutateBudgets={mutateBudgets}
          />
        ))}
      </div>
    </BudgetSpaceProvider>
  );
}

function BaseBudgetCard({
  budget,
  onClose,
  mutateBudgets,
}: {
  budget: Budget;
  onClose?: () => void;
  mutateBudgets?: () => Promise<Budget[] | undefined>;
}) {
  // TODO: abstract parts of this, to mitigate code growth
  // 1. AddCategoryDialog Component: Done
  // 2. EditBudgetDialog Component: Done
  // 3. BudgetCardHeader Component: Done
  // 4. BudgetCategoryList Component: Done
  // 5. Custom Hook: useBudgetCategories: Done
  // 6. Types File (optional)
  // 7. API Utils File (optional)

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [budgetName, setBudgetName] = useState(budget.name);
  // Optimistic updates for newly added categories
  const [optimisticCategories, setOptimisticCategories] = useState<
    BudgetCategoryResponse[]
  >([]);

  // Use included budget categories if available, otherwise fetch them
  const hasIncludedCategories = budget.budgetCategories !== undefined;
  const {
    budgetCategoriesData: fetchedBudgetCategoriesData,
    isLoadingBudgetCategories,
    allCategoryOptions,
    allCategories,
    currentBudgetspaceId,
    isLoadingCategories,
    mutateBudgetCategories,
  } = useBudgetCategories(
    hasIncludedCategories ? undefined : budget.id,
    hasIncludedCategories
  );

  // Use included categories if available, otherwise use fetched ones
  // Merge with optimistic categories for immediate UI updates
  const budgetCategoriesData: BudgetCategoryResponse[] | undefined =
    useMemo(() => {
      let baseCategories: BudgetCategoryResponse[] = [];
      if (hasIncludedCategories && budget.budgetCategories) {
        baseCategories = budget.budgetCategories as BudgetCategoryResponse[];
      } else if (fetchedBudgetCategoriesData) {
        baseCategories = fetchedBudgetCategoriesData;
      }

      // Merge with optimistic categories, avoiding duplicates
      const existingIds = new Set(baseCategories.map((cat) => cat.id));
      const newOptimistic = optimisticCategories.filter(
        (cat) => !existingIds.has(cat.id)
      );
      return [...baseCategories, ...newOptimistic];
    }, [
      hasIncludedCategories,
      budget.budgetCategories,
      fetchedBudgetCategoriesData,
      optimisticCategories,
    ]);

  // Clear optimistic categories when budget prop updates (after mutate completes)
  useEffect(() => {
    if (
      hasIncludedCategories &&
      budget.budgetCategories &&
      optimisticCategories.length > 0
    ) {
      // Check if any optimistic category now exists in the budget prop
      const budgetCategoryIds = new Set(
        budget.budgetCategories.map((cat) => cat.id)
      );
      const allOptimisticExist = optimisticCategories.every((cat) =>
        budgetCategoryIds.has(cat.id)
      );
      if (allOptimisticExist) {
        // All optimistic categories are now in the real data, clear them
        setOptimisticCategories([]);
      }
    }
  }, [budget.budgetCategories, hasIncludedCategories, optimisticCategories]);

  // If categories are included, we don't need to show loading state
  const isLoadingCategoriesList = hasIncludedCategories
    ? false
    : isLoadingBudgetCategories;

  return (
    <Card className="md:min-h-[120px] border rounded relative">
      <BudgetCardHeader
        budgetName={budgetName}
        onEdit={() => setIsEditDialogOpen(true)}
        onDelete={onClose}
      />
      <CardContent className="flex flex-col gap-2">
        <BudgetCategoryList
          categories={budgetCategoriesData}
          isLoading={isLoadingCategoriesList}
        />
        <AddCategoryDialog
          allCategoryOptions={allCategoryOptions}
          allCategories={allCategories}
          currentBudgetspaceId={currentBudgetspaceId}
          budgetId={budget.id}
          isLoadingCategories={isLoadingCategories}
          onSuccess={async (newCategory?: BudgetCategoryResponse) => {
            // Optimistically add the new category immediately
            if (newCategory) {
              setOptimisticCategories((prev) => [...prev, newCategory]);
            }

            // Mutate budget categories if fetching separately
            if (!hasIncludedCategories) {
              await mutateBudgetCategories();
            }
            // Always mutate budgets to refresh included categories
            // Optimistic categories will be cleared by useEffect when new data arrives
            if (mutateBudgets) {
              await mutateBudgets();
            }
          }}
        />
        <EditBudgetDialog
          budgetId={budget.id}
          currentName={budgetName}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={setBudgetName}
        />
      </CardContent>
    </Card>
  );
}
