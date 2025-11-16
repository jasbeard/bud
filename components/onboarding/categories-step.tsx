"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import {
  InputGroup,
  InputGroupInput,
  InputGroupButton,
} from "@/components/ui/input-group";
import { Category } from "@/components/category";

interface CategoriesStepProps {
  defaultCategories: string[];
  onCategoriesChange?: (categories: string[]) => void;
}

export function CategoriesStep({
  defaultCategories,
  onCategoriesChange,
}: CategoriesStepProps) {
  const [categories, setCategories] =
    React.useState<string[]>(defaultCategories);
  const [newCategoryInput, setNewCategoryInput] = React.useState("");

  // Notify parent when categories change
  React.useEffect(() => {
    onCategoriesChange?.(categories);
  }, [categories, onCategoriesChange]);

  const handleAddCategory = () => {
    if (
      newCategoryInput.trim() &&
      !categories.includes(newCategoryInput.trim())
    ) {
      const updatedCategories = [...categories, newCategoryInput.trim()];
      setCategories(updatedCategories);
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
    setCategories(categories.filter((cat) => cat !== categoryToRemove));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Set Up Categories</h2>
        <p className="text-muted-foreground">
          Create spending categories to organize your transactions.
        </p>
      </div>

      <div className="space-y-4">
        <InputGroup>
          <InputGroupInput
            placeholder="Enter category name"
            value={newCategoryInput}
            onChange={(e) => setNewCategoryInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <InputGroupButton
            onClick={handleAddCategory}
            disabled={
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
    </div>
  );
}
