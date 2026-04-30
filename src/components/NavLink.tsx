"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Link> & {
  activeClassName?: string;
  exact?: boolean;
};

export default function NavLink({
  href,
  className,
  activeClassName = "",
  exact = false,
  children,
  ...rest
}: Props) {
  const pathname = usePathname();
  const hrefStr = href.toString();
  const isActive = exact ? pathname === hrefStr : pathname.startsWith(hrefStr);

  const resolved =
    typeof className === "string" || className === undefined
      ? [className, isActive ? activeClassName : ""].filter(Boolean).join(" ")
      : String(className);

  return (
    <Link href={href} className={resolved} {...rest}>
      {children}
    </Link>
  );
}
