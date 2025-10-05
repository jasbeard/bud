"use client";

import { useSearchParams } from "next/navigation";
import { OnboardingAlertDialog } from "./onboarding-alert-dialog";

export function PageOnboarding() {
  const params = useSearchParams();
  const showOnboardingDialog = params.has("onboarding");

  return (
    <OnboardingAlertDialog
      open={showOnboardingDialog}
      onOpenChange={(current) => {
        // Handle dialog close - could update URL params or parent state
        if (!current) {
          // Remove onboarding param from URL when dialog closes
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete("onboarding");
          window.history.replaceState({}, "", newUrl.toString());
        }
      }}
    />
  );
}
