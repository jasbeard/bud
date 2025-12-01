"use client";

import { useState } from "react";
import { EmptyBudget } from "../empty-budget";
import { ExpenseSection } from "./expense-section";
import {
  BudgetSpaceProvider,
  useBudgetspace,
} from "@/contexts/budgetspace-context";

function BudgetPageContent() {
  const [showMainContent, setMainContent] = useState(false);
  const { currentBudgetspaceId } = useBudgetspace();

  const handleOnCreateBudet = () => {
    setMainContent(true);
  };
  const handleCloseExpense = () => {
    setMainContent(false);
  };

  // currentBudgetSpaceId is now available here
  // It returns the default budgetspace ID

  console.log("BugetPageContent: ", currentBudgetspaceId);

  return (
    <>
      {showMainContent ? (
        <ExpenseSection
          onClose={handleCloseExpense}
          currentBudgetspaceId={currentBudgetspaceId}
        />
      ) : null}
      {!showMainContent ? (
        <EmptyBudget onCreateBudget={handleOnCreateBudet} />
      ) : null}
    </>
  );
}

export function BudgetPage() {
  return (
    <BudgetSpaceProvider>
      <BudgetPageContent />
    </BudgetSpaceProvider>
  );
}
