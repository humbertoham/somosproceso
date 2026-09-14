"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

export function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  const [showImage, setShowImage] = useState(true);
  return (
    <Link className={`wordmark ${light ? "wordmark-light" : ""}`} href={href} aria-label="Somos Proceso, inicio">
      {showImage && <Image src="/logo.svg" alt="" width={38} height={38} onError={() => setShowImage(false)} />}
      <span>Somos Proceso</span>
    </Link>
  );
}
