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

interface BudgetBreakdown {
  budget: Budget;
  totalAllocation: number;
  expenses: number;
  income: number;
}

export function BudgetChart({ budgets }: BudgetChartProps) {
  // Calculate breakdown per budget
  const budgetBreakdowns = useMemo<BudgetBreakdown[]>(() => {
    return budgets.map((budget) => {
      let expenses = 0;
      let income = 0;

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

      const totalAllocation = expenses + income;

      return {
        budget,
        totalAllocation,
        expenses,
        income,
      };
    });
  }, [budgets]);

  // Calculate total expenses and income from all budgets
  const { totalExpenses, totalIncome, amountLeft, expensePercentage } =
    useMemo(() => {
      let expenses = 0;
      let income = 0;

      budgetBreakdowns.forEach((breakdown) => {
        expenses += breakdown.expenses;
        income += breakdown.income;
      });

      const amountLeft = income - expenses;
      const expensePercentage = income > 0 ? (expenses / income) * 100 : 0;

      return {
        totalExpenses: expenses,
        totalIncome: income,
        amountLeft,
        expensePercentage: Math.min(expensePercentage, 100), // Cap at 100%
      };
    }, [budgetBreakdowns]);

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
    <Card className="flex flex-col p-6 gap-4">
      <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground text-left">
        Budget Breakdown
      </div>
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Chart Stuff Section */}
        <div className="w-full lg:flex-[0.5] sm:flex-col md:flex-row md:flex gap-4">
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
          <div className="flex flex-col justify-center gap-4">
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
          </div>
        </div>
        {/* Budget Breakdown Section */}
        <div className="w-full lg:flex-[0.5] flex flex-col gap-4">
          <div className="w-full">
            {/* Header - Hidden on mobile, shown on larger screens */}
            <div className="hidden md:flex items-center justify-between pb-2 gap-4">
              <div className="flex-1"></div>
              <div className="text-sm font-semibold text-muted-foreground min-w-[100px] lg:min-w-[120px] text-right">
                Expense
              </div>
              <div className="text-sm font-semibold text-muted-foreground min-w-[100px] lg:min-w-[120px] text-right">
                Income
              </div>
            </div>
            {/* Rows */}
            <div className="flex flex-col gap-3 mt-0 md:mt-3">
              {budgetBreakdowns.map((breakdown) => (
                <div
                  key={breakdown.budget.id}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4"
                >
                  <div className="font-semibold text-base md:text-lg flex-1">
                    {breakdown.budget.name}
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-4 md:gap-0">
                    <div className="flex flex-col md:block">
                      <span className="text-xs md:hidden text-muted-foreground mb-1">
                        Expense
                      </span>
                      <div className="text-sm md:text-base font-medium md:min-w-[100px] lg:min-w-[120px] md:text-right">
                        {formatCurrency(breakdown.expenses)}
                      </div>
                    </div>
                    <div className="flex flex-col md:block">
                      <span className="text-xs md:hidden text-muted-foreground mb-1">
                        Income
                      </span>
                      <div className="text-sm md:text-base font-medium md:min-w-[100px] lg:min-w-[120px] md:text-right text-green-600 dark:text-green-400">
                        {formatCurrency(breakdown.income)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
