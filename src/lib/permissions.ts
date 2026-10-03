// What an instructor in a studio may do, decided per instructor by the owner
// (Ayarlar → Ekip → eğitmen). Stored on account_members.permissions; a
// missing key means the default below. The owner can always do everything.

export const PERMISSIONS = [
  {
    key: "seeAllClients",
    title: "Bütün danışanları görebilsin",
    hint: "Kapalıysa sadece ders verdiği danışanları görür.",
    default: true,
  },
  {
    key: "editClients",
    title: "Danışan ekleyip bilgilerini düzenleyebilsin",
    hint: "Ad, telefon, hedef ve sağlık notu dahil.",
    default: false,
  },
  {
    key: "manageLessons",
    title: "Kendi derslerini planlayıp değiştirebilsin",
    hint: "Kapalıysa dersleri sen planlarsın; o sadece yoklama alır.",
    default: true,
  },
  {
    key: "editAvailability",
    title: "Kendi çalışma saatlerini ve izinlerini düzenleyebilsin",
    hint: "Danışanların randevu alabildiği saatler.",
    default: false,
  },
  {
    key: "createPrograms",
    title: "Kendi program şablonlarını ve hareketlerini oluşturabilsin",
    hint: "Kendi hazırladıklarını düzenleyip silebilir.",
    default: true,
  },
  {
    key: "editAllPrograms",
    title: "Başkalarının şablonlarını ve hareketlerini düzenleyip silebilsin",
    hint: "Senin ve diğer eğitmenlerin hazırladıkları dahil. Kapalıysa onları sadece kullanır, danışana kopyasını verir.",
    default: false,
  },
  {
    key: "seeOthersLessons",
    title: "Diğer eğitmenlerin derslerini görebilsin",
    hint: "Kapalıysa takvimde sadece kendi derslerini görür.",
    default: true,
  },
] as const;

export type Permission = (typeof PERMISSIONS)[number]["key"];
export type Permissions = Partial<Record<Permission, boolean>>;

export const isPermission = (k: unknown): k is Permission => PERMISSIONS.some((p) => p.key === k);

/** Whether a member may do something: owners always; instructors per their settings or the default. */
export function can(member: { role: "owner" | "instructor"; permissions?: Permissions | null }, key: Permission) {
  if (member.role === "owner") return true;
  return member.permissions?.[key] ?? PERMISSIONS.find((p) => p.key === key)!.default;
}

/**
 * A shared template or exercise: the owner changes any; an instructor their
 * own (with permission to create) or anyone's (with permission to edit all).
 * `createdBy` null means the owner's or the starter list.
 */
export function mayEditShared(member: { id: string; role: "owner" | "instructor"; permissions?: Permissions | null }, createdBy: string | null) {
  if (member.role === "owner") return true;
  if (createdBy === member.id) return can(member, "createPrograms");
  return can(member, "editAllPrograms");
}
