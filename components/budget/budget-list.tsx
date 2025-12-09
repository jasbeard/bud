import useSWR from "swr";
import { useState, useMemo } from "react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, PencilIcon, XIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BudgetSpaceProvider,
  useBudgetspace,
} from "@/contexts/budgetspace-context";
import { Budget } from "@/contexts/budget-context";
import { AddCategoryDialog } from "./add-category-dialog";
import { EditBudgetDialog } from "./edit-budget-dialog";

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
  // 3. BudgetCardHeader Component
  // 4. BudgetCategoryList Component
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
      <CardHeader>
        <CardTitle className="mt-0.5">{budgetName}</CardTitle>
        {onClose && (
          <CardAction>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 cursor-pointer"
                >
                  <MoreVertical className="h-4 w-4" />
                  <span className="sr-only">More options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="right">
                <DropdownMenuItem
                  onClick={() => {
                    setIsEditDialogOpen(true);
                  }}
                >
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onClose}>
                  <XIcon className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {isLoadingBudgetCategories ? (
          <div className="text-sm text-muted-foreground py-2">
            Loading categories...
          </div>
        ) : budgetCategoriesData && budgetCategoriesData.length > 0 ? (
          <div className="flex flex-col gap-1">
            {budgetCategoriesData.map((category) => {
              const allocationAmount =
                parseFloat(category.allocationAmount) || 0;
              return (
                <div
                  key={category.id}
                  className="text-sm px-2 py-2 bg-muted rounded-md flex justify-between items-center"
                >
                  <div className="flex flex-col gap-0.5">
                    <span>{category.name}</span>
                  </div>
                  {allocationAmount > 0 && (
                    <span className="text-muted-foreground font-medium">
                      ${allocationAmount.toFixed(2)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}
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
