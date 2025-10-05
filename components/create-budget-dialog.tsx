import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/diaglog";
import { Label } from "@/components/ui/label";
import { Textarea } from "./ui/textarea";
import { Combobox } from "./combobox";
import { Input } from "./ui/input";
import { SelectTransaction } from "./select-transaction";
import { DatePickerTransaction } from "./date-picker-transaction";

const trasactionKinds = [
  {
    label: "Expense",
    value: "expense",
  },
  {
    label: "Income",
    value: "income",
  },
  {
    label: "Transfer",
    value: "transfer",
  },
];

const categories = [
  {
    label: "Rent",
    value: "rent",
  },
  {
    label: "Transportation",
    value: "transportation",
  },
  {
    label: "Bill",
    value: "bill",
  },
  {
    label: "Food",
    value: "food",
  },
  {
    label: "Subscription",
    value: "subscription",
  },
];

export function CreateBudgetDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md gap-8">
        <DialogHeader>
          <DialogTitle>Plan your budget</DialogTitle>
          <DialogDescription>
            Set up your budget by specifying your planned income, expenses, and
            categories below.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6">
          <div className="flex gap-2">
            <div className="flex flex-col flex-1 gap-2">
              <Label htmlFor="name" className="">
                Name
              </Label>
              <Input
                id="name"
                placeholder="Budget 1"
                type="number"
                className=""
              />
            </div>
            <div className="flex flex-col flex-1 gap-2">
              <Label htmlFor="cycle" className="">
                Cycle
              </Label>
              <SelectTransaction
                id="cycle"
                options={trasactionKinds}
                label="Transaction types"
                placeholder="Select type"
                className="w-full"
              />
            </div>
          </div>
          <div className="grid flex-1 gap-2">
            <div className="flex justify-between">
              <Label htmlFor="Category" className="">
                Category
              </Label>
              <div className="text-muted-foreground text-xs decoration-muted-foreground hover:underline cursor-pointer">
                Manage
              </div>
            </div>
            <Combobox
              id="Category"
              options={categories}
              placeholder="Select category"
              searchPlaceholder="Search category"
              searchNotFoundText="Categoty not found"
            />
          </div>
          <div className="grid flex-1 gap-2">
            <DatePickerTransaction />
          </div>
          <div className="grid flex-1 gap-2">
            <Label htmlFor="description" className="">
              Note
            </Label>
            <Textarea id="description" placeholder="Description" />
          </div>
        </div>
        <DialogFooter className="sm:justify-end">
          <Button type="submit" variant="default" className="cursor-pointer">
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
