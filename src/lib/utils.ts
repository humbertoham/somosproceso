import type { courses } from "@/db/schema";

export type Course = typeof courses.$inferSelect;

export function formatPrice(cents: number, currency = "MXN") {
  return `${new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100)} ${currency}`;
}

export function formatDate(value: Date | string | null, withTime = false) {
  if (!value) return null;
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "America/Mexico_City",
  }).format(new Date(value));
}

export function slugify(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function courseAvailability(course: Course, paidCount = 0) {
  if (course.status !== "published") return { key: "draft", label: "No publicado", purchasable: false };
  if (course.endDate && course.endDate < new Date()) return { key: "finished", label: "Finalizado", purchasable: false };
  if (!course.salesOpen) return { key: "soon", label: "Próximamente", purchasable: false };
  if (course.capacity !== null && paidCount >= course.capacity) return { key: "sold-out", label: "Agotado", purchasable: false };
  return { key: "open", label: "Inscripciones abiertas", purchasable: true };
}

export function modalityLabel(modality: Course["modality"]) {
  return { online: "En línea", in_person: "Presencial", hybrid: "Híbrido" }[modality];
}

export function csvCell(value: string | number | null | undefined) {
  const text = String(value ?? "");
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}
