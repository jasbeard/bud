"use client";

import * as React from "react";
import { atom, useAtomValue, useSetAtom } from "jotai";
import useSWR from "swr";

interface Budget {
  id: string;
  name: string;
  totalAmount: string;
  budgetCategoryId: string;
  budgetspaceId: string;
  budgetCycleId: string | null;
  createdAt: Date;
  updatedAt: Date | null;
}

async function fetcher(url: string): Promise<Budget[]> {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 401) {
      return [];
    }
    throw new Error("Failed to fetch budgets");
  }
  return response.json();
}

// Base atom to store the budgets data
// Initialize with fallback to prevent layout shifts
const budgetsDataAtom = atom<Budget[]>([]);

// Atom to store loading state
const budgetsLoadingAtom = atom<boolean>(false);

// Atom to store error state
const budgetsErrorAtom = atom<Error | undefined>(undefined);

// Atom to store the mutate function from SWR
const budgetsMutateAtom = atom<(() => Promise<Budget[] | undefined>) | null>(
  null
);

// Derived atom for budgets array
const budgetsAtom = atom((get) => {
  return get(budgetsDataAtom) ?? [];
});

// Provider component - syncs SWR data to Jotai atoms
export function BudgetProvider({
  children,
  budgetspaceId,
}: {
  children: React.ReactNode;
  budgetspaceId?: string;
}) {
  const setBudgetsData = useSetAtom(budgetsDataAtom);
  const setLoading = useSetAtom(budgetsLoadingAtom);
  const setError = useSetAtom(budgetsErrorAtom);
  const setMutate = useSetAtom(budgetsMutateAtom);

  // Build the URL with optional query params
  const url = React.useMemo(() => {
    const baseUrl = "/api/budgets";
    if (budgetspaceId) {
      return `${baseUrl}?budgetspaceId=${budgetspaceId}`;
    }
    return baseUrl;
  }, [budgetspaceId]);

  // Use SWR to handle fetching and automatic revalidation
  const { data, isLoading, error, mutate } = useSWR<Budget[]>(url, fetcher, {
    suspense: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: false,
    fallbackData: [], // Required for SSR with Suspense
  });

  // Sync SWR state to Jotai atoms immediately to prevent layout shifts
  // Use useLayoutEffect for synchronous updates before paint
  // With suspense: true, data will be available when this renders
  React.useLayoutEffect(() => {
    setBudgetsData(data ?? []);
  }, [data, setBudgetsData]);

  React.useLayoutEffect(() => {
    setLoading(isLoading ?? false);
  }, [isLoading, setLoading]);

  React.useLayoutEffect(() => {
    setError(error as Error | undefined);
  }, [error, setError]);

  React.useLayoutEffect(() => {
    setMutate(() => mutate);
  }, [mutate, setMutate]);

  return <>{children}</>;
}

// Hook to access budget data
export function useBudgets() {
  const budgets = useAtomValue(budgetsAtom);
  const isLoading = useAtomValue(budgetsLoadingAtom);
  const error = useAtomValue(budgetsErrorAtom);
  const mutateFn = useAtomValue(budgetsMutateAtom);

  const mutate = React.useCallback(async () => {
    if (mutateFn) {
      return mutateFn();
    }
    return undefined;
  }, [mutateFn]);

  return {
    budgets,
    isLoading,
    error,
    mutate,
  };
}
