import Link from "next/link";
import Image from "next/image";

export function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return (
    <Link className={`wordmark ${light ? "wordmark-light" : ""}`} href={href} aria-label="Somos Proceso, inicio">
      <span className="wordmark-symbol" aria-hidden="true">
        <Image src="/logo.svg" alt="" width={48} height={48} />
      </span>
      <span className="wordmark-text">Somos <strong>Proceso</strong></span>
    </Link>
  );
}
