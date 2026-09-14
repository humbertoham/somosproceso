import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { getDb } from "@/db";
import { purchases, stripeEvents } from "@/db/schema";
import { getStripeEnv } from "@/lib/env";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

function stripeId(value: string | { id: string } | null) { return typeof value === "string" ? value : value?.id ?? null; }
function buyerName(session: Stripe.Checkout.Session) {
  const field = session.custom_fields?.find(({ key }) => key === "buyer_name");
  return field?.text?.value ?? session.customer_details?.name ?? "Cliente";
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Firma ausente." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(await request.text(), signature, getStripeEnv().STRIPE_WEBHOOK_SECRET);
  } catch {
    return NextResponse.json({ error: "Firma inválida." }, { status: 400 });
  }

  try {
    await getDb().transaction(async (tx) => {
      const inserted = await tx.insert(stripeEvents).values({ stripeEventId: event.id, eventType: event.type, processedAt: new Date() }).onConflictDoNothing().returning({ id: stripeEvents.id });
      if (!inserted.length) return;

      if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
        const session = event.data.object;
        await tx.update(purchases).set({
          stripePaymentIntentId: stripeId(session.payment_intent),
          stripeCustomerId: stripeId(session.customer),
          buyerName: buyerName(session),
          buyerEmail: session.customer_details?.email ?? session.customer_email ?? "",
          buyerPhone: session.customer_details?.phone ?? null,
          amountCents: session.amount_total ?? undefined,
          currency: session.currency?.toUpperCase() ?? undefined,
          paymentStatus: session.payment_status === "paid" || session.payment_status === "no_payment_required" ? "paid" : "pending",
          paidAt: session.payment_status === "paid" || session.payment_status === "no_payment_required" ? new Date() : null,
          updatedAt: new Date(),
        }).where(eq(purchases.stripeCheckoutSessionId, session.id));
      } else if (event.type === "checkout.session.expired") {
        await tx.update(purchases).set({ paymentStatus: "expired", updatedAt: new Date() }).where(eq(purchases.stripeCheckoutSessionId, event.data.object.id));
      } else if (event.type === "checkout.session.async_payment_failed") {
        await tx.update(purchases).set({ paymentStatus: "failed", updatedAt: new Date() }).where(eq(purchases.stripeCheckoutSessionId, event.data.object.id));
      } else if (event.type === "payment_intent.payment_failed") {
        const intent = event.data.object;
        if (intent.metadata.purchaseId) await tx.update(purchases).set({ paymentStatus: "failed", stripePaymentIntentId: intent.id, updatedAt: new Date() }).where(eq(purchases.id, intent.metadata.purchaseId));
      } else if (event.type === "charge.refunded") {
        const paymentIntentId = stripeId(event.data.object.payment_intent);
        if (paymentIntentId) await tx.update(purchases).set({ paymentStatus: "refunded", updatedAt: new Date() }).where(eq(purchases.stripePaymentIntentId, paymentIntentId));
      }
    });
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "No fue posible procesar el evento." }, { status: 500 });
  }
}
