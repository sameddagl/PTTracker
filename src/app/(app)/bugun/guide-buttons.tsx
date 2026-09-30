"use client";

import { useTransition, type ComponentProps, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setBioLinkAddedAction, setGuideDismissedAction } from "./actions";

type Props = Omit<ComponentProps<typeof Button>, "onClick" | "loading"> & { children: ReactNode };

function ActionButton({ run, success, children, ...props }: Props & { run: () => Promise<unknown>; success?: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      {...props}
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            await run();
            if (success) toast.success(success);
          } catch {
            toast.error("Kaydedilemedi. Tekrar dene.");
          }
        })
      }
    >
      {children}
    </Button>
  );
}

/** Hides the checklist, or (with `show`) brings it back. */
export function GuideVisibilityButton({ show = false, ...props }: Props & { show?: boolean }) {
  return (
    <ActionButton
      run={() => setGuideDismissedAction(!show)}
      success={show ? "Rehber Bugün sayfasına geri geldi" : undefined}
      {...props}
    />
  );
}

export function BioLinkAddedButton(props: Props) {
  return <ActionButton run={() => setBioLinkAddedAction(true)} success="Harika, bu adım tamam" {...props} />;
}
