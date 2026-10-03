// Studio teams: calendar colours for instructors and the rules for a pay rule.
// The colours are CSS tokens in globals.css (--team-<key>), tuned for light and dark.

export const TEAM_COLORS = ["lime", "sky", "rose", "amber", "violet", "teal"] as const;
export type TeamColor = (typeof TEAM_COLORS)[number];

export const TEAM_COLOR_LABELS: Record<TeamColor, string> = {
  lime: "Yeşil",
  sky: "Mavi",
  rose: "Pembe",
  amber: "Turuncu",
  violet: "Mor",
  teal: "Turkuaz",
};

export const isTeamColor = (c: unknown): c is TeamColor => typeof c === "string" && (TEAM_COLORS as readonly string[]).includes(c);

/** CSS colour for a member, falling back by position so nobody is colourless. */
export function teamColor(color: string | null | undefined, index = 0) {
  const key = isTeamColor(color) ? color : TEAM_COLORS[index % TEAM_COLORS.length];
  return `var(--team-${key})`;
}

/** The first colour nobody in the team uses yet (a member without one shows the colour of their position). */
export function nextTeamColor(colors: (string | null)[]): TeamColor {
  const used = colors.map((c, i) => (isTeamColor(c) ? c : TEAM_COLORS[i % TEAM_COLORS.length]));
  return TEAM_COLORS.find((c) => !used.includes(c)) ?? TEAM_COLORS[used.length % TEAM_COLORS.length];
}

export const INVITE_DAYS = 7;
export const INVITE_TOKEN_PATTERN = /^[A-Za-z0-9_-]{32}$/;
