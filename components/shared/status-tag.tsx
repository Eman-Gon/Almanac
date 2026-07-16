import { AlertTriangle, CheckCircle2, Clock3, type LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = {
  green: CheckCircle2,
  amber: Clock3,
  red: AlertTriangle,
  blue: Clock3,
  purple: CheckCircle2,
};

export function StatusTag({
  children,
  tone = "blue",
}: {
  children: React.ReactNode;
  tone?: "green" | "amber" | "red" | "blue" | "purple";
}) {
  const Icon = icons[tone];
  return (
    <span className={`status-tag status-${tone}`}>
      <Icon size={13} strokeWidth={2} aria-hidden="true" />
      {children}
    </span>
  );
}
