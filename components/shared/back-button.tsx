import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export function BackButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="back-button" href={href}>
      <ArrowLeft size={16} aria-hidden="true" />
      <span>{children}</span>
    </Link>
  );
}
