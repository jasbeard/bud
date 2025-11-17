"use client";

import * as React from "react";
import { Category } from "@/components/category";
import { type UseFormReturn } from "react-hook-form";

interface DefaultCategory {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
}

interface CategoriesListProps {
  categories: string[];
  defaultCategoryNames: string[];
  onRemove: (category: string) => void;
  form?: UseFormReturn<{
    budgetspace: string;
    cycles?: Array<{ from: Date; to?: Date }> | undefined;
    maxCycles?: number | undefined;
    cycleType: "monthly" | "custom";
    categories?: string[] | undefined;
  }>;
}

// Component that fetches default categories
async function fetchDefaultCategories(): Promise<DefaultCategory[]> {
  const response = await fetch("/api/default-categories", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch default categories");
  }

  return response.json();
}

// Component that displays categories list
function CategoriesListContent({
  categories,
  defaultCategoryNames,
  onRemove,
}: Omit<CategoriesListProps, "defaultCategoryNames" | "form"> & {
  defaultCategoryNames: string[];
}) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {categories.map((category) => (
        <Category
          name={category}
          key={category}
          isDefault={defaultCategoryNames.includes(category)}
          onRemove={() => onRemove(category)}
        />
      ))}
    </div>
  );
}

// Create a promise cache outside the component to ensure it's stable
// Use a global cache to prevent refetching across module reloads
const CACHE_KEY = Symbol.for("defaultCategoriesCache");
type GlobalCache = {
  [CACHE_KEY]?: Map<string, Promise<DefaultCategory[]>>;
};
const globalThisWithCache = globalThis as GlobalCache;
const globalCache =
  globalThisWithCache[CACHE_KEY] ||
  new Map<string, Promise<DefaultCategory[]>>();
globalThisWithCache[CACHE_KEY] = globalCache;

function getDefaultCategoriesPromise(): Promise<DefaultCategory[]> {
  const cacheKey = "defaultCategories";
  if (!globalCache.has(cacheKey)) {
    globalCache.set(cacheKey, fetchDefaultCategories());
  }
  return globalCache.get(cacheKey)!;
}

export function CategoriesList({
  categories,
  onRemove,
  form,
}: Omit<CategoriesListProps, "defaultCategoryNames">) {
  // Use React.use() for Suspense support
  // Use cached promise to prevent refetching
  const defaultCategories = React.use(getDefaultCategoriesPromise());
  const defaultCategoryNames = defaultCategories.map((cat) => cat.name);
  const hasInitializedRef = React.useRef(false);

  // Initialize form with default categories once when component loads
  React.useEffect(() => {
    if (form && !hasInitializedRef.current) {
      const currentCategories = form.getValues("categories");
      if (!currentCategories || currentCategories.length === 0) {
        form.setValue("categories", defaultCategoryNames, {
          shouldValidate: false,
        });
        hasInitializedRef.current = true;
      } else {
        hasInitializedRef.current = true;
      }
    }
  }, [form, defaultCategoryNames]);

  return (
    <CategoriesListContent
      categories={categories}
      defaultCategoryNames={defaultCategoryNames}
      onRemove={onRemove}
    />
  );
}
