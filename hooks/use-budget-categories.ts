import useSWR from "swr";
import { useMemo } from "react";
import { useBudgetspace } from "@/contexts/budgetspace-context";

interface CategoryItem {
  name: string;
}

interface CategoriesResponse {
  defaultCategories: CategoryItem[];
  categories: CategoryItem[];
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
  budgetId: string;
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

interface CategoryOption {
  label: string;
  value: string;
}

async function categoriesFetcher(url: string): Promise<CategoriesResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  return response.json();
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

/**
 * Hook to fetch and manage budget categories data
 * @param budgetId - Optional budget ID to filter categories by specific budget
 * @returns Object containing categories data, loading states, and computed options
 */
export function useBudgetCategories(budgetId?: string) {
  const { currentBudgetspaceId } = useBudgetspace();

  // Fetch both default categories and user categories in one request
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useSWR<CategoriesResponse>("/api/categories", categoriesFetcher);

  // Fetch existing budget categories from the API
  // If budgetId is provided, filter by budgetId; otherwise filter by budgetspaceId
  const budgetCategoriesUrl = budgetId
    ? `/api/budget-categories?budgetId=${budgetId}`
    : currentBudgetspaceId
    ? `/api/budget-categories?budgetspaceId=${currentBudgetspaceId}`
    : "/api/budget-categories";
  const {
    data: budgetCategoriesData,
    isLoading: isLoadingBudgetCategories,
    mutate: mutateBudgetCategories,
  } = useSWR<BudgetCategoryResponse[]>(
    budgetId || currentBudgetspaceId ? budgetCategoriesUrl : null,
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

  return {
    // Raw data
    categoriesData,
    budgetCategoriesData,
    // Loading states
    isLoadingCategories,
    isLoadingBudgetCategories,
    // Computed data
    allCategories,
    allCategoryOptions,
    // Mutate function
    mutateBudgetCategories,
    // Context data
    currentBudgetspaceId,
  };
}

// Export types for use in other files
export type {
  CategoryItem,
  CategoriesResponse,
  CategoryType,
  CategoryWithAllocation,
  BudgetCategoryResponse,
  CategoryOption,
};
