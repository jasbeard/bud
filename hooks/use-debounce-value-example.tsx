import { useState, useEffect } from "react";
import { InputWithInfoTooltip } from "@/components/input-with-info-tooltip";
import { useDebounceValue } from "./use-debounce-value";

/**
 * Example component showing how to use useDebounceValue with InputWithInfoTooltip
 * This is just for demonstration - you can delete this file if not needed
 */
export function DebounceExample() {
  const [inputValue, setInputValue] = useState("");
  const debouncedValue = useDebounceValue(inputValue, 1000); // 500ms delay

  // This effect will only run when the debounced value changes
  // (after the user stops typing for 500ms)
  useEffect(() => {
    if (debouncedValue) {
      console.log("Debounced value:", debouncedValue);
      // Here you could make an API call, validate the input, etc.
    }
  }, [debouncedValue]);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium">
          Search Input (with debounce):
        </label>
        <InputWithInfoTooltip
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type something..."
          tooltipMessage="This input is debounced - API calls will only happen after you stop typing"
          className="max-w-sm"
        />
      </div>

      <div className="text-sm text-muted-foreground">
        <p>Current value: {inputValue}</p>
        <p>Debounced value: {debouncedValue}</p>
      </div>
    </div>
  );
}
