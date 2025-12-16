import useSWR from "swr";

interface BudgetCycleTimeline {
  id: string;
  budgetCycleId: string;
  userId: string;
  startDate: number;
  endDate: number;
  order: number | null;
  createdAt: Date;
  updatedAt: Date | null;
}

interface BudgetCycle {
  id: string;
  type: "monthly" | "bi-weekly" | "semi-monthly" | "weekly" | "custom";
  userId: string;
  budgetspaceId: string;
  createdAt: Date;
  updatedAt: Date | null;
  budgetspace: {
    id: string;
    name: string;
    description: string | null;
  };
  timelines: BudgetCycleTimeline[];
}

async function budgetCyclesFetcher(url: string): Promise<BudgetCycle[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch budget cycles");
  }
  return response.json();
}

/**
 * Hook to fetch and manage budget cycles data
 * @returns Object containing budget cycles data and loading state
 */
export function useBudgetCycles() {
  const {
    data: budgetCycles,
    isLoading,
    error,
    mutate,
  } = useSWR<BudgetCycle[]>("/api/budgetcycles", budgetCyclesFetcher);

  return {
    budgetCycles: budgetCycles || [],
    isLoading,
    error,
    mutate,
  };
}

// Export types for use in other files
export type { BudgetCycle, BudgetCycleTimeline };
