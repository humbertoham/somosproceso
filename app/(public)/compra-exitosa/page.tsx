import { CheckCircle2, Mail, Sparkles } from "lucide-react";
import type { Metadata } from "next";

import { Button } from "@/components/ui/Button";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Compra recibida", robots: { index: false, follow: false } };

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const { session_id: sessionId } = await searchParams;
  let email: string | null = null;
  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try { email = (await getStripe().checkout.sessions.retrieve(sessionId)).customer_details?.email ?? null; } catch { /* El webhook sigue siendo la fuente de verdad. */ }
  }
  return <div className="result-page"><div className="result-card"><CheckCircle2 className="result-icon" /><p className="eyebrow">Compra recibida</p><h1>Gracias por ser parte de este proceso.</h1><p>Stripe está procesando la confirmación de tu pago. Cuando quede confirmado, prepararemos manualmente la información de tu curso.</p><div className="next-steps"><span><Mail /><span><strong>Revisa tu correo</strong>{email ? <>Enviaremos los detalles a {email}.</> : <>Usaremos el correo que proporcionaste al pagar.</>}</span></span><span><Sparkles /><span><strong>También mira en spam</strong>La información puede llegar a promociones o correo no deseado.</span></span></div><p className="small-note">Esta página no confirma por sí sola el estado del pago. La confirmación segura se procesa directamente con Stripe.</p><Button href="/cursos">Volver a los cursos</Button></div></div>;
}
