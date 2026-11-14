import type { Course } from "@/lib/utils";
import { formatDate, modalityLabel } from "@/lib/utils";

export type PurchaseCourse = Pick<Course, "id" | "title" | "timeText" | "timezone" | "modality" | "durationText"> & { startDate: string | null };
export type PurchaseRow = {
  id: string; createdAt: string; buyerName: string; buyerEmail: string; buyerPhone: string | null; course: PurchaseCourse;
  amountCents: number; currency: string; paymentStatus: "pending" | "paid" | "failed" | "expired" | "refunded";
  emailSent: boolean; emailSentAt: string | null; adminNotes: string | null;
};

export function gmailComposeUrl(buyer: Pick<PurchaseRow, "buyerName" | "buyerEmail" | "course">) {
  const { course } = buyer;
  const subject = `Información de tu curso — ${course.title} | Somos Proceso`;
  const body = [
    `Hola ${buyer.buyerName || ""},`, "", "Gracias por ser parte de Somos Proceso 🤍", "",
    "Te compartimos la información de tu curso:", "", course.title, "",
    ...(course.startDate ? ["Fecha:", formatDate(course.startDate, false, course.timezone)!, ""] : []),
    ...(course.timeText ? ["Horario:", course.timeText, `Zona horaria: ${course.timezone}`, ""] : []),
    "Modalidad:", modalityLabel(course.modality), "",
    ...(course.durationText ? ["Duración:", course.durationText, ""] : []),
    "[Agrega aquí la liga de acceso o información adicional antes de enviar.]", "",
    "Nos vemos pronto.", "", "Somos Proceso", "https://www.instagram.com/somoprocesomx/",
  ].join("\n");
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(buyer.buyerEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function whatsappUrl(phone: string | null) {
  if (!phone) return null;
  const normalized = phone.trim().replace(/[\s().-]/g, "");
  const international = normalized.startsWith("00") ? `+${normalized.slice(2)}` : normalized;
  if (!/^\+[1-9]\d{7,14}$/.test(international)) return null;
  return `https://wa.me/${international.slice(1)}`;
}

export const paymentLabels = { pending: "Pendiente", paid: "Pagado", failed: "Fallido", expired: "Expirado", refunded: "Reembolsado" };
