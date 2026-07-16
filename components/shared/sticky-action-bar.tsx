import type { ReactNode } from "react";

export function StickyActionBar({
  children,
  status,
  className = "",
}: {
  children: ReactNode;
  status?: ReactNode;
  className?: string;
}) {
  return (
    <div className={`sticky-action-bar ${className}`}>
      {status ? <div className="sticky-action-bar-status">{status}</div> : null}
      <div className="sticky-action-bar-actions">{children}</div>
    </div>
  );
}
