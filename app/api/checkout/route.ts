import { and, count, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { getDb } from "@/db";
import { courses, purchases } from "@/db/schema";
import { getSiteUrl } from "@/lib/env";
import { getStripe } from "@/lib/stripe";
import { courseAvailability } from "@/lib/utils";
import { checkoutSchema } from "@/lib/validations/checkout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const input = checkoutSchema.parse(await request.json());
    const db = getDb();
    const [[course], [sales]] = await Promise.all([
      db.select().from(courses).where(eq(courses.id, input.courseId)).limit(1),
      db.select({ value: count() }).from(purchases).where(and(eq(purchases.courseId, input.courseId), eq(purchases.paymentStatus, "paid"))),
    ]);
    if (!course || !courseAvailability(course, sales.value).purchasable) {
      return NextResponse.json({ error: "Este curso no está disponible para compra." }, { status: 409 });
    }

    const purchaseId = crypto.randomUUID();
    const siteUrl = getSiteUrl();
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_creation: "always",
      phone_number_collection: { enabled: true },
      custom_fields: [{ key: "buyer_name", label: { type: "custom", custom: "Nombre completo" }, type: "text", text: { minimum_length: 2, maximum_length: 120 } }],
      line_items: [{
        quantity: 1,
        price_data: {
          currency: course.currency.toLowerCase(),
          unit_amount: course.priceCents,
          product_data: { name: course.title, description: course.shortDescription, ...(course.imageUrl ? { images: [course.imageUrl] } : {}) },
        },
      }],
      metadata: { courseId: course.id, courseSlug: course.slug, purchaseId },
      payment_intent_data: { metadata: { courseId: course.id, courseSlug: course.slug, purchaseId } },
      success_url: `${siteUrl}/compra-exitosa?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/compra-cancelada?course=${encodeURIComponent(course.slug)}`,
    });

    try {
      await db.insert(purchases).values({
        id: purchaseId,
        courseId: course.id,
        stripeCheckoutSessionId: session.id,
        buyerName: "",
        buyerEmail: "",
        amountCents: course.priceCents,
        currency: course.currency,
        paymentStatus: "pending",
        termsAcceptedAt: new Date(),
      });
    } catch (error) {
      await stripe.checkout.sessions.expire(session.id).catch(() => undefined);
      throw error;
    }
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error && error.name === "ZodError" ? "Revisa la aceptación de términos." : "No pudimos iniciar el pago. Inténtalo nuevamente.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
