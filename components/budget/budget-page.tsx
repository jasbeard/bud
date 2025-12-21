"use client";

import { useState, Suspense, useEffect } from "react";
import { EmptyBudget } from "../empty-budget";
import { BudgetMainContent } from "./budget-main-content";
import { BudgetProvider, useBudgets } from "@/contexts/budget-context";
import {
  BudgetSpaceProvider,
  useBudgetspace,
} from "@/contexts/budgetspace-context";
import { Spinner } from "../ui/spinner";
import { Badge } from "../ui/badge";

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

function BudgetPageContent() {
  const [showMainContent, setMainContent] = useState(false);
  const { budgets, isLoading, mutate: mutateBudgets } = useBudgets();

  const handleOnCreateBudet = () => {
    setMainContent(true);
  };
  const handleCloseExpense = () => {
    setMainContent(false);
  };

  // Show empty state if no budgets exist
  const hasBudgets = budgets.length > 0;

  return (
    <div className="p-4">
      {isLoading ? (
        <UpdatingBadge />
      ) : showMainContent || hasBudgets ? (
        <BudgetMainContent
          onClose={handleCloseExpense}
          budgets={budgets}
          mutateBudgets={mutateBudgets}
        />
      ) : (
        <EmptyBudget onCreateBudget={handleOnCreateBudet} />
      )}
      {/* <EmptyBudget onCreateBudget={handleOnCreateBudet} /> */}
    </div>
  );
}

function BudgetPageInner() {
  const { currentBudgetspaceId } = useBudgetspace();
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
      <BudgetProvider budgetspaceId={currentBudgetspaceId ?? undefined}>
        <BudgetPageContent />
      </BudgetProvider>
    </Suspense>
  );
}

export function BudgetPage() {
  return (
    <BudgetSpaceProvider>
      <BudgetPageInner />
    </BudgetSpaceProvider>
  );
}
