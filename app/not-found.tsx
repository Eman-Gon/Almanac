import Link from "next/link";

export default function NotFound() {
  return (
    <div className="route-state">
      <strong>That Almanac record was not found.</strong>
      <span>The demo scenario may have been reset.</span>
      <Link className="button button-primary" href="/dashboard">
        Return to dashboard
      </Link>
    </div>
  );
}
