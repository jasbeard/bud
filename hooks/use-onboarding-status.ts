import useSWR from "swr";
import { authClient } from "@/lib/auth-client";

type OnboardingStatus = {
  isOnboarded: boolean;
  onboardedAt: string | null;
};

async function fetcher(url: string): Promise<OnboardingStatus> {
  // Check if user is authenticated first
  const session = await authClient.getSession();
  if (!session?.data?.user?.id) {
    // Return onboarded=true to hide popover for unauthenticated users
    return { isOnboarded: true, onboardedAt: null };
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch onboarding status");
  }
  return response.json();
}

/**
 * Hook to check user onboarding status
 * @param enabled - Whether to fetch the onboarding status. Defaults to true.
 * @returns Object with onboarding status and loading state
 */
export function useOnboardingStatus(enabled: boolean = true) {
  const { data, error, isLoading } = useSWR<OnboardingStatus>(
    enabled ? "/api/user" : null,
    fetcher,
    {
      // Only fetch if we're on the client side
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      // Don't retry on error - if it fails, we'll default to showing popover
      shouldRetryOnError: false,
    }
  );
  console.log("useOnboardingStatus:");
  return {
    isOnboarded: data?.isOnboarded ?? false,
    isLoading,
    error,
  };
}
