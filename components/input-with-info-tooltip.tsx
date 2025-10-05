import { InfoIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type InputWithTooltipProps = {
  tooltipMessage?: string;
} & React.ComponentProps<"input">;

export function InputWithInfoTooltip({
  tooltipMessage,
  className,
  ...props
}: InputWithTooltipProps) {
  return (
    <InputGroup className={className}>
      <InputGroupInput {...props} />
      <InputGroupAddon align="inline-end">
        <Tooltip>
          <TooltipTrigger asChild>
            <InputGroupButton variant="ghost" aria-label="Info" size="icon-xs">
              <InfoIcon />
            </InputGroupButton>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipMessage}</p>
          </TooltipContent>
        </Tooltip>
      </InputGroupAddon>
    </InputGroup>
  );
}
