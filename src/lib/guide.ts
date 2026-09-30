// The getting-started checklist on Bugün. Every step is read from real data
// except the Instagram bio link, which only the trainer can confirm.

export type GuideFacts = {
  pagePublished: boolean;
  bookingEnabled: boolean;
  templates: number;
  availabilityRules: number;
  intakeFields: number;
  activeClients: number;
  lessons: number;
  bioLinkAdded: boolean;
  /** Devices where the trainer turned on notifications. */
  pushDevices: number;
};

export type GuideStepId = "profile" | "package" | "availability" | "intake" | "client" | "lesson" | "bio" | "app";

export type GuideStep = {
  id: GuideStepId;
  done: boolean;
  /** Optional steps are shown but don't count towards progress. */
  optional: boolean;
};

export type Guide = {
  steps: GuideStep[];
  done: number;
  total: number;
  complete: boolean;
};

export function buildGuide(f: GuideFacts): Guide {
  const steps: GuideStep[] = [
    { id: "profile", done: f.pagePublished, optional: false },
    { id: "package", done: f.templates > 0, optional: false },
    // Working hours only matter once clients can book from their page.
    { id: "availability", done: f.availabilityRules > 0, optional: !f.bookingEnabled },
    // Default questions are seeded when the page goes live, so this is done as
    // soon as the form exists; the step points trainers at it to review.
    { id: "intake", done: f.intakeFields > 0, optional: false },
    { id: "client", done: f.activeClients > 0, optional: false },
    { id: "lesson", done: f.lessons > 0, optional: false },
    { id: "bio", done: f.bioLinkAdded, optional: false },
    // Done once notifications reach at least one device (on iPhone that means the home-screen app).
    { id: "app", done: f.pushDevices > 0, optional: false },
  ];
  const counted = steps.filter((s) => !s.optional);
  const done = counted.filter((s) => s.done).length;
  return { steps, done, total: counted.length, complete: done === counted.length };
}

/** What Bugün shows: the checklist, a one-off congratulation, or nothing. */
export function guideMode(guide: Guide, dismissed: boolean): "checklist" | "congrats" | "hidden" {
  if (dismissed) return "hidden";
  return guide.complete ? "congrats" : "checklist";
}
