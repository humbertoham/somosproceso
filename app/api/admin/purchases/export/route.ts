import { isAdminAuthenticated } from "@/lib/auth";
import { getPurchases } from "@/db/queries";
import { csvCell, formatDate } from "@/lib/utils";
import { paymentLabels } from "@/lib/purchases";
import { parsePurchaseFilters, purchaseQueryFilters } from "@/lib/validations/purchase-filters";

export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) return new Response("Sesión expirada.", { status: 401 });
  const filters = parsePurchaseFilters(Object.fromEntries(new URL(request.url).searchParams));
  const rows = await getPurchases(purchaseQueryFilters(filters));
  const header = ["Fecha", "Nombre", "Correo", "Teléfono", "Curso", "Monto", "Moneda", "Estado de pago", "Correo enviado", "Fecha de envío"];
  const lines = rows.map(({ purchase, course }) => [
    formatDate(purchase.createdAt, true, course.timezone), purchase.buyerName, purchase.buyerEmail, purchase.buyerPhone, course.title,
    (purchase.amountCents / 100).toFixed(2), purchase.currency, paymentLabels[purchase.paymentStatus], purchase.emailSent ? "Sí" : "No", formatDate(purchase.emailSentAt, true, course.timezone),
  ].map(csvCell).join(","));
  return new Response(`\uFEFF${header.join(",")}\r\n${lines.join("\r\n")}`, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="compras-somos-proceso-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}
