"use client";

import { useTransition } from "react";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { archiveClientAction } from "../../actions";

export function ArchiveCard({ clientId, name, upcoming }: { clientId: string; name: string; upcoming: number }) {
  const [pending, startTransition] = useTransition();

  const archive = () => {
    const lessons = upcoming > 0 ? ` Sıradaki ${upcoming} dersi takvimden kalkar.` : "";
    if (!window.confirm(`${name} arşive alınsın mı?${lessons} Geçmiş dersleri ve ödemeleri silinmez; istediğin zaman arşivden çıkarabilirsin.`)) return;
    startTransition(() => archiveClientAction(clientId));
  };

  return (
    <section aria-labelledby="archive-heading" className="mt-12 flex flex-col gap-3 surface p-4">
      <h2 id="archive-heading" className="text-base font-semibold">
        Danışanı arşivle
      </h2>
      <p className="text-sm text-muted-foreground">
        Gelmeyi bırakan danışanı listelerden kaldırır. Geçmiş dersler ve ödemeler silinmez; danışan sayfası kapanır
        {upcoming > 0 && `, sıradaki ${upcoming} dersi iptal olur`}. Sonra arşivden çıkarabilir ya da kalıcı olarak silebilirsin.
      </p>
      <Button type="button" variant="outline" className="sm:self-start" loading={pending} onClick={archive}>
        <Archive />
        {pending ? "Arşivleniyor…" : "Arşivle"}
      </Button>
    </section>
  );
}
