"use client";

import { useState, useTransition } from "react";
import { UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { NativeSelect } from "@/components/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addMemberAction, endGroupAction, removeMemberAction } from "../actions";

type Member = { id: string; clientId: string; name: string; since: string };

export function MemberList({
  classId,
  live,
  full,
  today,
  members,
  clients,
}: {
  classId: string;
  live: boolean;
  full: boolean;
  today: string;
  members: Member[];
  clients: { id: string; fullName: string }[];
}) {
  const [clientId, setClientId] = useState("");
  const [startsOn, setStartsOn] = useState(today);
  const [adding, startAdd] = useTransition();
  const [removing, setRemoving] = useState<string | null>(null);
  const [, startRemove] = useTransition();

  function add() {
    startAdd(async () => {
      const res = await addMemberAction(classId, clientId, startsOn);
      if (!res.ok) return void toast.error(res.error);
      setClientId("");
      toast.success(
        res.skipped > 0 ? `Sabit yer verildi. Dolu olan ${res.skipped} derse eklenemedi.` : "Sabit yer verildi, önümüzdeki derslere eklendi.",
      );
    });
  }

  function remove(m: Member) {
    if (!window.confirm(`${m.name} sabit yerinden çıkarılsın mı? Önümüzdeki derslerdeki yeri de boşalır.`)) return;
    setRemoving(m.id);
    startRemove(async () => {
      await removeMemberAction(m.id);
      setRemoving(null);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {members.length > 0 && (
        <ul className="divide-y overflow-hidden surface">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2 pr-2 pl-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.since} itibarıyla</p>
              </div>
              {live && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  aria-label={`${m.name} sabit yerinden çıkar`}
                  loading={removing === m.id}
                  onClick={() => remove(m)}
                >
                  <UserMinus className="text-muted-foreground" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {live &&
        (full ? (
          <p className="text-sm text-muted-foreground">Sabit yerler dolu. Kapasiteyi artırarak yer açabilirsin.</p>
        ) : (
          <div className="flex flex-col gap-3 surface p-4 sm:flex-row sm:items-end">
            <label className="flex flex-1 flex-col gap-2 text-sm font-medium">
              Danışan
              <NativeSelect value={clientId} onChange={(e) => setClientId(e.target.value)}>
                <option value="">Seç</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
              </NativeSelect>
            </label>
            <label className="flex flex-col gap-2 text-sm font-medium">
              Başlangıç
              <Input type="date" value={startsOn} min={today} onChange={(e) => setStartsOn(e.target.value)} />
            </label>
            <Button type="button" loading={adding} disabled={!clientId} onClick={add}>
              <UserPlus />
              Sabit yer ver
            </Button>
          </div>
        ))}
    </div>
  );
}

export function EndGroupButton({ classId, title }: { classId: string; title: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant="ghost"
      className="text-destructive-strong hover:text-destructive-strong"
      loading={pending}
      onClick={() => {
        if (!window.confirm(`${title} bitirilsin mi? Bugünden sonraki dersler iptal edilir, kimsenin paketinden düşmez.`)) return;
        start(() => endGroupAction(classId));
      }}
    >
      Grup dersini bitir
    </Button>
  );
}
