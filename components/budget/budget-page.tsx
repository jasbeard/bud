"use client";

import { useState, Suspense, useEffect } from "react";
import { EmptyBudget } from "../empty-budget";
import { BudgetCard } from "./budget-card";
import { BudgetCardSkeleton } from "./budget-card-skeleton";
import { BudgetProvider, useBudgets } from "@/contexts/budget-context";
import {
  BudgetSpaceProvider,
  useBudgetspace,
} from "@/contexts/budgetspace-context";

function BudgetPageContent() {
  const [showMainContent, setMainContent] = useState(false);
  const { budgets } = useBudgets();

  const handleOnCreateBudet = () => {
    setMainContent(true);
  };
  const handleCloseExpense = () => {
    setMainContent(false);
  };

  // Show empty state if no budgets exist
  const hasBudgets = budgets.length > 0;
  const shouldShowEmpty = !hasBudgets && !showMainContent;

  return (
    <>
      {showMainContent || hasBudgets ? (
        <BudgetCard onClose={handleCloseExpense} />
      ) : null}
      {shouldShowEmpty ? (
        <EmptyBudget onCreateBudget={handleOnCreateBudet} />
      ) : null}
    </>
  );
}

function BudgetPageInner() {
  const { currentBudgetspaceId } = useBudgetspace();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // During SSR, show skeleton. Once mounted on client, use Suspense
  if (!isMounted) {
    return <BudgetCardSkeleton />;
  }

  return (
    <Suspense fallback={<BudgetCardSkeleton />}>
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
