import { IconDashboard } from "@tabler/icons-react";
import { RefreshCcwIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function EmptyDashboard() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconDashboard />
        </EmptyMedia>
        <EmptyTitle>No Sufficient Data</EmptyTitle>
        <EmptyDescription>
          There’s nothing to show here yet. Once you add budgets and
          transactions, your dashboard overview will appear.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" size="sm">
          <RefreshCcwIcon />
          Refresh
        </Button>
      </EmptyContent>
    </Empty>
  );
}
