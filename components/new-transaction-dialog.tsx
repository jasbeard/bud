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

export function NewTransactionDialog({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md gap-8">
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
          <DialogDescription>
            Create a new transaction by filling out the details below.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-6">
          <div className="flex gap-2">
            <div className="flex flex-col flex-1 gap-2">
              <Label htmlFor="amount" className="">
                Amount
              </Label>
              <Input
                id="amount"
                placeholder="Amount"
                type="number"
                className=""
              />
            </div>
            <div className="flex flex-col flex-1 gap-2">
              <Label htmlFor="type" className="">
                Type
              </Label>
              <SelectTransaction
                id="type"
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
