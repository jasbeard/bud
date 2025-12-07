"use client";

import { useState, Suspense, useEffect } from "react";
import { EmptyBudget } from "../empty-budget";
import { BudgetList } from "./budget-card";
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
  const { budgets, isLoading } = useBudgets();

  const handleOnCreateBudet = () => {
    setMainContent(true);
  };
  const handleCloseExpense = () => {
    setMainContent(false);
  };

  // Show empty state if no budgets exist
  const hasBudgets = budgets.length > 0;

  return (
    <>
      {isLoading ? (
        <UpdatingBadge />
      ) : showMainContent || hasBudgets ? (
        <BudgetList onClose={handleCloseExpense} budgets={budgets} />
      ) : (
        <EmptyBudget onCreateBudget={handleOnCreateBudet} />
      )}
    </>
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
