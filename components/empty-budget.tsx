"use client";

import { IconCoins } from "@tabler/icons-react";
import { ArrowUpRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

interface EmptyBudgetProps {
  onCreateBudget?: () => void;
}

export function EmptyBudget({ onCreateBudget }: EmptyBudgetProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconCoins />
        </EmptyMedia>
        <EmptyTitle>No Budgets Yet</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t created any budgets yet. Get started by creating your
          first budget.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <div className="flex gap-2">
          <Button size="sm" className="cursor-pointer" onClick={onCreateBudget}>
            Create Budget
          </Button>

          <Button variant="outline">Import Project</Button>
        </div>
      </EmptyContent>
      <Button
        variant="link"
        asChild
        className="text-muted-foreground"
        size="sm"
      >
        <a href="#">
          Learn More <ArrowUpRightIcon />
        </a>
      </Button>
    </Empty>
  );
}
