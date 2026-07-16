export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand-lockup" aria-label="ChoiceGrid">
      <svg
        className="brand-mark"
        viewBox="0 0 40 40"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="7" y="7" width="11" height="11" rx="2" transform="rotate(45 12.5 12.5)" />
        <rect x="22" y="7" width="11" height="11" rx="2" transform="rotate(45 27.5 12.5)" />
        <rect x="7" y="22" width="11" height="11" rx="2" transform="rotate(45 12.5 27.5)" />
        <rect x="22" y="22" width="11" height="11" rx="2" transform="rotate(45 27.5 27.5)" />
      </svg>
      {compact ? null : <span>ChoiceGrid</span>}
    </span>
  );
}
