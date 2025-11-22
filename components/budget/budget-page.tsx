"use client";

import { useState } from "react";
import { EmptyBudget } from "../empty-budget";
import { ExpenseSection } from "./ExpenseSection";

export function BudgetPage() {
  const [showMainContent, setMainContent] = useState(false);
  const handleOnCreateBudet = () => {
    setMainContent(true);
  };
  const handleCloseExpense = () => {
    setMainContent(false);
  };
  return (
    <>
      {showMainContent ? <ExpenseSection onClose={handleCloseExpense} /> : null}
      {!showMainContent ? (
        <EmptyBudget onCreateBudget={handleOnCreateBudet} />
      ) : null}
    </>
  );
}
