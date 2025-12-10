import useSWR from "swr";
import { useState, useMemo } from "react";

import { Card, CardContent } from "@/components/ui/card";
import {
  BudgetSpaceProvider,
  useBudgetspace,
} from "@/contexts/budgetspace-context";
import { Budget } from "@/contexts/budget-context";
import { AddCategoryDialog } from "./add-category-dialog";
import { EditBudgetDialog } from "./edit-budget-dialog";
import { BudgetCardHeader } from "./budget-card-header";
import { BudgetCategoryList } from "./budget-category-list";

interface CategoryItem {
  name: string;
}

interface CategoriesResponse {
  defaultCategories: CategoryItem[];
  categories: CategoryItem[];
}

async function fetcher(url: string): Promise<CategoriesResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  return response.json();
}

type CategoryType = "expense" | "income";

interface CategoryWithAllocation {
  name: string;
  allocationAmount: number;
  allocationType: CategoryType;
}

interface BudgetCategoryResponse {
  id: string;
  categoryId: string;
  name: string;
  allocationAmount: string;
  allocationType: CategoryType;
  createdAt: Date;
  updatedAt: Date | null;
  category: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
    budgetspaceId: string;
  };
}

async function budgetCategoriesFetcher(
  url: string
): Promise<BudgetCategoryResponse[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch budget categories");
  }
  return response.json();
}

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
  // 5. Custom Hook: useBudgetCategories
  // 6. Types File (optional)
  // 7. API Utils File (optional)

  const { currentBudgetspaceId } = useBudgetspace();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [budgetName, setBudgetName] = useState(budget.name);

  // Fetch both default categories and user categories in one request
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useSWR<CategoriesResponse>("/api/categories", fetcher);

  // Fetch existing budget categories from the API
  const budgetCategoriesUrl = currentBudgetspaceId
    ? `/api/budget-categories?budgetspaceId=${currentBudgetspaceId}`
    : "/api/budget-categories";
  const {
    data: budgetCategoriesData,
    isLoading: isLoadingBudgetCategories,
    mutate: mutateBudgetCategories,
  } = useSWR<BudgetCategoryResponse[]>(
    currentBudgetspaceId ? budgetCategoriesUrl : null,
    budgetCategoriesFetcher
  );

  // Transform API response to CategoryWithAllocation format
  const fetchedCategories: CategoryWithAllocation[] = useMemo(() => {
    if (!budgetCategoriesData) return [];
    return budgetCategoriesData.map((cat) => ({
      name: cat.name,
      allocationAmount: parseFloat(cat.allocationAmount) || 0,
      allocationType: cat.allocationType,
    }));
  }, [budgetCategoriesData]);

  // Combine fetched categories with any optimistically added ones
  const allCategories = useMemo(() => {
    return fetchedCategories;
  }, [fetchedCategories]);

  // Combine default categories and user categories for the dropdown
  const allCategoryOptions = useMemo(() => {
    const defaultNames =
      categoriesData?.defaultCategories.map((cat) => cat.name) ?? [];
    const userGenerated =
      categoriesData?.categories.map((cat) => cat.name) ?? [];
    const fetchedNames = allCategories.map((cat) => cat.name);
    const combined = [
      ...new Set([...defaultNames, ...userGenerated, ...fetchedNames]),
    ];

    return combined.map((cat) => ({
      label: cat,
      value: cat.toLowerCase().replace(/\s+/g, "-"),
    }));
  }, [categoriesData, allCategories]);

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
          isLoading={isLoadingBudgetCategories}
        />
        <AddCategoryDialog
          allCategoryOptions={allCategoryOptions}
          allCategories={allCategories}
          currentBudgetspaceId={currentBudgetspaceId}
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
