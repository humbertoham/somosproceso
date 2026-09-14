"use client";

import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter(); const search = useSearchParams();
  const [show, setShow] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username: form.get("username"), password: form.get("password") }) });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Credenciales incorrectas");
      const next = search.get("next");
      router.replace(next?.startsWith("/admin") ? next : "/admin"); router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Credenciales incorrectas"); setLoading(false); }
  }
  return <form className="login-form" onSubmit={submit}><div><label htmlFor="username">Usuario</label><input id="username" name="username" autoComplete="username" required autoFocus /></div><div><label htmlFor="password">Contraseña</label><div className="password-field"><input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required /><button type="button" onClick={() => setShow(!show)} aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}>{show ? <EyeOff /> : <Eye />}</button></div></div>{error && <p className="form-error" role="alert">{error}</p>}<button className="admin-button" type="submit" disabled={loading}>{loading && <LoaderCircle className="spin" />} {loading ? "Entrando…" : "Iniciar sesión"}</button></form>;
}
