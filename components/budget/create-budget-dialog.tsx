"use client";

import { useState, Suspense } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useBudgets } from "@/contexts/budget-context";
import { useBudgetspace } from "@/contexts/budgetspace-context";

const createBudgetSchema = z.object({
  name: z.string().min(1, "Budget name is required").trim(),
});

type CreateBudgetFormValues = z.infer<typeof createBudgetSchema>;

interface CreateBudgetDialogProps {
  children: React.ReactNode;
}

function CreateBudgetDialogForm({
  onOpenChange,
}: {
  onOpenChange: (open: boolean) => void;
}) {
  const { mutate } = useBudgets();
  const { currentBudgetspaceId } = useBudgetspace();

  const form = useForm<CreateBudgetFormValues>({
    resolver: zodResolver(createBudgetSchema),
    defaultValues: {
      name: "",
    },
  });

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      form.reset();
    }
  };

  const onSubmit = async (values: CreateBudgetFormValues) => {
    try {
      if (!currentBudgetspaceId) {
        throw new Error(
          "No budgetspace available. Please create a budgetspace first."
        );
      }

      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          budgetspaceId: currentBudgetspaceId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create budget");
      }

      // Parse response to ensure it's valid JSON
      await response.json();

      // Refresh the budgets list to show the newly created budget
      await mutate();

      // Reset form and close dialog on success
      form.reset();
      handleOpenChange(false);

      toast.success(`Budget "${values.name}" created successfully`);
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof Error ? error.message : "Failed to create budget",
      });
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create Budget</DialogTitle>
        <DialogDescription>
          Enter a name for your new budget to get started.{" "}
          {currentBudgetspaceId}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          {form.formState.errors.root && (
            <div className="text-destructive text-sm bg-destructive/10 p-3 rounded-md">
              {form.formState.errors.root.message}
            </div>
          )}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="My Budget" required {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter className="sm:justify-end">
            <Button
              type="submit"
              variant="default"
              className="cursor-pointer"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}

export function CreateBudgetDialog({ children }: CreateBudgetDialogProps) {
  const [open, setOpen] = useState(false);
  // TODO: fix suspense boundary and decide where to wrap the suspense
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md gap-8">
        <Suspense
          fallback={
            <div className="flex flex-col gap-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-20 ml-auto" />
            </div>
          }
        >
          <CreateBudgetDialogForm onOpenChange={setOpen} />
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}
