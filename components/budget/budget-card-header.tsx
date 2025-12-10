import { Button } from "@/components/ui/button";
import { MoreVertical, PencilIcon, XIcon } from "lucide-react";
import { CardHeader, CardTitle, CardAction } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BudgetCardHeaderProps {
  budgetName: string;
  onEdit: () => void;
  onDelete?: () => void;
}

export function BudgetCardHeader({
  budgetName,
  onEdit,
  onDelete,
}: BudgetCardHeaderProps) {
  return (
    <CardHeader>
      <CardTitle className="mt-0.5">{budgetName}</CardTitle>
      {onDelete && (
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 cursor-pointer"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="right">
              <DropdownMenuItem onClick={onEdit}>
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete}>
                <XIcon className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      )}
    </CardHeader>
  );
}
