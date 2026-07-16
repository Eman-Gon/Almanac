import type { ReactNode } from "react";

export function ErrorState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return <div className="state-card error-state" role="alert"><strong>{title}</strong>{children ? <span>{children}</span> : null}{action}</div>;
}
