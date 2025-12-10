interface BudgetCategoryResponse {
  id: string;
  categoryId: string;
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

interface BudgetCategoryListProps {
  categories: BudgetCategoryResponse[] | undefined;
  isLoading: boolean;
}

export function BudgetCategoryList({
  categories,
  isLoading,
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
  );
}
