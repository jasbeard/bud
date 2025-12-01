"use client";

import * as React from "react";
import { atom, useAtomValue, useSetAtom } from "jotai";
import useSWR from "swr";

interface BudgetSpace {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date | null;
}

interface BudgetSpacesResponse {
  spaces: BudgetSpace[];
  plan: string;
}

async function fetcher(url: string): Promise<BudgetSpacesResponse> {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 401) {
      return { spaces: [], plan: "Basic" };
    }
    throw new Error("Failed to fetch budgetspaces");
  }
  return response.json();
}

// Base atom to store the budget spaces response data
// Initialize with fallback to prevent layout shifts
const budgetSpacesDataAtom = atom<BudgetSpacesResponse>({
  spaces: [],
  plan: "Basic",
});

// Atom to store loading state
const budgetSpacesLoadingAtom = atom<boolean>(false);

// Atom to store error state
const budgetSpacesErrorAtom = atom<Error | undefined>(undefined);

// Atom to store the mutate function from SWR
const budgetSpacesMutateAtom = atom<
  (() => Promise<BudgetSpacesResponse | undefined>) | null
>(null);

// Derived atom for spaces array
const budgetSpacesAtom = atom((get) => {
  const data = get(budgetSpacesDataAtom);
  return data?.spaces ?? [];
});

// Derived atom for plan
const budgetPlanAtom = atom((get) => {
  const data = get(budgetSpacesDataAtom);
  return data?.plan ?? "Basic";
});

// Derived atom for default budget space ID
const defaultBudgetSpaceIdAtom = atom((get) => {
  const spaces = get(budgetSpacesAtom);
  const defaultSpace = spaces.find((space) => space.isDefault === true);
  return defaultSpace?.id ?? null;
});

// Provider component - syncs SWR data to Jotai atoms
export function BudgetSpaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const setBudgetSpacesData = useSetAtom(budgetSpacesDataAtom);
  const setLoading = useSetAtom(budgetSpacesLoadingAtom);
  const setError = useSetAtom(budgetSpacesErrorAtom);
  const setMutate = useSetAtom(budgetSpacesMutateAtom);

  // Use SWR to handle fetching and automatic revalidation
  const { data, isLoading, error, mutate } = useSWR<BudgetSpacesResponse>(
    "/api/budgetspaces/all",
    fetcher,
    {
      suspense: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
      fallbackData: { spaces: [], plan: "Basic" },
    }
  );

  // Sync SWR state to Jotai atoms immediately to prevent layout shifts
  // Use useLayoutEffect for synchronous updates before paint
  React.useLayoutEffect(() => {
    if (data) {
      setBudgetSpacesData(data);
    }
  }, [data, setBudgetSpacesData]);

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

// Hook to access budget space data
export function useBudgetspace() {
  const spaces = useAtomValue(budgetSpacesAtom);
  const plan = useAtomValue(budgetPlanAtom);
  const defaultBudgetSpaceId = useAtomValue(defaultBudgetSpaceIdAtom);
  const isLoading = useAtomValue(budgetSpacesLoadingAtom);
  const error = useAtomValue(budgetSpacesErrorAtom);
  const mutateFn = useAtomValue(budgetSpacesMutateAtom);

  const mutate = React.useCallback(async () => {
    if (mutateFn) {
      return mutateFn();
    }
    return undefined;
  }, [mutateFn]);

  return {
    defaultBudgetSpaceId,
    spaces,
    plan,
    isLoading,
    error,
    mutate,
  };
}
