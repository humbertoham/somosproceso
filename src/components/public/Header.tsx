"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Logo } from "@/components/ui/Logo";

const links = [{ href: "/cursos", label: "Cursos" }, { href: "/nosotros", label: "Nosotros" }, { href: "/faq", label: "FAQ" }];

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <header className="site-header">
      <Logo />
      <button className="menu-button" type="button" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Cerrar menú" : "Abrir menú"} onClick={() => setOpen(!open)}>
        {open ? <X /> : <Menu />}
      </button>
      <nav id="mobile-menu" className={open ? "nav-open" : ""} aria-label="Navegación principal">
        {links.map((link) => <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} onClick={() => setOpen(false)}>{link.label}</Link>)}
        <Link className="header-cta" href="/cursos" onClick={() => setOpen(false)}>Ver cursos</Link>
      </nav>
    </header>
  );
}
