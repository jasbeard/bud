interface BudgetCategoryResponse {
  id: string;
  categoryId: string;
  budgetId: string;
  name: string;
  allocationAmount: string;
  allocationType: "expense" | "income";
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

import { PencilIcon } from "lucide-react";

interface BudgetCategoryListProps {
  categories: BudgetCategoryResponse[] | undefined;
  isLoading: boolean;
  onCategoryClick?: (category: BudgetCategoryResponse) => void;
}

export function BudgetCategoryList({
  categories,
  isLoading,
  onCategoryClick,
}: BudgetCategoryListProps) {
  if (isLoading) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        Loading categories...
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1">
      {categories.map((category) => {
        const allocationAmount = parseFloat(category.allocationAmount) || 0;
        return (
          <div
            key={category.id}
            onClick={() => onCategoryClick?.(category)}
            className="text-sm px-2 py-2 bg-muted rounded-md flex justify-between items-center group cursor-pointer hover:bg-muted/80 transition-colors"
          >
            <div className="flex flex-col gap-0.5 flex-1">
              <span>{category.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {allocationAmount > 0 && (
                <span className="text-muted-foreground font-medium">
                  ${allocationAmount.toFixed(2)}
                </span>
              )}
              <PencilIcon className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
