"use client";

import * as React from "react";
import { Suspense, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  BudgetSpaceProvider,
  useBudgetspace,
} from "@/contexts/budgetspace-context";

function formatSegment(segment: string): string {
  // Decode URI component, replace hyphens with spaces, capitalize first letter
  const decoded = decodeURIComponent(segment);
  const withSpaces = decoded.replaceAll("-", " ");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

function PageBreadcrumbContent() {
  const pathname = usePathname() || "/";
  const { spaces } = useBudgetspace();

  // Get the default/current budgetspace name
  const currentBudgetspace =
    spaces?.find((space) => space.isDefault) || spaces?.[0];
  const workspaceName = currentBudgetspace?.name || "Workspace";

  // Parse pathname into segments
  const cleanPath = pathname.split(/[?#]/, 1)[0];
  const withoutLeading = cleanPath[0] === "/" ? cleanPath.slice(1) : cleanPath;
  const segments = withoutLeading.split("/").filter(Boolean);

  // If we're on the home page, just show workspace name
  if (segments.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-base font-medium">
              {workspaceName}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Build breadcrumb items: workspace name > path segments
  const breadcrumbItems = [
    {
      label: workspaceName,
      href: "/",
      isPage: false,
    },
    ...segments.map((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      const isLast = index === segments.length - 1;
      return {
        label: formatSegment(segment),
        href,
        isPage: isLast,
      };
    }),
  ];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.href}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {item.isPage ? (
                <BreadcrumbPage className="text-base font-medium">
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href} className="text-base font-medium">
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function PageBreadcrumbFallback() {
  const pathname = usePathname() || "/";
  const cleanPath = pathname.split(/[?#]/, 1)[0];
  const withoutLeading = cleanPath[0] === "/" ? cleanPath.slice(1) : cleanPath;
  const segments = withoutLeading.split("/").filter(Boolean);

  if (segments.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage className="text-base font-medium">
              Workspace
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  const breadcrumbItems = [
    {
      label: "Workspace",
      href: "/",
      isPage: false,
    },
    ...segments.map((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/");
      const isLast = index === segments.length - 1;
      return {
        label: formatSegment(segment),
        href,
        isPage: isLast,
      };
    }),
  ];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.href}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {item.isPage ? (
                <BreadcrumbPage className="text-base font-medium">
                  {item.label}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={item.href} className="text-base font-medium">
                    {item.label}
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function PageBreadcrumb() {
  const [isMounted, setIsMounted] = useState(false);

  // NOTE: this is an initial implementation of breadcrumb, there few more things to conisder, as follows
  // TODO:
  //  - polish/fix crumb links (implement missing pages e.g workspace settings)
  //  - style and taste

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // During SSR, show fallback. Once mounted on client, use Suspense
  if (!isMounted) {
    return <PageBreadcrumbFallback />;
  }

  return (
    <Suspense fallback={<PageBreadcrumbFallback />}>
      <BudgetSpaceProvider>
        <PageBreadcrumbContent />
      </BudgetSpaceProvider>
    </Suspense>
  );
}
