"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Button } from "@/components/ui/button";

/** Whether the form around `ref` passes the browser's checks, kept up to date as it's filled in. */
export function useFormValid(ref: React.RefObject<HTMLElement | null>) {
  const [valid, setValid] = useState(true);
  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const update = () => setValid(form.checkValidity());
    update();
    form.addEventListener("input", update);
    form.addEventListener("change", update);
    form.addEventListener("reset", () => queueMicrotask(update));
    // Fields that appear or disappear (e.g. "Her hafta tekrarla") change what's required.
    const observer = new MutationObserver(update);
    observer.observe(form, { subtree: true, childList: true, attributes: true, attributeFilter: ["required", "disabled", "min", "max", "pattern"] });
    return () => {
      form.removeEventListener("input", update);
      form.removeEventListener("change", update);
      observer.disconnect();
    };
  }, [ref]);
  return valid;
}

/**
 * Submit button that stays disabled until the form's required fields are
 * filled in and valid. Pass `always` for secondary submits that must work
 * regardless (e.g. "Yine de kaydet" after a conflict warning).
 */
export function FormSubmit({ disabled, always, ...props }: Omit<ComponentProps<typeof Button>, "type"> & { always?: boolean }) {
  const ref = useRef<HTMLButtonElement>(null);
  const valid = useFormValid(ref);
  return <Button ref={ref} type="submit" disabled={disabled || (!always && !valid)} {...props} />;
}
