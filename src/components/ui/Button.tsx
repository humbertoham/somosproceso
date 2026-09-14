import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Common = { children: ReactNode; variant?: "primary" | "secondary" | "quiet"; className?: string };
type LinkProps = Common & { href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">;
type NativeProps = Common & { href?: never } & ButtonHTMLAttributes<HTMLButtonElement>;

function isLinkProps(props: LinkProps | NativeProps): props is LinkProps {
  return typeof (props as { href?: unknown }).href === "string";
}

export function Button(props: LinkProps | NativeProps) {
  const className = `button button-${props.variant ?? "primary"} ${props.className ?? ""}`;
  if (isLinkProps(props)) {
    const { href, children, variant, className: suppliedClassName, ...rest } = props;
    void variant; void suppliedClassName;
    return <Link href={href} className={className} {...rest}>{children}</Link>;
  }
  const { children, variant, className: suppliedClassName, ...rest } = props;
  void variant; void suppliedClassName;
  return <button className={className} {...rest}>{children}</button>;
}
