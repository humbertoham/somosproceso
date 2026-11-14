import { and, eq, inArray, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { z } from "zod";

import { getDb } from "@/db";
import { courses, purchases, stripeEvents } from "@/db/schema";
import { getStripeWebhookEnv, hasStripe } from "@/lib/env";
import { revalidateCourses } from "@/lib/revalidate";
import { getStripe } from "@/lib/stripe";
import { databaseErrorCode } from "@/lib/admin-api";

export const runtime = "nodejs";

function stripeId(value: string | { id: string } | null) { return typeof value === "string" ? value : value?.id ?? null; }
function buyerName(session: Stripe.Checkout.Session) {
  const field = session.custom_fields?.find(({ key }) => key === "buyer_name");
  return field?.text?.value ?? session.customer_details?.name ?? "Cliente";
}

export async function POST(request: Request) {
  if (!hasStripe()) return NextResponse.json({ error: "Stripe todavía no está configurado." }, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Firma ausente." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, getStripeWebhookEnv().STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Firma inválida." }, { status: 400 });
  }

  try {
    await getDb().transaction(async (tx) => {
      const inserted = await tx.insert(stripeEvents).values({ stripeEventId: event.id, eventType: event.type, processedAt: new Date() }).onConflictDoNothing().returning({ id: stripeEvents.id });
      if (!inserted.length) return;

      if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
        const session = event.data.object;
        if (session.mode !== "payment") return;
        const [existing] = await tx.select().from(purchases).where(eq(purchases.stripeCheckoutSessionId, session.id)).limit(1);
        const courseId = existing?.courseId ?? session.metadata?.courseId;
        if (!courseId || !z.uuid().safeParse(courseId).success) return;
        const [course] = await tx.select({ id: courses.id }).from(courses).where(eq(courses.id, courseId)).limit(1);
        if (!course) throw new Error("Curso del pago no encontrado.");
        if (session.amount_total === null || !session.currency) throw new Error("Pago sin monto o moneda.");
        const paid = session.payment_status === "paid" || session.payment_status === "no_payment_required";
        const paidAt = paid ? new Date(event.created * 1000) : null;
        const values = {
          courseId, stripeCheckoutSessionId: session.id,
          stripePaymentIntentId: stripeId(session.payment_intent), stripeCustomerId: stripeId(session.customer),
          buyerName: buyerName(session), buyerEmail: session.customer_details?.email ?? session.customer_email ?? "",
          buyerPhone: session.customer_details?.phone ?? null,
          amountCents: session.amount_total, currency: session.currency.toUpperCase(),
          paymentStatus: paid ? "paid" as const : "pending" as const,
          paidAt, source: "stripe", updatedAt: new Date(),
        };
        // El evento puede llegar antes de que checkout inserte la compra pendiente.
        // Un evento tardío nunca debe revertir un pago o reembolso confirmado.
        await tx.insert(purchases).values({
          ...values, id: existing?.id ?? (z.uuid().safeParse(session.metadata?.purchaseId).success ? session.metadata!.purchaseId : crypto.randomUUID()),
        }).onConflictDoUpdate({ target: purchases.stripeCheckoutSessionId, set: {
          ...values,
          paymentStatus: sql`case when ${purchases.paymentStatus} = 'refunded' then 'refunded'::payment_status when ${purchases.paymentStatus} = 'paid' then 'paid'::payment_status else ${values.paymentStatus}::payment_status end`,
          paidAt: paidAt ? sql`coalesce(${purchases.paidAt}, ${paidAt.toISOString()}::timestamptz)` : purchases.paidAt,
        } });
      } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
        await tx.update(purchases).set({ paymentStatus: event.type === "checkout.session.expired" ? "expired" : "failed", updatedAt: new Date() })
          .where(and(eq(purchases.stripeCheckoutSessionId, event.data.object.id), inArray(purchases.paymentStatus, ["pending", "failed"])));
      } else if (event.type === "payment_intent.payment_failed") {
        const intent = event.data.object;
        const purchaseId = z.uuid().safeParse(intent.metadata.purchaseId);
        await tx.update(purchases).set({ paymentStatus: "failed", stripePaymentIntentId: intent.id, updatedAt: new Date() })
          .where(and(or(eq(purchases.stripePaymentIntentId, intent.id), purchaseId.success ? eq(purchases.id, purchaseId.data) : undefined), inArray(purchases.paymentStatus, ["pending", "failed"])));
      } else if (event.type === "charge.refunded") {
        const charge = event.data.object;
        const paymentIntentId = stripeId(charge.payment_intent);
        if (paymentIntentId && charge.refunded) await tx.update(purchases).set({ paymentStatus: "refunded", updatedAt: new Date() }).where(eq(purchases.stripePaymentIntentId, paymentIntentId));
      }
    });
    revalidateCourses();
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("No se pudo procesar un webhook de Stripe.", { code: databaseErrorCode(error) ?? "unknown", type: event.type });
    return NextResponse.json({ error: "No fue posible procesar el evento." }, { status: 500 });
  }
}
