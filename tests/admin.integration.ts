import "../src/db/load-env";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";
import { eq, inArray } from "drizzle-orm";
import Stripe from "stripe";

import { closeDb, getDb } from "../src/db";
import { courses, purchases, stripeEvents } from "../src/db/schema";
import { formatPrice } from "../src/lib/utils";

async function main() {
  if (process.env.RUN_DATABASE_TESTS !== "1" || process.env.NODE_ENV === "production") throw new Error("Estas pruebas requieren RUN_DATABASE_TESTS=1 y un entorno de desarrollo con Neon. Crea datos temporales y los limpia al terminar.");
  const port = 40000 + Math.floor(Math.random() * 10000);
  const base = `http://127.0.0.1:${port}`;
  const username = randomUUID(); const password = randomUUID();
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
    env: { ...process.env, NODE_ENV: "production", ADMIN_USER: username, ADMIN_PASSWORD: password, ADMIN_SESSION_SECRET: randomUUID(), STRIPE_SECRET_KEY: "", STRIPE_WEBHOOK_SECRET: "", NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "" },
    stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  let logs = "";
  server.stdout.on("data", (data) => { logs = (logs + String(data)).slice(-4000); });
  server.stderr.on("data", (data) => { logs = (logs + String(data)).slice(-4000); });
  let cookie = "";
  const ids: string[] = [];
  const eventIds: string[] = [];
  const request = (path: string, method = "GET", body?: unknown, authenticated = true) => fetch(`${base}${path}`, {
    method, redirect: "manual", headers: { Origin: base, ...(body ? { "Content-Type": "application/json" } : {}), ...(authenticated ? { Cookie: cookie } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      try { if ((await request("/admin/login")).status === 200) { ready = true; break; } } catch { /* Esperar al servidor local. */ }
      if (server.exitCode !== null) throw new Error("El servidor de prueba terminó antes de iniciar.");
      await setTimeout(200);
    }
    assert.equal(ready, true, "El servidor debe iniciar.");
    assert.equal((await request("/admin/cursos", "GET", undefined, false)).status, 307);
    for (const [path, method] of [["/api/admin/courses", "POST"], ["/api/admin/upload", "POST"], ["/api/admin/purchases/export", "GET"], [`/api/admin/purchases/${randomUUID()}`, "PATCH"]]) {
      assert.equal((await request(path, method, undefined, false)).status, 401);
    }
    const checkout = await request("/api/checkout", "POST", { courseId: randomUUID(), termsAccepted: true });
    assert.equal(checkout.status, 200);
    assert.equal((await checkout.json()).message, "Los pagos en línea estarán disponibles próximamente.");
    assert.equal((await request("/api/stripe/webhook", "POST", {})).status, 503);
    const crossOrigin = await fetch(`${base}/api/admin/login`, { method: "POST", headers: { Origin: "https://otro.example", "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
    assert.equal(crossOrigin.status, 403);
    const login = await request("/api/admin/login", "POST", { username, password });
    assert.equal(login.status, 200);
    cookie = login.headers.get("set-cookie")!.split(";")[0];

    const payload = { title: "Prueba temporal Somos Proceso", slug: `qa-${randomUUID()}`, shortDescription: "Curso temporal de verificación.", description: "Descripción para verificar la persistencia.", price: "1200", currency: "MXN", status: "draft", modality: "online", startDate: "2077-11-21T16:00:00.000Z", timeText: "10:00 a 13:00 h", timezone: "America/Monterrey", capacity: 20, salesOpen: true };
    const created = await request("/api/admin/courses", "POST", payload);
    assert.equal(created.status, 201);
    const { id } = await created.json() as { id: string }; ids.push(id);
    assert.ok((await (await request(`/cursos/${payload.slug}`)).text()).includes("Este camino no está disponible."));
    assert.equal((await request("/api/admin/courses", "POST", payload)).status, 409);
    assert.equal((await request(`/api/admin/courses/${id}`, "PATCH", { action: "publish" })).status, 200);
    assert.equal((await request(`/cursos/${payload.slug}`)).status, 200);
    const edited = { ...payload, status: "published", description: "Descripción modificada y persistida.", price: "1300.29" };
    assert.equal((await request(`/api/admin/courses/${id}`, "PATCH", edited)).status, 200);
    const [stored] = await getDb().select().from(courses).where(eq(courses.id, id));
    assert.equal(stored.priceCents, 130029); assert.equal(stored.description, edited.description);
    assert.equal(stored.startDate?.toISOString(), payload.startDate);
    for (const patch of [{ price: "-1" }, { capacity: 0 }, { slug: "" }, { title: "" }]) assert.equal((await request(`/api/admin/courses/${id}`, "PATCH", { ...edited, ...patch })).status, 400);
    assert.equal((await request(`/api/admin/courses/${randomUUID()}`, "PATCH", edited)).status, 404);

    const invalidImage = new FormData(); invalidImage.set("file", new File(["<script>no es una imagen</script>"], "falsa.png", { type: "image/png" }));
    assert.equal((await fetch(`${base}/api/admin/upload`, { method: "POST", headers: { Cookie: cookie }, body: invalidImage })).status, 400);

    const buyerIds = Array.from({ length: 18 }, () => randomUUID());
    await getDb().insert(purchases).values(buyerIds.map((purchaseId, index) => ({
      id: purchaseId, courseId: id, buyerName: index === 0 ? "Ana Martínez" : index === 14 ? "Fernanda Ruiz" : "Carlos López",
      buyerEmail: index === 0 ? "ana+qa@example.com" : index === 14 ? "fernanda+qa@example.com" : `carlos-${index}+qa@example.com`,
      buyerPhone: index === 0 ? "+52 81 1234 5678" : null, amountCents: 130029, currency: "MXN",
      paymentStatus: index < 14 ? "paid" as const : (["pending", "failed", "expired", "refunded"] as const)[index - 14],
      source: "manual", internalReference: "QA-TEMPORAL", paidAt: index < 14 ? new Date() : null,
    })));
    const buyers = await (await request(`/admin/cursos/${id}/compradores`)).text();
    assert.match(buyers, /<strong>14<\/strong>/); assert.match(buyers, /<strong>6<\/strong>/);
    assert.ok(buyers.includes(formatPrice(14 * 130029)));
    assert.ok(buyers.includes("Ana Martínez")); assert.ok(buyers.includes("Enviar correo"));
    const gmail = buyers.match(/href="(https:\/\/mail\.google\.com[^\"]+)"/);
    assert.ok(gmail);
    assert.ok(new URL(gmail[1].replaceAll("&amp;", "&")).searchParams.get("body")?.includes(edited.title));
    const phoneSearch = await (await request("/admin/compras?q=1234%205678")).text();
    assert.ok(phoneSearch.includes("ana+qa@example.com")); assert.equal(phoneSearch.includes("fernanda+qa@example.com"), false);
    const pending = await (await request(`/admin/compras?course=${id}&status=pending`)).text();
    assert.ok(pending.includes("fernanda+qa@example.com")); assert.equal(pending.includes("ana+qa@example.com"), false);

    assert.equal((await request(`/api/admin/purchases/${buyerIds[0]}`, "PATCH", { emailSent: true })).status, 200);
    let [buyer] = await getDb().select().from(purchases).where(eq(purchases.id, buyerIds[0]));
    assert.equal(buyer.emailSent, true); assert.ok(buyer.emailSentAt);
    assert.equal((await request(`/api/admin/purchases/${buyerIds[0]}`, "PATCH", { emailSent: false, adminNotes: "Contactar por WhatsApp" })).status, 200);
    [buyer] = await getDb().select().from(purchases).where(eq(purchases.id, buyerIds[0]));
    assert.equal(buyer.emailSentAt, null); assert.equal(buyer.adminNotes, "Contactar por WhatsApp");
    assert.equal((await request(`/api/admin/purchases/${buyerIds[14]}`, "PATCH", { paymentStatus: "paid" })).status, 400);
    assert.equal((await request(`/api/admin/purchases/${randomUUID()}`, "PATCH", { emailSent: true })).status, 404);
    const csv = await request(`/api/admin/purchases/export?course=${id}&status=paid`);
    const bytes = new Uint8Array(await csv.arrayBuffer());
    assert.deepEqual([...bytes.slice(0, 3)], [239, 187, 191]);
    const csvText = new TextDecoder().decode(bytes);
    assert.ok(csvText.includes("Teléfono")); assert.ok(csvText.includes("Ana Martínez")); assert.equal(csvText.includes("Fernanda Ruiz"), false);

    const duplicate = await request(`/api/admin/courses/${id}/duplicate`, "POST"); assert.equal(duplicate.status, 201);
    const duplicateId = (await duplicate.json()).id as string; ids.push(duplicateId);
    const [copy] = await getDb().select().from(courses).where(eq(courses.id, duplicateId));
    assert.equal(copy.status, "draft"); assert.equal(copy.startDate, null); assert.equal(copy.priceCents, 130029); assert.notEqual(copy.slug, stored.slug);
    assert.equal((await getDb().select().from(purchases).where(eq(purchases.courseId, duplicateId))).length, 0);
    assert.equal((await request(`/api/admin/courses/${duplicateId}`, "DELETE")).status, 200);
    assert.equal((await request(`/api/admin/courses/${id}`, "DELETE")).status, 409);
    await getDb().insert(purchases).values(Array.from({ length: 6 }, () => ({ courseId: id, buyerName: "QA adicional", buyerEmail: "adicional+qa@example.com", amountCents: 130029, currency: "MXN", paymentStatus: "paid" as const, source: "manual" })));
    assert.ok((await (await request(`/admin/cursos/${id}/compradores`)).text()).includes("Agotado"));
    assert.equal((await request(`/api/admin/courses/${id}`, "PATCH", { action: "archive" })).status, 200);
    assert.ok((await (await request(`/cursos/${payload.slug}`)).text()).includes("Este camino no está disponible."));
    assert.equal((await getDb().select().from(purchases).where(eq(purchases.courseId, id))).length, 24);
    const webhookSecret = `whsec_${randomUUID()}`;
    const webhookPort = port + 1;
    const webhookBase = `http://127.0.0.1:${webhookPort}`;
    const webhookServer = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", String(webhookPort)], {
      env: { ...process.env, NODE_ENV: "production", STRIPE_SECRET_KEY: "sk_test_solo_firmas_locales", STRIPE_WEBHOOK_SECRET: webhookSecret },
      stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
    });
    webhookServer.stdout.on("data", (data) => { logs = (logs + String(data)).slice(-4000); });
    webhookServer.stderr.on("data", (data) => { logs = (logs + String(data)).slice(-4000); });
    try {
      for (let attempt = 0; attempt < 100; attempt++) {
        try { if ((await fetch(`${webhookBase}/api/stripe/webhook`)).status === 405) break; } catch { /* Esperar al segundo servidor local. */ }
        await setTimeout(100);
      }
      const stripe = new Stripe("sk_test_solo_firmas_locales");
      const sessionId = `cs_test_qa_${randomUUID()}`;
      const paymentIntent = `pi_qa_${randomUUID()}`;
      const paidPurchaseId = randomUUID();
      const signed = (type: string, object: unknown, eventId = `evt_qa_${randomUUID()}`) => {
        eventIds.push(eventId);
        const body = JSON.stringify({ id: eventId, object: "event", type, created: Math.floor(Date.now() / 1000), data: { object } });
        return fetch(`${webhookBase}/api/stripe/webhook`, { method: "POST", headers: { "stripe-signature": stripe.webhooks.generateTestHeaderString({ payload: body, secret: webhookSecret }), "Content-Type": "application/json" }, body });
      };
      const session = { id: sessionId, object: "checkout.session", mode: "payment", metadata: { courseId: id, courseSlug: payload.slug, purchaseId: paidPurchaseId }, payment_status: "paid", amount_total: 130029, currency: "mxn", payment_intent: paymentIntent, customer: null, customer_details: { name: "Ana QA Stripe", email: "webhook+qa@example.com", phone: null }, custom_fields: [] };
      const eventId = `evt_qa_${randomUUID()}`;
      assert.equal((await signed("checkout.session.completed", session, eventId)).status, 200);
      assert.equal((await signed("checkout.session.completed", session, eventId)).status, 200);
      const [confirmed] = await getDb().select().from(purchases).where(eq(purchases.id, paidPurchaseId));
      assert.equal(confirmed.paymentStatus, "paid"); assert.equal(confirmed.source, "stripe"); assert.equal(confirmed.buyerEmail, "webhook+qa@example.com");
      assert.equal((await getDb().select().from(purchases).where(eq(purchases.stripeCheckoutSessionId, sessionId))).length, 1);
      assert.equal((await signed("checkout.session.expired", { id: sessionId })).status, 200);
      assert.equal((await getDb().select().from(purchases).where(eq(purchases.id, paidPurchaseId)))[0].paymentStatus, "paid");
      assert.equal((await signed("charge.refunded", { payment_intent: paymentIntent, refunded: true })).status, 200);
      assert.equal((await signed("checkout.session.completed", session)).status, 200);
      assert.equal((await getDb().select().from(purchases).where(eq(purchases.id, paidPurchaseId)))[0].paymentStatus, "refunded");
      assert.equal((await fetch(`${webhookBase}/api/stripe/webhook`, { method: "POST", headers: { "stripe-signature": "invalida" }, body: "{}" })).status, 400);
      console.log("Webhook firmado local: compra sin registro pendiente, idempotencia, expiración tardía, reembolso y rechazo de firma inválida: OK. Sin llamadas a Stripe.");
    } finally { webhookServer.kill(); }
    console.log("Integración Neon/HTTP: autenticación, cursos, compradores, filtros, Gmail, correo, notas, CSV, cupo y Stripe vacío: OK.");
  } catch (error) {
    console.error(logs);
    throw error;
  } finally {
    server.kill();
    try {
      if (ids.length) await getDb().transaction(async (tx) => {
        if (eventIds.length) await tx.delete(stripeEvents).where(inArray(stripeEvents.stripeEventId, eventIds));
        await tx.delete(purchases).where(inArray(purchases.courseId, ids));
        await tx.delete(courses).where(inArray(courses.id, ids));
      });
    } finally { await closeDb(); }
  }
}

main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
