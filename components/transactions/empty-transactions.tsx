import { IconInvoice } from "@tabler/icons-react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function EmptyTransactions() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconInvoice />
        </EmptyMedia>
        <EmptyTitle>No Transactions</EmptyTitle>
        <EmptyDescription>
          You haven&apos;t created any transactions yet. Start tracking your
          income and expenses by adding your first transaction.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {/* You can add a button here to create a new transaction if needed */}
      </EmptyContent>
    </Empty>
  );
}
