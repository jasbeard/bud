import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/diaglog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "../combobox";
import { toast } from "sonner";

type CategoryType = "expense" | "income";

interface CategoryWithAllocation {
  name: string;
  allocationAmount: number;
  allocationType: CategoryType;
}

interface CategoryOption {
  label: string;
  value: string;
}

const categoryFormSchema = z.object({
  category: z.string().min(1, "Category is required"),
  allocationAmount: z.number().min(0, "Allocation must be 0 or greater"),
  categoryType: z.enum(["expense", "income"]),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface AddCategoryDialogProps {
  allCategoryOptions: CategoryOption[];
  allCategories: CategoryWithAllocation[];
  currentBudgetspaceId?: string | null;
  budgetId: string;
  isLoadingCategories: boolean;
  onSuccess: () => void;
}

export function AddCategoryDialog({
  allCategoryOptions,
  allCategories,
  currentBudgetspaceId,
  budgetId,
  isLoadingCategories,
  onSuccess,
}: AddCategoryDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [allocationDisplayValue, setAllocationDisplayValue] =
    useState<string>("");

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      category: "",
      allocationAmount: 0,
      categoryType: "expense",
    },
  });

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
        form.setValue("category", categoryValue);
      }
    }
  };

  const handleAddCategory = async (values: CategoryFormValues) => {
    const selectedOption = allCategoryOptions.find(
      (opt) => opt.value === values.category
    );

    let categoryName: string;
    if (selectedOption) {
      categoryName = selectedOption.label;
    } else {
      // Handle new category created via combobox
      // Convert value back to readable name
      categoryName = values.category
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    // Check if category already exists in fetched categories
    const exists = allCategories.some(
      (cat) => cat.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (exists) {
      form.setError("category", {
        message: "Category already exists",
      });
      return;
    }

    setIsAddingCategory(true);

    try {
      const requestBody: {
        name: string;
        allocationAmount: number;
        allocationType: CategoryType;
        budgetId: string;
        budgetspaceId?: string;
      } = {
        name: categoryName,
        allocationAmount: values.allocationAmount,
        allocationType: values.categoryType,
        budgetId: budgetId,
      };

      if (currentBudgetspaceId) {
        requestBody.budgetspaceId = currentBudgetspaceId;
      }

      const response = await fetch("/api/budget-categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create budget category");
      }

      await response.json();

      // Call the success callback to refresh the list
      onSuccess();

      form.reset();
      setIsDialogOpen(false);
      setAllocationDisplayValue("");
      toast.success(`${categoryName} has been added`);
    } catch (error) {
      console.error("Error creating budget category:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create budget category"
      );
    } finally {
      setIsAddingCategory(false);
    }
  };

  return (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          form.reset();
          setAllocationDisplayValue("");
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
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleAddCategory)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  {isLoadingCategories ? (
                    <div className="text-sm text-muted-foreground">
                      Loading categories...
                    </div>
                  ) : (
                    <>
                      <FormControl>
                        <Combobox
                          id="Category"
                          options={allCategoryOptions}
                          placeholder="Select or create category"
                          searchPlaceholder="Search category"
                          searchNotFoundText="Category not found"
                          value={field.value}
                          onValueChange={field.onChange}
                          onCreateNew={handleCreateNewCategory}
                          showQuickActions={false}
                        />
                      </FormControl>
                      <FormMessage />
                    </>
                  )}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="allocationAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allocation</FormLabel>
                  <FormControl>
                    <Input
                      id="allocation"
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={
                        allocationDisplayValue !== ""
                          ? allocationDisplayValue
                          : field.value === 0
                          ? ""
                          : field.value ?? ""
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        setAllocationDisplayValue(value);
                        if (value === "") {
                          // Allow empty string temporarily
                          field.onChange(0);
                        } else {
                          const numValue = parseFloat(value);
                          if (!isNaN(numValue)) {
                            field.onChange(numValue);
                          }
                        }
                      }}
                      onBlur={(e) => {
                        // Convert empty string to 0 when field loses focus
                        const value = e.target.value;
                        if (value === "") {
                          field.onChange(0);
                          setAllocationDisplayValue("");
                        } else {
                          const numValue = parseFloat(value);
                          if (!isNaN(numValue)) {
                            field.onChange(numValue);
                            setAllocationDisplayValue("");
                          }
                        }
                        field.onBlur();
                      }}
                      onFocus={() => {
                        // When focused, show the actual value (or empty if 0)
                        if (field.value === 0) {
                          setAllocationDisplayValue("");
                        } else {
                          setAllocationDisplayValue(String(field.value ?? ""));
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="categoryType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger id="category-type" className="w-full">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="income">Income</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  form.reset();
                  setAllocationDisplayValue("");
                }}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isAddingCategory}
                className="cursor-pointer"
              >
                {isAddingCategory ? "Adding..." : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
