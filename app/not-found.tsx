import { SearchX } from "lucide-react";

import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return <main className="result-page"><div className="result-card compact"><SearchX className="result-icon muted-icon" /><p className="eyebrow">Página no encontrada</p><h1>Este camino no está disponible.</h1><p>Es posible que el curso ya no esté publicado o que la dirección sea incorrecta.</p><Button href="/cursos">Explorar cursos</Button></div></main>;
}
