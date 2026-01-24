"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Transaction {
  id: string;
  amount: string;
  description: string | null;
  type: "income" | "expense";
  categoryId: string | null;
  budgetId: string | null;
  budgetspaceId: string;
  date: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string | null;
}

interface TransactionsListProps {
  transactions: Transaction[];
}

// Format currency
const formatCurrency = (amount: string) => {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parseFloat(amount));
};

// Format date
const formatDate = (date: Date | string) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "MMM dd, yyyy");
};

export function TransactionsList({ transactions }: TransactionsListProps) {
  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort((a, b) => {
    const dateA = typeof a.date === "string" ? new Date(a.date) : a.date;
    const dateB = typeof b.date === "string" ? new Date(b.date) : b.date;
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Transactions</h1>
        <Badge variant="secondary">
          {transactions.length}{" "}
          {transactions.length === 1 ? "transaction" : "transactions"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sortedTransactions.map((transaction) => {
              const amount = parseFloat(transaction.amount);
              const isIncome = transaction.type === "income";

              return (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div
                      className={`flex size-10 items-center justify-center rounded-full ${
                        isIncome
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">
                        {transaction.description || "No description"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(transaction.date)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-semibold ${
                        isIncome ? "text-green-700" : "text-red-700"
                      }`}
                    >
                      {isIncome ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </div>
                    <Badge
                      variant={isIncome ? "default" : "secondary"}
                      className="mt-1"
                    >
                      {transaction.type}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
