import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export function CategoriesListSkeleton() {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="h-8 w-24 rounded-full" />
      ))}
    </div>
  );
}

