import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function BudgetCardSkeleton() {
  return (
    <Card className="md:w-[320px] md:min-h-[120px] border rounded m-4 relative">
      <CardHeader>
        <CardTitle className="mt-0.5">
          <Skeleton className="h-6 w-32" />
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {/* Skeleton for category items */}
        <div className="flex flex-col gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="text-sm px-2 py-2 bg-muted rounded-md flex justify-between items-center"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
        {/* Skeleton for Add Category button */}
        <Skeleton className="h-9 w-full mt-2" />
      </CardContent>
    </Card>
  );
}
