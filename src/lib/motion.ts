import type { CSSProperties } from "react";

/** Stagger for revealed items in a row: delay grows with the index, restarting every `per` items. */
export const stagger = (i: number, per = 3, step = 90) => ({ "--delay": `${(i % per) * step}ms` }) as CSSProperties;
