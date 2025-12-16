"use client";

import { useBudgetCycles } from "@/hooks/use-budget-cycles";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Calendar } from "lucide-react";

function BudgetCycleCard({
  cycle,
}: {
  cycle: {
    id: string;
    type: string;
    budgetspace: { name: string };
    timelines: Array<{ startDate: number; endDate: number }>;
  };
}) {
  const formatType = (type: string) => {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{formatType(cycle.type)}</CardTitle>
          <Badge variant="outline">{cycle.budgetspace.name}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {cycle.timelines.length > 0 ? (
          <div className="space-y-2">
            <CardDescription>
              Timeline ({cycle.timelines.length} cycle
              {cycle.timelines.length !== 1 ? "s" : ""}):
            </CardDescription>
            <div className="flex flex-wrap gap-2">
              {cycle.timelines.map((timeline, index) => {
                const hasOverlap = timeline.endDate < timeline.startDate;
                return (
                  <Badge key={index} variant="secondary">
                    Day {timeline.startDate} - Day {timeline.endDate}
                    {hasOverlap && (
                      <span className="ml-1 text-xs opacity-75">
                        (next month)
                      </span>
                    )}
                  </Badge>
                );
              })}
            </div>
          </div>
        ) : (
          <CardDescription>
            Standard {formatType(cycle.type)} cycle
          </CardDescription>
        )}
      </CardContent>
    </Card>
  );
}

function BudgetCyclesList() {
  const { budgetCycles, isLoading, error } = useBudgetCycles();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-48" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Calendar className="size-6" />
          </EmptyMedia>
          <EmptyTitle>Error loading budget cycles</EmptyTitle>
          <EmptyDescription>
            {error instanceof Error
              ? error.message
              : "Failed to load budget cycles"}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (budgetCycles.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Calendar className="size-6" />
          </EmptyMedia>
          <EmptyTitle>No budget cycles found</EmptyTitle>
          <EmptyDescription>
            Create your first budget cycle to get started with budgeting.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      {budgetCycles.map((cycle) => (
        <BudgetCycleCard key={cycle.id} cycle={cycle} />
      ))}
    </div>
  );
}

export function BudgetCycleSettingsPage() {
  return (
    <div className="space-y-6 m-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Budget Cycles</h2>
        <p className="text-muted-foreground">
          Manage your budget cycles and their configurations.
        </p>
      </div>
      <BudgetCyclesList />
    </div>
  );
}
