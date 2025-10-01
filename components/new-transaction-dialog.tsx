import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/diaglog";
import { Label } from "@/components/ui/label";
import { Textarea } from "./ui/textarea";
import { Combobox } from "./combobox-";
import { Input } from "./ui/input";

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
          <DialogDescription>
            Create a new transaction by filling out the details below.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Combobox
            options={trasactionKinds}
            placeholder="Select transcation type"
            searchPlaceholder="Search type"
            searchNotFoundText="Type not found"
          />
          <div className="grid flex-1 gap-2">
            <Label htmlFor="amount" className="sr-only">
              Amount
            </Label>
            <Input placeholder="Amount" className="w-2/5" />
          </div>
          <Combobox
            options={categories}
            placeholder="Select category"
            searchPlaceholder="Search category"
            searchNotFoundText="Categoty not found"
          />
          <div className="grid flex-1 gap-2">
            <Label htmlFor="description" className="sr-only">
              Description
            </Label>
            <Textarea id="description" placeholder="Description" />
          </div>
        </div>
        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="secondary" className="cursor-pointer">
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
