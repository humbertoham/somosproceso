import type { getPurchases } from "@/db/queries";
import type { PurchaseRow } from "@/lib/purchases";

export function purchaseRows(items: Awaited<ReturnType<typeof getPurchases>>): PurchaseRow[] {
  return items.map(({ purchase, course }) => ({
    id: purchase.id, createdAt: purchase.createdAt.toISOString(), buyerName: purchase.buyerName,
    buyerEmail: purchase.buyerEmail, buyerPhone: purchase.buyerPhone,
    course: { id: course.id, title: course.title, startDate: course.startDate?.toISOString() ?? null,
      timeText: course.timeText, timezone: course.timezone, modality: course.modality, durationText: course.durationText },
    amountCents: purchase.amountCents, currency: purchase.currency, paymentStatus: purchase.paymentStatus,
    emailSent: purchase.emailSent, emailSentAt: purchase.emailSentAt?.toISOString() ?? null, adminNotes: purchase.adminNotes,
  }));
}
