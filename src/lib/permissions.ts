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
    key: "editPrograms",
    title: "Program şablonlarını ve hareketleri düzenleyebilsin",
    hint: "Kapalıysa şablonları sadece kullanır, danışana kopyasını verir.",
    default: true,
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
