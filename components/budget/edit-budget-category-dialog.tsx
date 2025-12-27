import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { TrashIcon } from "lucide-react";
import { BudgetCategoryResponse } from "@/hooks/use-budget-categories";

type CategoryType = "expense" | "income";

interface CategoryOption {
  label: string;
  value: string;
}

const updateBudgetCategoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  allocationAmount: z.number().min(0, "Allocation must be 0 or greater"),
  allocationType: z.enum(["expense", "income"]),
});

type UpdateBudgetCategoryFormValues = z.infer<
  typeof updateBudgetCategoryFormSchema
>;

interface EditBudgetCategoryDialogProps {
  budgetCategory: BudgetCategoryResponse;
  allCategoryOptions: CategoryOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (updatedCategory: BudgetCategoryResponse) => void | Promise<void>;
  onDelete?: (deletedCategoryId: string) => void | Promise<void>;
}

export function EditBudgetCategoryDialog({
  budgetCategory,
  allCategoryOptions,
  open,
  onOpenChange,
  onSuccess,
  onDelete,
}: EditBudgetCategoryDialogProps) {
  const [isUpdatingCategory, setIsUpdatingCategory] = useState(false);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);
  const [allocationDisplayValue, setAllocationDisplayValue] =
    useState<string>("");

  const form = useForm<UpdateBudgetCategoryFormValues>({
    resolver: zodResolver(updateBudgetCategoryFormSchema),
    defaultValues: {
      name: budgetCategory.name,
      allocationAmount: parseFloat(budgetCategory.allocationAmount) || 0,
      allocationType: budgetCategory.allocationType,
    },
  });

  // Reset form when budgetCategory changes or dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        name: budgetCategory.name,
        allocationAmount: parseFloat(budgetCategory.allocationAmount) || 0,
        allocationType: budgetCategory.allocationType,
      });
      setAllocationDisplayValue("");
    }
  }, [budgetCategory, open, form]);

  const handleCreateNewCategory = (newCategoryName: string) => {
    const trimmedName = newCategoryName.trim();
    if (trimmedName) {
      // Set the form value to the new category name
      form.setValue("name", trimmedName);
    }
  };

  const handleDeleteCategory = async () => {
    setIsDeletingCategory(true);

    try {
      const response = await fetch(
        `/api/budget-categories/${budgetCategory.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete budget category");
      }

      await response.json();

      if (onDelete) {
        await onDelete(budgetCategory.id);
      }
      onOpenChange(false);
      toast.success("Budget category deleted successfully");
    } catch (error) {
      console.error("Error deleting budget category:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to delete budget category"
      );
    } finally {
      setIsDeletingCategory(false);
    }
  };

  const handleUpdateCategory = async (
    values: UpdateBudgetCategoryFormValues
  ) => {
    setIsUpdatingCategory(true);

    try {
      const updateData: {
        name?: string;
        allocationAmount?: number;
        allocationType?: CategoryType;
      } = {};

      // Only include fields that have changed
      if (values.name !== budgetCategory.name) {
        updateData.name = values.name;
      }
      if (
        values.allocationAmount !== parseFloat(budgetCategory.allocationAmount)
      ) {
        updateData.allocationAmount = values.allocationAmount;
      }
      if (values.allocationType !== budgetCategory.allocationType) {
        updateData.allocationType = values.allocationType;
      }

      // If nothing changed, just close the dialog
      if (Object.keys(updateData).length === 0) {
        onOpenChange(false);
        return;
      }

      const response = await fetch(
        `/api/budget-categories/${budgetCategory.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update budget category");
      }

      const updatedCategory: BudgetCategoryResponse = await response.json();

      await onSuccess(updatedCategory);
      onOpenChange(false);
      toast.success("Budget category updated successfully");
    } catch (error) {
      console.error("Error updating budget category:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update budget category"
      );
    } finally {
      setIsUpdatingCategory(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          form.reset({
            name: budgetCategory.name,
            allocationAmount: parseFloat(budgetCategory.allocationAmount) || 0,
            allocationType: budgetCategory.allocationType,
          });
          setAllocationDisplayValue("");
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Budget Category</DialogTitle>
          <DialogDescription>
            Update the details of this budget category.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleUpdateCategory)}
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Combobox
                      id="category"
                      options={allCategoryOptions}
                      placeholder="Select or create category"
                      searchPlaceholder="Search category"
                      searchNotFoundText="Category not found"
                      value={field.value.toLowerCase().replace(/\s+/g, "-")}
                      onValueChange={(value) => {
                        const selectedOption = allCategoryOptions.find(
                          (opt) => opt.value === value
                        );
                        if (selectedOption) {
                          field.onChange(selectedOption.label);
                        } else {
                          // Handle new category created via combobox
                          const categoryName = value
                            .split("-")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ");
                          field.onChange(categoryName);
                        }
                      }}
                      onCreateNew={handleCreateNewCategory}
                      showQuickActions={false}
                    />
                  </FormControl>
                  <FormMessage />
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
                          field.onChange(0);
                        } else {
                          const numValue = parseFloat(value);
                          if (!isNaN(numValue)) {
                            field.onChange(numValue);
                          }
                        }
                      }}
                      onBlur={(e) => {
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
              name="allocationType"
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
            <DialogFooter className="sm:justify-between">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteCategory}
                className="cursor-pointer"
                disabled={isUpdatingCategory || isDeletingCategory}
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                {isDeletingCategory ? "Deleting..." : "Delete"}
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false);
                    form.reset({
                      name: budgetCategory.name,
                      allocationAmount:
                        parseFloat(budgetCategory.allocationAmount) || 0,
                      allocationType: budgetCategory.allocationType,
                    });
                    setAllocationDisplayValue("");
                  }}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isUpdatingCategory || isDeletingCategory}
                  className="cursor-pointer"
                >
                  {isUpdatingCategory ? "Saving..." : "Save"}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
