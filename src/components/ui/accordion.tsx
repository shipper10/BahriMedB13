"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

type AccordionContextValue = {
  value: string[];
  onToggle: (value: string) => void;
  type: "single" | "multiple";
};

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  defaultValue?: string[];
}

export function Accordion({
  type = "single",
  defaultValue = [],
  className,
  children,
  ...props
}: AccordionProps) {
  const [value, setValue] = React.useState<string[]>(defaultValue);

  const onToggle = React.useCallback(
    (itemValue: string) => {
      setValue((current) => {
        if (type === "single") {
          return current.includes(itemValue) ? [] : [itemValue];
        }
        return current.includes(itemValue)
          ? current.filter((item) => item !== itemValue)
          : [...current, itemValue];
      });
    },
    [type]
  );

  return (
    <AccordionContext.Provider value={{ value, onToggle, type }}>
      <div className={cn("space-y-2", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function AccordionItem({ value, className, children, ...props }: AccordionItemProps) {
  const context = React.useContext(AccordionContext);

  if (!context) {
    return null;
  }

  const isOpen = context.value.includes(value);

  return (
    <div
      data-state={isOpen ? "open" : "closed"}
      className={cn("overflow-hidden rounded-xl border bg-card", className)}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        if (child.type === AccordionTrigger || (child as any).type?.displayName === "AccordionTrigger") {
          return React.cloneElement(child as React.ReactElement<any>, { isOpen, value } as any);
        }
        if (child.type === AccordionContent || (child as any).type?.displayName === "AccordionContent") {
          return React.cloneElement(child as React.ReactElement<any>, { isOpen, value } as any);
        }
        return child;
      })}
    </div>
  );
}

interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value?: string;
  isOpen?: boolean;
}

export function AccordionTrigger({
  className,
  children,
  value,
  isOpen,
  onClick,
  ...props
}: AccordionTriggerProps) {
  const context = React.useContext(AccordionContext);

  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-foreground",
        className,
      )}
      onClick={(event) => {
        onClick?.(event);
        if (value && context) {
          context.onToggle(value);
        }
      }}
      {...props}
    >
      <span>{children}</span>
      <ChevronDown
        className={cn("size-4 shrink-0 transition-transform", isOpen && "rotate-180")}
      />
    </button>
  );
}

AccordionTrigger.displayName = "AccordionTrigger";

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  isOpen?: boolean;
}

export function AccordionContent({
  className,
  children,
  isOpen,
  ...props
}: AccordionContentProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className={cn("border-t bg-muted/20 px-4 py-4", className)} {...props}>
      {children}
    </div>
  );
}

AccordionContent.displayName = "AccordionContent";
