import type { ComponentProps, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { FieldError } from "@/components/field-error";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({
  id,
  label,
  hint,
  error,
  children,
  className,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <Label htmlFor={id}>
        {label}
        {hint && <span className="font-normal text-muted-foreground">· {hint}</span>}
      </Label>
      {children}
      <FieldError id={id} error={error} />
    </div>
  );
}

/** Native <select> styled like Input; opens the platform picker on phones. */
/** `className` sizes the whole control (e.g. `max-w-72`, `flex-1`), so the chevron stays inside the box. */
export function NativeSelect({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className={cn("relative w-full", className)}>
      <select
        className={cn(
          "h-12 w-full appearance-none surface border-input bg-card py-1 pr-10 pl-4 text-base outline-none transition-colors md:h-11 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive-strong">
      {message}
    </p>
  );
}
