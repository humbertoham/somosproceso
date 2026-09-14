import type { Metadata } from "next";
import { DM_Sans, Lora } from "next/font/google";

import { getSiteUrl } from "@/lib/env";
import "./globals.css";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const editorial = Lora({ subsets: ["latin"], variable: "--font-editorial", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: "Somos Proceso | Espacios para crecer", template: "%s | Somos Proceso" },
  description: "Cursos y talleres de desarrollo humano, inteligencia emocional y comunicación.",
  openGraph: { title: "Somos Proceso | Espacios para crecer", description: "Desarrollo humano, inteligencia emocional y espacios seguros para crecer.", type: "website", locale: "es_MX", images: ["/og.png"] },
  twitter: { card: "summary_large_image", title: "Somos Proceso | Espacios para crecer", description: "Desarrollo humano, inteligencia emocional y espacios seguros para crecer.", images: ["/og.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body className={`${sans.variable} ${editorial.variable}`}>{children}</body></html>;
}
