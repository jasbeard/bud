import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronRight } from "lucide-react";

export default function Page() {
  return (
    <div className="flex justify-center items-center h-dvh">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Let&apos;s Get Started</CardTitle>
          <CardDescription>
            Choose a name for your new Budgetspace. This will help you organize
            and manage your finances.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="budgetspace">Budgetspace</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="E.g. Household"
                  required
                />
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            type="submit"
            size="icon"
            variant="outline"
            className="rounded-full cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
