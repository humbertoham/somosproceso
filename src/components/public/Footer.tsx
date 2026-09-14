import { Instagram } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div><Logo light /><p>Desarrollo humano, psicoeducación y espacios seguros para crecer.</p></div>
        <div className="footer-links">
          <div><strong>Explora</strong><Link href="/cursos">Cursos</Link><Link href="/nosotros">Nosotros</Link><Link href="/faq">Preguntas frecuentes</Link></div>
          <div><strong>Información</strong><Link href="/aviso-de-privacidad">Aviso de privacidad</Link><Link href="/terminos">Términos y condiciones</Link><a href="https://www.instagram.com/somoprocesomx/" target="_blank" rel="noreferrer"><Instagram size={16} /> Instagram</a></div>
        </div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Somos Proceso</span><span>Crecer también es un proceso.</span></div>
    </footer>
  );
}
