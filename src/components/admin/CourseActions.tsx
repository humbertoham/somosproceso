"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import type { Course } from "@/lib/utils";

export function CourseActions({ id, status, purchaseCount, showEdit = true }: { id: string; status: Course["status"]; purchaseCount: number; showEdit?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const processing = useRef(false);

  async function act(action: "publish" | "unpublish" | "archive" | "delete" | "duplicate") {
    if (processing.current) return;
    if (action === "delete" && !window.confirm("¿Eliminar permanentemente este curso? Esta acción no se puede deshacer.")) return;
    if (action === "archive" && !window.confirm("¿Archivar este curso? Dejará de mostrarse al público. Las compras y sus datos se conservarán.")) return;
    processing.current = true; setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(`/api/admin/courses/${id}${action === "duplicate" ? "/duplicate" : ""}`, {
        method: action === "delete" ? "DELETE" : action === "duplicate" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        ...(action !== "delete" && action !== "duplicate" ? { body: JSON.stringify({ action }) } : {}),
      });
      const data = await response.json() as { id?: string; error?: string; message?: string };
      if (!response.ok) throw new Error(data.error ?? "Error al guardar.");
      setMessage(data.message ?? "Cambios guardados");
      if (action === "duplicate" && data.id) router.push(`/admin/cursos/${data.id}?created=1`);
      else if (action === "delete") router.push("/admin/cursos");
      router.refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Error al guardar."); }
    finally { processing.current = false; setBusy(false); }
  }

  return <div className="course-actions">
    <div className="course-action-buttons">
      {showEdit && <Link href={`/admin/cursos/${id}`}>Editar</Link>}
      <Link href={`/admin/cursos/${id}/compradores`}>Ver compradores</Link>
      <button type="button" disabled={busy} onClick={() => act(status === "published" ? "unpublish" : "publish")}>{status === "published" ? "Despublicar" : "Publicar"}</button>
      {status !== "archived" && <button type="button" disabled={busy} onClick={() => act("archive")}>Archivar</button>}
      <button type="button" disabled={busy} onClick={() => act("duplicate")}>Duplicar curso</button>
      {purchaseCount === 0 && <button className="danger-action" type="button" disabled={busy} onClick={() => act("delete")}>Eliminar</button>}
    </div>
    {busy && <small role="status">Guardando...</small>}
    {message && <small className="form-success" role="status">{message}</small>}
    {error && <small className="form-error" role="alert">{error}</small>}
  </div>;
}
