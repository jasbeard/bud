"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ChevronRight } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
  budgetspace: z
    .string()
    .min(1, "Budgetspace name is required")
    .min(2, "Budgetspace name must be at least 2 characters")
    .max(50, "Budgetspace name must be less than 50 characters")
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      "Only letters, numbers, spaces, hyphens, and underscores are allowed"
    ),
});

type FormData = z.infer<typeof formSchema>;

export default function Page() {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      budgetspace: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      // For now, we'll use a mock user ID. In a real app, this would come from authentication
      const mockUserId = "123e4567-e89b-12d3-a456-426614174000";

      const response = await fetch("/api/budgetspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.budgetspace,
          userId: mockUserId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create budgetspace");
      }

      const result = await response.json();
      console.log("Budgetspace created:", result);

      // Redirect to dashboard or next step
      // router.push('/dashboard');
    } catch (error) {
      console.error("Error creating budgetspace:", error);
      // Handle error (show toast, etc.)
    }
  };
  return (
    <div className="flex justify-center items-center h-dvh">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Let&apos;s Get Started</CardTitle>
          <CardDescription>
            Choose a name for your new Budgetspace. This will help you organize
            and manage your finances.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="budgetspace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budgetspace</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g. Household" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <CardFooter className="flex justify-end p-0">
                <Button
                  type="submit"
                  size="icon"
                  variant="outline"
                  className="rounded-full cursor-pointer"
                  disabled={form.formState.isSubmitting}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
