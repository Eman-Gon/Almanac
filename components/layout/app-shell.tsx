"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
  ClipboardList,
  Gauge,
  Gift,
  MapPinned,
  Menu,
  PackageSearch,
  RefreshCcw,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { scenario } from "@/data/seed/scenario";
import { BrandMark } from "@/components/layout/brand-mark";
import { useDemoState } from "@/state/demo-state";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/inventory", label: "Inventory", icon: PackageSearch },
  { href: "/donations", label: "Donations", icon: Gift },
  { href: "/plans/PLN-104", label: "Plans", icon: ClipboardList },
  { href: "/map", label: "Map", icon: MapPinned },
  { href: "/missions/MSN-104", label: "Missions", icon: Truck },
  { href: "/impact", label: "Impact", icon: BarChart3 },
] as const;

const scenarioPreviews = [
  "Truck breakdown",
  "Cold capacity lost",
  "Driver unavailable",
  "Agency receiving window shortened",
] as const;

function routeIsActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  const root = href.split("/")[1];
  return pathname.startsWith(`/${root}`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hydrated, resetScenario, state } = useDemoState();
  const [menuOpen, setMenuOpen] = useState(false);
  const missionHref = hydrated && state.stage === "recovered"
    ? "/missions/MSN-105"
    : "/missions/MSN-104";

  function reset() {
    resetScenario();
    setMenuOpen(false);
    router.push("/dashboard");
  }

  return (
    <div className="app-shell">
      <button
        className="mobile-menu-button"
        type="button"
        aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>

      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <BrandMark />
        </div>

        <nav className="primary-nav" aria-label="Primary navigation">
          {navigation.map((item) => {
            const href = item.label === "Missions" ? missionHref : item.href;
            const active = routeIsActive(pathname, href);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={href}
                className={`nav-link ${active ? "nav-link-active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={21} strokeWidth={1.8} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-demo">
          <details className="demo-controls">
            <summary><span>Demo controls</span><ChevronDown size={16} aria-hidden="true" /></summary>
            <div className="demo-controls-body">
              <div className="demo-mode-row">
                <span>Demo mode</span>
                <span className="toggle-on" aria-label="Demo mode enabled"><span /></span>
              </div>
              <div className="scenario-label">Scenario</div>
              <details className="scenario-picker">
                <summary className="scenario-select" aria-label="Open scenario selector" data-testid="scenario-selector">
                  <span>{scenario.name}</span>
                  <ChevronDown size={16} aria-hidden="true" />
                </summary>
                <div className="scenario-menu" aria-label="Scenario options">
                  <div className="scenario-option scenario-option-active">
                    <span><strong>{scenario.name}</strong><small>Executable MVP scenario</small></span>
                    <span className="scenario-badge scenario-badge-active">Active</span>
                  </div>
                  {scenarioPreviews.map((preview) => (
                    <button
                      className="scenario-option scenario-option-preview"
                      type="button"
                      disabled
                      key={preview}
                      title="Preview only; not executable in this MVP"
                    >
                      <span><strong>{preview}</strong><small>Preview only in the primary MVP flow</small></span>
                      <span className="scenario-badge">Preview</span>
                    </button>
                  ))}
                  <p className="scenario-menu-note">Only Strawberry Inventory Release changes the demo state today.</p>
                </div>
              </details>
              <button className="reset-button" type="button" onClick={reset}>
                <RefreshCcw size={16} aria-hidden="true" />
                Reset scenario
              </button>
            </div>
          </details>
          <div className="demo-user">
            <span className="avatar-outline">
              <UserRound size={20} aria-hidden="true" />
            </span>
            <span>demo_user</span>
            <ChevronDown size={16} aria-hidden="true" />
          </div>
        </div>
      </aside>

      {menuOpen ? (
        <button
          className="sidebar-scrim"
          type="button"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}

      <main className="main-shell">{children}</main>
    </div>
  );
}
