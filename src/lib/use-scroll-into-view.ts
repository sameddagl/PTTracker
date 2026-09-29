import { useEffect, useRef } from "react";

/**
 * Scrolls an element into view and focuses it whenever `trigger` changes to a
 * truthy value. For warnings that appear below the fold after a submit.
 */
export function useScrollIntoView<T extends HTMLElement>(trigger: unknown) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!trigger || !ref.current) return;
    ref.current.scrollIntoView({ behavior: "smooth", block: "center" });
    ref.current.focus({ preventScroll: true });
  }, [trigger]);
  return ref;
}
