import { useState, useMemo } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { BudgetSpaceProvider } from "@/contexts/budgetspace-context";
import { Budget } from "@/contexts/budget-context";
import { AddCategoryDialog } from "./add-category-dialog";
import { EditBudgetDialog } from "./edit-budget-dialog";
import { BudgetCardHeader } from "./budget-card-header";
import { BudgetCategoryList } from "./budget-category-list";
import { useBudgetCategories } from "@/hooks/use-budget-categories";
import { BudgetCategoryResponse } from "@/hooks/use-budget-categories";

export function BudgetList({
  onClose,
  budgets,
}: {
  onClose?: () => void;
  budgets: Budget[];
}) {
  return (
    <BudgetSpaceProvider>
      {budgets.map((budget) => (
        <BaseBudgetCard key={budget.id} budget={budget} onClose={onClose} />
      ))}
    </BudgetSpaceProvider>
  );
}

function BaseBudgetCard({
  budget,
  onClose,
}: {
  budget: Budget;
  onClose?: () => void;
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
  const budgetCategoriesData: BudgetCategoryResponse[] | undefined =
    useMemo(() => {
      if (hasIncludedCategories && budget.budgetCategories) {
        return budget.budgetCategories as BudgetCategoryResponse[];
      }
      return fetchedBudgetCategoriesData;
    }, [
      hasIncludedCategories,
      budget.budgetCategories,
      fetchedBudgetCategoriesData,
    ]);

  // If categories are included, we don't need to show loading state
  const isLoadingCategoriesList = hasIncludedCategories
    ? false
    : isLoadingBudgetCategories;

  return (
    <Card className="md:w-[320px] md:min-h-[120px] border rounded m-4 relative">
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
          onSuccess={mutateBudgetCategories}
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
