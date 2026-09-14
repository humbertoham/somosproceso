import { isAdminAuthenticated } from "@/lib/auth";
import { getPurchases } from "@/db/queries";
import { csvCell, formatDate } from "@/lib/utils";

export async function GET() {
  if (!(await isAdminAuthenticated())) return new Response("Sesión expirada.", { status: 401 });
  const rows = await getPurchases();
  const header = ["fecha", "nombre", "email", "telefono", "curso", "monto", "moneda", "estado", "correo_enviado", "fecha_envio"];
  const lines = rows.map(({ purchase, courseTitle }) => [
    formatDate(purchase.createdAt, true), purchase.buyerName, purchase.buyerEmail, purchase.buyerPhone, courseTitle,
    (purchase.amountCents / 100).toFixed(2), purchase.currency, purchase.paymentStatus, purchase.emailSent ? "sí" : "no", formatDate(purchase.emailSentAt, true),
  ].map(csvCell).join(","));
  return new Response(`\uFEFF${header.join(",")}\r\n${lines.join("\r\n")}`, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="compras-somos-proceso-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}
