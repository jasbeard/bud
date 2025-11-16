"use client";

import { X } from "lucide-react";

type CategoryProps = {
  name: string;
  onRemove?: () => void;
  isDefault?: boolean;
};

export function Category({ name, onRemove, isDefault = false }: CategoryProps) {
  const showRemoveButton = onRemove && !isDefault;

  return (
    <div className="w-fit border h-8 rounded-full px-4 flex items-center justify-center gap-2 hover:bg-accent hover:text-accent-foreground text-muted-foreground">
      <span>{name}</span>
      {showRemoveButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 rounded-full p-0.5 flex items-center justify-center cursor-pointer border hover:bg-red-400"
          aria-label={`Remove ${name}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}
