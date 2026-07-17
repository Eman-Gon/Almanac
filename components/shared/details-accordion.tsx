import type { ReactNode } from "react";

export function DetailsAccordion({
  title,
  children,
  defaultOpen = false,
  className = "",
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  return (
    <details className={`details-accordion ${className}`} open={defaultOpen || undefined}>
      <summary>{title}</summary>
      <div className="details-accordion-body">{children}</div>
    </details>
  );
}
