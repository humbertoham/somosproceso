import { Footer } from "@/components/public/Footer";
import { Header } from "@/components/public/Header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <><a className="skip-link" href="#contenido">Saltar al contenido</a><Header /><main id="contenido">{children}</main><Footer /></>;
}
