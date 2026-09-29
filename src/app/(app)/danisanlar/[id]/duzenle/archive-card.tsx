"use client";

import { useTransition } from "react";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { archiveClientAction } from "../../actions";

export function ArchiveCard({ clientId, name, upcoming }: { clientId: string; name: string; upcoming: number }) {
  const [pending, startTransition] = useTransition();

  const archive = () => {
    const lessons = upcoming > 0 ? ` Sıradaki ${upcoming} dersi takvimden kaldırılacak.` : "";
    if (!window.confirm(`${name} arşivlensin mi?${lessons} Geçmiş dersleri ve ödemeleri saklanır, istediğinde geri alabilirsin.`)) return;
    startTransition(() => archiveClientAction(clientId));
  };

  return (
    <section aria-labelledby="archive-heading" className="mt-12 flex flex-col gap-3 surface p-4">
      <h2 id="archive-heading" className="text-base font-semibold">
        Danışanı arşivle
      </h2>
      <p className="text-sm text-muted-foreground">
        Artık gelmeyen danışanı listelerden kaldırır. Geçmiş dersler ve ödemeler saklanır; portal linki kapanır
        {upcoming > 0 && `, sıradaki ${upcoming} dersi iptal edilir`}. Arşivden geri alabilir ya da kalıcı olarak silebilirsin.
      </p>
      <Button type="button" variant="outline" className="sm:self-start" loading={pending} onClick={archive}>
        <Archive />
        {pending ? "Arşivleniyor…" : "Arşivle"}
      </Button>
    </section>
  );
}
