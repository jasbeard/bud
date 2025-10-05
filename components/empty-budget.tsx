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
import { CreateBudgetDialog } from "./create-budget-dialog";

export function EmptyBudget() {
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
          <CreateBudgetDialog>
            <Button size="sm" className="cursor-pointer">
              Create Budget
            </Button>
          </CreateBudgetDialog>

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
