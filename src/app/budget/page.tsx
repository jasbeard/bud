import { EmptyBudget } from "@/components/empty-budget";
import { PageOnboarding } from "@/components/page-onboarding";

export default async function Page() {
  return (
    <>
      <PageOnboarding />
      <EmptyBudget />
    </>
  );
}
