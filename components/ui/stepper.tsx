"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type StepperContextValue = {
  activeStep: number;
  orientation: "horizontal" | "vertical";
  setActiveStep: (step: number) => void;
  registerStep: () => number;
};

const StepperContext = React.createContext<StepperContextValue | null>(null);

const useStepper = () => {
  const context = React.useContext(StepperContext);
  if (!context) {
    throw new Error("Stepper components must be used within a Stepper");
  }
  return context;
};

type StepperItemContextValue = {
  step: number;
};

const StepperItemContext = React.createContext<StepperItemContextValue | null>(
  null
);

const useStepperItem = () => {
  const context = React.useContext(StepperItemContext);
  return context;
};

const stepperVariants = cva("", {
  variants: {
    orientation: {
      horizontal: "flex flex-row",
      vertical: "flex flex-col",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

interface StepperProps extends React.ComponentProps<"div"> {
  activeStep?: number;
  onStepChange?: (step: number) => void;
  orientation?: "horizontal" | "vertical";
}

function Stepper({
  className,
  activeStep: controlledActiveStep,
  onStepChange,
  orientation = "horizontal",
  children,
  ...props
}: StepperProps) {
  const [internalActiveStep, setInternalActiveStep] = React.useState(0);
  const stepCounterRef = React.useRef(0);
  const activeStep = controlledActiveStep ?? internalActiveStep;
  const setActiveStep = React.useCallback(
    (step: number) => {
      if (controlledActiveStep === undefined) {
        setInternalActiveStep(step);
      }
      onStepChange?.(step);
    },
    [controlledActiveStep, onStepChange]
  );

  const registerStep = React.useCallback(() => {
    return stepCounterRef.current++;
  }, []);

  // Reset counter when children change
  React.useEffect(() => {
    stepCounterRef.current = 0;
  }, [children]);

  return (
    <StepperContext.Provider
      value={{
        activeStep,
        orientation,
        setActiveStep,
        registerStep,
      }}
    >
      <div
        data-slot="stepper"
        className={cn(stepperVariants({ orientation }), className)}
        {...props}
      >
        {children}
      </div>
    </StepperContext.Provider>
  );
}

function StepperList({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation } = useStepper();
  return (
    <div
      data-slot="stepper-list"
      className={cn(
        "flex",
        orientation === "horizontal" ? "flex-row items-start" : "flex-col",
        className
      )}
      {...props}
    />
  );
}

const stepperItemVariants = cva("", {
  variants: {
    orientation: {
      horizontal: "flex flex-row items-start",
      vertical: "flex flex-row items-start",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

interface StepperItemProps extends React.ComponentProps<"div"> {
  step?: number;
}

function StepperItem({
  className,
  step,
  children,
  ...props
}: StepperItemProps) {
  const { orientation, activeStep, registerStep } = useStepper();
  const [itemStep] = React.useState(() => step ?? registerStep());

  const isActive = activeStep === itemStep;
  const isCompleted = activeStep > itemStep;

  return (
    <StepperItemContext.Provider value={{ step: itemStep }}>
      <div
        data-slot="stepper-item"
        data-active={isActive}
        data-completed={isCompleted}
        className={cn(
          stepperItemVariants({ orientation }),
          orientation === "horizontal" ? "flex-1" : "w-full",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </StepperItemContext.Provider>
  );
}

const stepperIndicatorVariants = cva(
  "flex items-center justify-center rounded-full border-2 font-medium transition-all shrink-0",
  {
    variants: {
      state: {
        pending:
          "border-muted-foreground/30 bg-background text-muted-foreground",
        active: "border-primary bg-primary text-primary-foreground shadow-xs",
        completed: "border-primary bg-primary text-primary-foreground",
      },
      size: {
        sm: "size-6 text-xs",
        md: "size-8 text-sm",
        lg: "size-10 text-base",
      },
    },
    defaultVariants: {
      state: "pending",
      size: "md",
    },
  }
);

interface StepperIndicatorProps
  extends React.ComponentProps<"div">,
    VariantProps<typeof stepperIndicatorVariants> {
  step?: number;
  showCheck?: boolean;
}

function StepperIndicator({
  className,
  step,
  size = "md",
  showCheck = true,
  ...props
}: StepperIndicatorProps) {
  const { activeStep } = useStepper();
  const itemContext = useStepperItem();
  const itemStep = step ?? itemContext?.step ?? 0;
  const isActive = activeStep === itemStep;
  const isCompleted = activeStep > itemStep;

  const state = isCompleted ? "completed" : isActive ? "active" : "pending";

  return (
    <div
      data-slot="stepper-indicator"
      data-state={state}
      className={cn(stepperIndicatorVariants({ state, size }), className)}
      {...props}
    >
      {isCompleted && showCheck ? (
        <CheckIcon className="size-4" />
      ) : (
        <span>{itemStep + 1}</span>
      )}
    </div>
  );
}

function StepperTrigger({
  className,
  step,
  onClick,
  ...props
}: React.ComponentProps<"button"> & {
  step?: number;
}) {
  const { activeStep, setActiveStep } = useStepper();
  const itemContext = useStepperItem();
  const itemStep = step ?? itemContext?.step ?? 0;
  const isActive = activeStep === itemStep;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    setActiveStep(itemStep);
    onClick?.(e);
  };

  return (
    <button
      data-slot="stepper-trigger"
      type="button"
      onClick={handleClick}
      aria-current={isActive ? "step" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

function StepperContent({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation } = useStepper();
  return (
    <div
      data-slot="stepper-content"
      className={cn(
        "flex flex-col",
        orientation === "horizontal" ? "mt-2" : "ml-4 mt-1",
        className
      )}
      {...props}
    />
  );
}

function StepperTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stepper-title"
      className={cn("font-medium leading-none", className)}
      {...props}
    />
  );
}

function StepperDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="stepper-description"
      className={cn("text-muted-foreground text-sm mt-1.5", className)}
      {...props}
    />
  );
}

interface StepperSeparatorProps extends React.ComponentProps<"div"> {
  step?: number;
}

function StepperSeparator({
  className,
  step,
  ...props
}: StepperSeparatorProps) {
  const { orientation, activeStep, registerStep } = useStepper();
  const [stepIndex] = React.useState(() => step ?? registerStep() - 1);

  const isCompleted = activeStep > stepIndex;

  return (
    <div
      data-slot="stepper-separator"
      data-completed={isCompleted}
      className={cn(
        "bg-border transition-colors",
        orientation === "horizontal"
          ? "h-px flex-1 mx-2 mt-4"
          : "w-px min-h-8 my-2 ml-4",
        isCompleted && "bg-primary",
        className
      )}
      {...props}
    />
  );
}

export {
  Stepper,
  StepperList,
  StepperItem,
  StepperIndicator,
  StepperTrigger,
  StepperContent,
  StepperTitle,
  StepperDescription,
  StepperSeparator,
  useStepper,
};
