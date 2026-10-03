import type { ReactNode } from "react";
import { requireOwner } from "@/db";

/**
 * Layout for owner-only parts of the app (money, packages, studio settings).
 * An instructor gets a 404. Server actions behind these pages check the role
 * themselves too, and RLS keeps the money tables owner-only.
 */
export default async function OwnerOnlyLayout({ children }: { children: ReactNode }) {
  await requireOwner();
  return children;
}
