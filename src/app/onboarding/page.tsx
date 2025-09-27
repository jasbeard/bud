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

  const onSubmit = (data: FormData) => {
    console.log("Form submitted:", data);
    // Handle form submission here
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
