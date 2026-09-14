"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="result-page"><div className="result-card compact"><p className="eyebrow">Algo salió mal</p><h1>No pudimos mostrar esta página.</h1><p>Inténtalo nuevamente. Si el problema continúa, vuelve más tarde.</p><button className="button button-primary" type="button" onClick={reset}><RotateCcw size={17} />Intentar de nuevo</button></div></main>;
}
