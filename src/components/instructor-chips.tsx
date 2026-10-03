import { teamColor } from "@/lib/team";

export type ChipMember = { id: string; fullName: string; color: string | null };

/**
 * Who teaches with a package, for a studio's packages (public page, client's
 * page). A package limited to some instructors lists them; an open one says
 * every instructor. Nothing for a trainer working alone (`team` empty).
 */
export function InstructorChips({ team, instructorIds }: { team: ChipMember[]; instructorIds: string[] | null }) {
  if (team.length < 2) return null;
  const limited = instructorIds && instructorIds.length > 0;
  const shown = limited ? team.filter((m) => instructorIds.includes(m.id)) : [];
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Eğitmenler">
      {limited ? (
        shown.map((m) => (
          <li key={m.id} className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
            <span className="size-2 rounded-full" style={{ background: teamColor(m.color, team.indexOf(m)) }} aria-hidden />
            {m.fullName}
          </li>
        ))
      ) : (
        <li className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">Bütün eğitmenler</li>
      )}
    </ul>
  );
}
