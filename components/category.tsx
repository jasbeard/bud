"use client";

type CategoryProps = {
  name: string;
};

export function Category({ name }: CategoryProps) {
  return (
    <div className="w-fit border h-8 rounded-full px-4 flex items-center justify-center hover:bg-accent hover:text-accent-foreground text-muted-foreground">
      {name}
    </div>
  );
}
