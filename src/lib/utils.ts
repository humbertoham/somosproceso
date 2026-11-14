import type { courses } from "@/db/schema";
import { DEFAULT_TIMEZONE } from "@/lib/dates";

export type Course = typeof courses.$inferSelect;

export function formatPrice(cents: number, currency = "MXN") {
  return `${new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100)} ${currency}`;
}

export function formatDate(value: Date | string | null, withTime = false, timezone = DEFAULT_TIMEZONE) {
  if (!value) return null;
  const parts = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit", hourCycle: "h23" as const } : {}),
    timeZone: timezone,
  }).formatToParts(new Date(value));
  const part = (type: string) => parts.find((item) => item.type === type)?.value;
  // Los literales de Intl difieren entre Node y algunos navegadores; mantenemos un texto estable al hidratar.
  return `${part("day")} de ${part("month")} de ${part("year")}${withTime ? `, ${part("hour")}:${part("minute")}` : ""}`;
}

export function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function remainingSeats(capacity: number | null, paidCount: number) {
  return capacity === null ? null : Math.max(0, capacity - paidCount);
}

export function courseAvailability(course: Pick<Course, "status" | "startDate" | "salesOpen" | "capacity">, paidCount = 0, now = new Date()) {
  if (course.status !== "published") return { key: "draft", label: "No publicado", purchasable: false };
  if (course.startDate && new Date(course.startDate) <= now) return { key: "finished", label: "Finalizado", purchasable: false };
  if (course.capacity !== null && paidCount >= course.capacity) return { key: "sold-out", label: "Agotado", purchasable: false };
  if (!course.salesOpen) return { key: "closed", label: "Inscripciones cerradas", purchasable: false };
  if (!course.startDate) return { key: "soon", label: "Próximamente", purchasable: false };
  return { key: "open", label: "Inscripciones abiertas", purchasable: true };
}

export function modalityLabel(modality: Course["modality"]) {
  return { online: "En línea", in_person: "Presencial", hybrid: "Híbrido" }[modality];
}

export function csvCell(value: string | number | null | undefined) {
  const text = String(value ?? "");
  const safe = /^[\s\u0000-\u001f]*[=+\-@]/.test(text) || /^[\t\r\n]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
