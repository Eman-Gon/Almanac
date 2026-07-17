export default function Loading() {
  return (
    <div className="route-state" role="status">
      <span className="route-state-spinner" aria-hidden="true" />
      <strong>Loading Almanac</strong>
      <span>Preparing the current scenario…</span>
    </div>
  );
}
