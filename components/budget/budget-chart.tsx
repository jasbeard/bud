"use client";

import { useMemo } from "react";
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

import { Card } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Budget } from "@/contexts/budget-context";

const chartConfig = {
  expenses: {
    label: "Expenses",
    theme: {
      light: "oklch(0.6 0.118 184.704)", // --chart-2 color (light mode)
      dark: "oklch(0.696 0.17 162.48)", // --chart-2 color (dark mode)
    },
  },
} satisfies ChartConfig;

interface BudgetChartProps {
  budgets: Budget[];
}

export function BudgetChart({ budgets }: BudgetChartProps) {
  // Calculate total expenses and income from all budgets
  const { totalExpenses, totalIncome, amountLeft, expensePercentage } =
    useMemo(() => {
      let expenses = 0;
      let income = 0;

      budgets.forEach((budget) => {
        if (budget.budgetCategories) {
          budget.budgetCategories.forEach((category) => {
            const amount = parseFloat(category.allocationAmount) || 0;
            if (category.allocationType === "expense") {
              expenses += amount;
            } else if (category.allocationType === "income") {
              income += amount;
            }
          });
        }
      });

      const amountLeft = income - expenses;
      const expensePercentage = income > 0 ? (expenses / income) * 100 : 0;

      return {
        totalExpenses: expenses,
        totalIncome: income,
        amountLeft,
        expensePercentage: Math.min(expensePercentage, 100), // Cap at 100%
      };
    }, [budgets]);

  const chartData = useMemo(() => {
    // Determine color based on theme
    const isDark =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark");
    const fillColor = isDark
      ? chartConfig.expenses.theme.dark
      : chartConfig.expenses.theme.light;

    return [
      {
        expenses: expensePercentage,
        fill: fillColor,
      },
    ];
  }, [expensePercentage]);

  // Format currency (assuming PHP based on image)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="flex flex-col md:flex-row p-6 gap-6">
      <div className="flex-shrink-0 w-[200px] md:w-[250px] h-[200px] md:h-[250px]">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <RadialBarChart
            data={chartData}
            startAngle={0}
            endAngle={250}
            innerRadius={80}
            outerRadius={110}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted last:fill-background"
              polarRadius={[86, 74]}
            />
            <RadialBar dataKey="expenses" background cornerRadius={10} />
            <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl md:text-4xl font-bold"
                        >
                          {expensePercentage.toFixed(0)}%
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </div>
      <div className="flex-1 flex flex-col justify-center gap-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="text-sm text-muted-foreground uppercase tracking-wide">
              TOTAL INCOME
            </div>
            <div className="text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(totalIncome)}
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-sm text-muted-foreground uppercase tracking-wide">
              TOTAL PLANNED EXPENSES
            </div>
            <div className="text-2xl md:text-3xl font-bold">
              {formatCurrency(totalExpenses)}
            </div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(amountLeft)} left to budget
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded bg-[var(--chart-2)]"></div>
          <span className="text-muted-foreground">
            Expense {expensePercentage.toFixed(0)}%
          </span>
          <span className="ml-auto font-medium">
            {formatCurrency(totalExpenses)}
          </span>
        </div>
      </div>
    </Card>
  );
}
