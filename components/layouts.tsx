"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { PageHeader } from "@/components/page-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";

export function WithSideBarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <PageHeader />
        {/* <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div> */}
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

export function BlankLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function DynamicallySharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();
  const exemptedPath = ["/", "/onboarding"];
  return exemptedPath.includes(path) ? (
    <BlankLayout>{children}</BlankLayout>
  ) : (
    <WithSideBarLayout>{children}</WithSideBarLayout>
  );
}
