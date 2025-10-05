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
import * as React from "react";
import { type DateRange } from "react-day-picker";
import { Input } from "@/components/ui/input";
import { MoveRight } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CycleSelect } from "@/components/cycle-select";
import { InputWithInfoTooltip } from "@/components/input-with-info-tooltip";

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
  const [maxCycles, setMaxCycles] = React.useState<number>(2);
  const [cycles, setCycles] = React.useState<DateRange[]>([]);

  // Trim cycles if max is reduced
  const handleMaxCyclesChange = React.useCallback((next: number) => {
    const safe = Number.isFinite(next) ? Math.max(1, Math.floor(next)) : 1;
    setMaxCycles(safe);
    setCycles((prev) => (prev.length > safe ? prev.slice(0, safe) : prev));
  }, []);

  const defaultMonth = React.useMemo(() => new Date(2025, 5, 12), []);
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
    <div className="flex justify-center w-full h-dvh border border-red-300">
      <div className="flex w-full max-w-[52%] border border-orange-300">
        <div className="w-64">asd</div>
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Let&apos;s Get Started</CardTitle>
            <CardDescription>
              Name your Budgetspace and set your cycle to start.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-dvh">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="budgetspace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budgetspace</FormLabel>
                      <FormControl>
                        {/* <Input
                          placeholder="E.g. Household"
                          {...field}
                          className="w-80"
                        /> */}
                        <InputWithInfoTooltip
                          placeholder="Household"
                          type="text"
                          tooltipMessage="letters, numbers, spaces, hyphens, and underscores are okay"
                          className="w-90"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <CycleSelect
                  cycles={cycles}
                  onChange={setCycles}
                  maxCycles={maxCycles}
                  onMaxCyclesChange={handleMaxCyclesChange}
                  defaultMonth={defaultMonth}
                  numberOfMonths={2}
                  showControls
                  // showLegend
                  captionCurrentLabel="Current month"
                  captionNextLabel="Next Month"
                />

                <CardFooter className="flex self-end justify-end p-0">
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    className="cursor-pointer px-2 font-normal text-sm text-muted-foreground"
                    disabled={form.formState.isSubmitting}
                  >
                    <div>Next</div>
                    <MoveRight className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
