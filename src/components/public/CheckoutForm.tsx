"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/Button";

export function CheckoutForm({ courseId, disabled }: { courseId: string; disabled?: boolean }) {
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    setError(""); setLoading(true);
    try {
      const response = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ courseId, termsAccepted: accepted }) });
      const data = await response.json() as { url?: string; error?: string };
      if (!response.ok || !data.url) throw new Error(data.error ?? "No pudimos iniciar el pago.");
      window.location.assign(data.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos iniciar el pago."); setLoading(false);
    }
  }

  return <div className="checkout-form">
    <label className="terms-check"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} />
      <span>Acepto los <Link href="/terminos" target="_blank">términos y condiciones</Link> y el <Link href="/aviso-de-privacidad" target="_blank">aviso de privacidad</Link>.</span>
    </label>
    <Button type="button" disabled={disabled || !accepted || loading} onClick={checkout}>{loading ? "Abriendo pago…" : "Comprar curso"}<span aria-hidden="true">↗</span></Button>
    {error && <p className="form-error" role="alert">{error}</p>}
  </div>;
}
