"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  InputGroup,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group";
import { Category } from "@/components/category";
import { type UseFormReturn } from "react-hook-form";

interface CategoriesStepProps {
  form: UseFormReturn<{
    budgetspace: string;
    cycles?: Array<{ from: Date; to?: Date }> | undefined;
    maxCycles?: number | undefined;
    cycleType: "monthly" | "custom";
    categories?: string[] | undefined;
  }>;
  defaultCategories: string[];
  error: string | null;
  isLoading: boolean;
}

export function CategoriesStep({
  form,
  defaultCategories,
  error,
  isLoading,
}: CategoriesStepProps) {
  const [newCategoryInput, setNewCategoryInput] = React.useState("");
  const categories = form.watch("categories") || defaultCategories;

  const handleAddCategory = () => {
    if (
      newCategoryInput.trim() &&
      !categories.includes(newCategoryInput.trim())
    ) {
      const updatedCategories = [...categories, newCategoryInput.trim()];
      form.setValue("categories", updatedCategories, { shouldValidate: true });
      setNewCategoryInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newCategoryInput.trim()) {
      e.preventDefault();
      handleAddCategory();
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    const updatedCategories = categories.filter(
      (cat) => cat !== categoryToRemove
    );
    form.setValue("categories", updatedCategories, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Set Up Categories</h2>
        <p className="text-muted-foreground">
          Create spending categories to organize your transactions.
        </p>
      </div>

      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <Form {...form}>
        <form className="space-y-6">
          <FormField
            control={form.control}
            name="categories"
            render={() => (
              <FormItem>
                <FormControl>
                  <div className="space-y-4">
                    <InputGroup>
                      <InputGroupInput
                        placeholder="Enter category name"
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isLoading}
                      />
                      <InputGroupButton
                        onClick={handleAddCategory}
                        disabled={
                          isLoading ||
                          !newCategoryInput.trim() ||
                          categories.includes(newCategoryInput.trim())
                        }
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </InputGroupButton>
                    </InputGroup>

                    <div className="flex flex-wrap gap-2 mt-4">
                      {categories.map((category) => (
                        <Category
                          name={category}
                          key={category}
                          isDefault={defaultCategories.includes(category)}
                          onRemove={() => handleRemoveCategory(category)}
                        />
                      ))}
                    </div>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
}
