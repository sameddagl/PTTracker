"use client";

import { useEffect, useState } from "react";
import { isCheckable, validityMessage } from "@/lib/validity";

/**
 * Shows what's wrong with the control `id` once the user has left it (or the
 * server said so), and marks it aria-invalid so it gets the red frame. A
 * server error stays until the field is edited; then the browser's own
 * checks (required, email, minLength…) take over.
 */
export function FieldError({ id, error }: { id: string; error?: string }) {
  const [clientMessage, setClientMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState(error);
  const [prevError, setPrevError] = useState(error);
  // A new server error (from a fresh submit) replaces the old one.
  if (error !== prevError) {
    setPrevError(error);
    setServerError(error);
  }

  useEffect(() => {
    const el = document.getElementById(id);
    if (!isCheckable(el)) return;
    let touched = false;
    const check = () => touched && setClientMessage(validityMessage(el));
    const onBlur = () => {
      touched = true;
      check();
    };
    const onEdit = () => {
      setServerError(undefined);
      // Radios and checkboxes count as touched on the first change.
      if (el instanceof HTMLInputElement && (el.type === "radio" || el.type === "checkbox")) touched = true;
      check();
    };
    el.addEventListener("blur", onBlur);
    el.addEventListener("input", onEdit);
    el.addEventListener("change", onEdit);
    return () => {
      el.removeEventListener("blur", onBlur);
      el.removeEventListener("input", onEdit);
      el.removeEventListener("change", onEdit);
    };
  }, [id]);

  const message = serverError ?? clientMessage;

  useEffect(() => {
    const el = document.getElementById(id);
    if (!el) return;
    if (message) {
      el.setAttribute("aria-invalid", "true");
      el.setAttribute("aria-describedby", `${id}-error`);
    } else {
      el.removeAttribute("aria-invalid");
      if (el.getAttribute("aria-describedby") === `${id}-error`) el.removeAttribute("aria-describedby");
    }
  }, [id, message]);

  if (!message) return null;
  return (
    <p id={`${id}-error`} className="text-sm text-destructive-strong">
      {message}
    </p>
  );
}
