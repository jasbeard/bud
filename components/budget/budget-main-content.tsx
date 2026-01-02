import { useState, useMemo, useEffect } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BudgetSpaceProvider } from "@/contexts/budgetspace-context";
import { Budget } from "@/contexts/budget-context";
import { AddCategoryDialog } from "./add-category-dialog";
import { EditBudgetDialog } from "./edit-budget-dialog";
import { EditBudgetCategoryDialog } from "./edit-budget-category-dialog";
import { BudgetCardHeader } from "./budget-card-header";
import { BudgetCategoryList } from "./budget-category-list";
import { useBudgetCategories } from "@/hooks/use-budget-categories";
import { BudgetCategoryResponse } from "@/hooks/use-budget-categories";
import { BudgetChart } from "./budget-chart";
import { RemainingBudgetsView } from "./remaining-budgets-view";

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
      <Tabs defaultValue="plan" className="w-full">
        <TabsList>
          <TabsTrigger value="plan" className="cursor-pointer">
            Plan
          </TabsTrigger>
          <TabsTrigger value="remaining" className="cursor-pointer">
            Remaining
          </TabsTrigger>
        </TabsList>
        <TabsContent value="plan">
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
        </TabsContent>
        <TabsContent value="remaining">
          <RemainingBudgetsView budgets={budgets} />
        </TabsContent>
      </Tabs>
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
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] =
    useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<BudgetCategoryResponse | null>(null);
  // Optimistic updates for newly added categories
  const [optimisticCategories, setOptimisticCategories] = useState<
    BudgetCategoryResponse[]
  >([]);
  // Optimistic updates for updated categories
  const [updatedCategories, setUpdatedCategories] = useState<
    Map<string, BudgetCategoryResponse>
  >(new Map());

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
  // Merge with optimistic categories and updated categories for immediate UI updates
  const budgetCategoriesData: BudgetCategoryResponse[] | undefined =
    useMemo(() => {
      let baseCategories: BudgetCategoryResponse[] = [];
      if (hasIncludedCategories && budget.budgetCategories) {
        baseCategories = budget.budgetCategories as BudgetCategoryResponse[];
      } else if (fetchedBudgetCategoriesData) {
        baseCategories = fetchedBudgetCategoriesData;
      }

      // Apply optimistic updates (both new and updated)
      const categoriesMap = new Map<string, BudgetCategoryResponse>();

      // Add base categories
      baseCategories.forEach((cat) => {
        categoriesMap.set(cat.id, cat);
      });

      // Apply updated categories (overwrite base categories)
      updatedCategories.forEach((cat, id) => {
        categoriesMap.set(id, cat);
      });

      // Add new optimistic categories (avoid duplicates)
      optimisticCategories.forEach((cat) => {
        if (!categoriesMap.has(cat.id)) {
          categoriesMap.set(cat.id, cat);
        }
      });

      return Array.from(categoriesMap.values());
    }, [
      hasIncludedCategories,
      budget.budgetCategories,
      fetchedBudgetCategoriesData,
      optimisticCategories,
      updatedCategories,
    ]);

  // Clear optimistic and updated categories when budget prop updates (after mutate completes)
  useEffect(() => {
    if (
      hasIncludedCategories &&
      budget.budgetCategories &&
      (optimisticCategories.length > 0 || updatedCategories.size > 0)
    ) {
      // Check if any optimistic/updated category now exists in the budget prop
      const budgetCategoryIds = new Set(
        budget.budgetCategories.map((cat) => cat.id)
      );

      // Check if all optimistic categories exist
      const allOptimisticExist = optimisticCategories.every((cat) =>
        budgetCategoryIds.has(cat.id)
      );

      // Check if all updated categories exist and match
      const allUpdatedExist = Array.from(updatedCategories.keys()).every(
        (id) => {
          const budgetCat = budget.budgetCategories?.find(
            (cat) => cat.id === id
          );
          const updatedCat = updatedCategories.get(id);
          return (
            budgetCat &&
            updatedCat &&
            budgetCat.updatedAt === updatedCat.updatedAt
          );
        }
      );

      if (allOptimisticExist && allUpdatedExist) {
        // All optimistic/updated categories are now in the real data, clear them
        setOptimisticCategories([]);
        setUpdatedCategories(new Map());
      }
    }
  }, [
    budget.budgetCategories,
    hasIncludedCategories,
    optimisticCategories,
    updatedCategories,
  ]);

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
          onCategoryClick={(category) => {
            setSelectedCategory(category);
            setIsEditCategoryDialogOpen(true);
          }}
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
        {selectedCategory && (
          <EditBudgetCategoryDialog
            budgetCategory={selectedCategory}
            allCategoryOptions={allCategoryOptions}
            open={isEditCategoryDialogOpen}
            onOpenChange={(open) => {
              setIsEditCategoryDialogOpen(open);
              if (!open) {
                setSelectedCategory(null);
              }
            }}
            onSuccess={async (updatedCategory) => {
              // Optimistically update the category immediately
              setUpdatedCategories((prev) => {
                const newMap = new Map(prev);
                newMap.set(updatedCategory.id, updatedCategory);
                return newMap;
              });

              // Mutate budget categories if fetching separately
              if (!hasIncludedCategories) {
                await mutateBudgetCategories();
              }
              // Always mutate budgets to refresh included categories
              // Updated categories will be cleared by useEffect when new data arrives
              if (mutateBudgets) {
                await mutateBudgets();
              }
            }}
            onDelete={async (deletedCategoryId) => {
              // Clear selected category if it's the one being deleted
              if (selectedCategory?.id === deletedCategoryId) {
                setSelectedCategory(null);
              }

              // Optimistically remove the category immediately
              setUpdatedCategories((prev) => {
                const newMap = new Map(prev);
                newMap.delete(deletedCategoryId);
                return newMap;
              });
              // Also remove from optimistic categories if it exists there
              setOptimisticCategories((prev) =>
                prev.filter((cat) => cat.id !== deletedCategoryId)
              );

              // Mutate budget categories if fetching separately
              if (!hasIncludedCategories) {
                await mutateBudgetCategories();
              }
              // Always mutate budgets to refresh included categories
              if (mutateBudgets) {
                await mutateBudgets();
              }
            }}
          />
        )}
      </CardContent>
    </Card>
  );
}
