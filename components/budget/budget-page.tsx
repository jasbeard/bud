"use client";

import { useState, useMemo } from "react";
import { EmptyBudget } from "../empty-budget";
import useSWR from "swr";

import {
  Card,
  CardHeader,
  CardTitle,
  CardAction,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XIcon, PlusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/diaglog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "../combobox";

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
  allocation: number;
  type: CategoryType;
}

function ExpenseSection({ onClose }: { onClose?: () => void }) {
  const [addedCategories, setAddedCategories] = useState<
    CategoryWithAllocation[]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [allocation, setAllocation] = useState("");
  const [categoryType, setCategoryType] = useState<CategoryType>("expense");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch both default categories and user categories in one request
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useSWR<CategoriesResponse>("/api/categories", fetcher);

  // Combine default categories and user categories, then add locally added ones
  const allCategoryOptions = useMemo(() => {
    const defaultNames =
      categoriesData?.defaultCategories.map((cat) => cat.name) ?? [];
    const userGenerated =
      categoriesData?.categories.map((cat) => cat.name) ?? [];
    const addedNames = addedCategories.map((cat) => cat.name);
    const combined = [
      ...new Set([...defaultNames, ...userGenerated, ...addedNames]),
    ];

    return combined.map((cat) => ({
      label: cat,
      value: cat.toLowerCase().replace(/\s+/g, "-"),
    }));
  }, [categoriesData, addedCategories]);

  const handleCreateNewCategory = (newCategoryName: string) => {
    const trimmedName = newCategoryName.trim();
    if (trimmedName) {
      // Check if category already exists (case-insensitive)
      const exists = allCategoryOptions.some(
        (opt) => opt.label.toLowerCase() === trimmedName.toLowerCase()
      );

      if (!exists) {
        // Set the selected category to the newly created one
        // User can then set allocation and click Add button
        const categoryValue = trimmedName.toLowerCase().replace(/\s+/g, "-");
        setSelectedCategory(categoryValue);
      }
    }
  };

  const handleComboboxChange = (value: string) => {
    setSelectedCategory(value);
  };

  const handleAddCategory = () => {
    if (selectedCategory) {
      const selectedOption = allCategoryOptions.find(
        (opt) => opt.value === selectedCategory
      );

      let categoryName: string;
      if (selectedOption) {
        categoryName = selectedOption.label;
      } else {
        // Handle new category created via combobox
        // Convert value back to readable name
        categoryName = selectedCategory
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }

      // Check if category already exists
      const exists = addedCategories.some(
        (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
      );

      if (!exists) {
        const allocationValue = parseFloat(allocation) || 0;
        setAddedCategories([
          ...addedCategories,
          {
            name: categoryName,
            allocation: allocationValue,
            type: categoryType,
          },
        ]);
        setSelectedCategory("");
        setAllocation("");
        setCategoryType("expense");
        setIsDialogOpen(false);
      }
    }
  };

  return (
    <Card className="md:w-[320px] md:min-h-[120px] border rounded m-4 relative">
      <CardHeader>
        <CardTitle className="mt-0.5">Expense</CardTitle>
        {onClose && (
          <CardAction>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 cursor-pointer"
            >
              <XIcon className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {addedCategories.length > 0 && (
          <div className="flex flex-col gap-1">
            {addedCategories.map((category, index) => (
              <div
                key={index}
                className="text-sm px-2 py-2 bg-muted rounded-md flex justify-between items-center"
              >
                <div className="flex flex-col gap-0.5">
                  <span>{category.name}</span>
                </div>
                {category.allocation > 0 && (
                  <span className="text-muted-foreground font-medium">
                    ${category.allocation.toFixed(2)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setSelectedCategory("");
              setAllocation("");
              setCategoryType("expense");
            }
          }}
        >
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-2 cursor-pointer"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
              <DialogDescription>
                Create a new expense category to organize your expenses.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="Category">Category</Label>
                {isLoadingCategories ? (
                  <div className="text-sm text-muted-foreground">
                    Loading categories...
                  </div>
                ) : (
                  <Combobox
                    id="Category"
                    options={allCategoryOptions}
                    placeholder="Select or create category"
                    searchPlaceholder="Search category"
                    searchNotFoundText="Category not found"
                    value={selectedCategory}
                    onValueChange={handleComboboxChange}
                    onCreateNew={handleCreateNewCategory}
                    showQuickActions={false}
                  />
                )}
              </div>
              <div className="grid flex-1 gap-2">
                <Label htmlFor="allocation">Allocation</Label>
                <Input
                  id="allocation"
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  value={allocation}
                  onChange={(e) => setAllocation(e.target.value)}
                />
              </div>
              <div className="grid flex-1 gap-2">
                <Label htmlFor="category-type">Type</Label>
                <Select
                  value={categoryType}
                  onValueChange={(value: CategoryType) =>
                    setCategoryType(value)
                  }
                >
                  <SelectTrigger id="category-type" className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="sm:justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  setSelectedCategory("");
                  setAllocation("");
                  setCategoryType("expense");
                }}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCategory}
                disabled={!selectedCategory}
                className="cursor-pointer"
              >
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export function BudgetPage() {
  const [showMainContent, setMainContent] = useState(false);
  const handleOnCreateBudet = () => {
    setMainContent(true);
  };
  const handleCloseExpense = () => {
    setMainContent(false);
  };
  return (
    <>
      {showMainContent ? <ExpenseSection onClose={handleCloseExpense} /> : null}
      {!showMainContent ? (
        <EmptyBudget onCreateBudget={handleOnCreateBudet} />
      ) : null}
    </>
  );
}
