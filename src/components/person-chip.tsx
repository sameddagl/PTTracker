/** A team member as a small pill with their calendar colour (who made a template, who teaches a package). */
export function PersonChip({ name, color }: { name: string; color: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
      <span className="size-2 rounded-full" style={{ background: color }} aria-hidden />
      {name}
    </span>
  );
}
