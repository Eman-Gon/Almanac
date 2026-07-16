import type { ReactNode } from "react";

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return <div className="state-card empty-state"><strong>{title}</strong>{children ? <span>{children}</span> : null}{action}</div>;
}
