"use client";

import { useState, Suspense, useEffect } from "react";
import {
  BudgetSpaceProvider,
  useBudgetspace,
} from "@/contexts/budgetspace-context";
import { Spinner } from "../ui/spinner";
import { Badge } from "../ui/badge";
import { TransactionsList } from "./transactions-list";
import { EmptyTransactions } from "./empty-transactions";
import useSWR from "swr";

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

async function transactionsFetcher(url: string): Promise<Transaction[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }
  return response.json();
}

function UpdatingBadge() {
  return (
    <div className="w-full flex justify-center py-2">
      <Badge>
        <Spinner className="size-6" />
        Updating
      </Badge>
    </div>
  );
}

function TransactionsPageContent() {
  const { currentBudgetspaceId } = useBudgetspace();

  // Build the URL with optional query params
  const url = currentBudgetspaceId
    ? `/api/transactions?budgetspaceId=${currentBudgetspaceId}`
    : "/api/transactions";

  const {
    data: transactions,
    isLoading,
    error,
  } = useSWR<Transaction[]>(url, transactionsFetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  if (isLoading) {
    return <UpdatingBadge />;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-center text-destructive">
          Error loading transactions. Please try again.
        </div>
      </div>
    );
  }

  const hasTransactions = transactions && transactions.length > 0;

  return (
    <div className="p-4">
      {hasTransactions ? (
        <TransactionsList transactions={transactions} />
      ) : (
        <EmptyTransactions />
      )}
    </div>
  );
}

function TransactionsPageInner() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // During SSR, show UpdatingBadge. Once mounted on client, use Suspense
  if (!isMounted) {
    return <UpdatingBadge />;
  }

  return (
    <Suspense fallback={<UpdatingBadge />}>
      <TransactionsPageContent />
    </Suspense>
  );
}

export function TransactionsPage() {
  return (
    <BudgetSpaceProvider>
      <TransactionsPageInner />
    </BudgetSpaceProvider>
  );
}
