export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return <div className="state-card loading-state" role="status" aria-live="polite"><span className="loading-spinner" aria-hidden="true" />{label}</div>;
}
