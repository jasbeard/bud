import { useState, useEffect } from "react";

/**
 * A hook that debounces a value, useful for input fields to avoid excessive API calls
 * or validation triggers while the user is typing.
 *
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [inputValue, setInputValue] = useState('');
 * const debouncedValue = useDebounceValue(inputValue, 500);
 *
 * useEffect(() => {
 *   if (debouncedValue) {
 *     // Perform API call or validation with debouncedValue
 *     validateInput(debouncedValue);
 *   }
 * }, [debouncedValue]);
 *
 * return (
 *   <InputWithInfoTooltip
 *     value={inputValue}
 *     onChange={(e) => setInputValue(e.target.value)}
 *     placeholder="Type something..."
 *   />
 * );
 * ```
 */
export function useDebounceValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
