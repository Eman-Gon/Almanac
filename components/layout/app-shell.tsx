"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
  ClipboardList,
  Gauge,
  MapPinned,
  Menu,
  PackageSearch,
  RefreshCcw,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { multiItemScenario } from "@/data/seed/multi-item-scenario";
import { scenario } from "@/data/seed/scenario";
import { BrandMark } from "@/components/layout/brand-mark";
import { useDemoState } from "@/state/demo-state";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/inventory", label: "Inventory", icon: PackageSearch },
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
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const multiItemActive = pathname.startsWith("/inventory/preview");
  const selectedScenario = multiItemActive
    ? multiItemScenario.name
    : selectedPreview ?? scenario.name;
  const missionHref = hydrated && state.stage === "recovered"
    ? "/missions/MSN-105"
    : "/missions/MSN-104";

  function reset() {
    resetScenario();
    setSelectedPreview(null);
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
                  <span>{selectedScenario}</span>
                  <ChevronDown size={16} aria-hidden="true" />
                </summary>
                <div className="scenario-menu" aria-label="Scenario options">
                  <div className="scenario-option scenario-option-active">
                    <span><strong>{scenario.name}</strong><small>Executable MVP scenario</small></span>
                    <span className="scenario-badge scenario-badge-active">Active</span>
                  </div>
                  <Link
                    className={`scenario-option scenario-option-preview ${multiItemActive ? "scenario-option-selected" : ""}`}
                    href="/inventory/preview"
                    aria-current={multiItemActive ? "page" : undefined}
                    title="Open the interactive multi-item warehouse scenario"
                    onClick={() => {
                      setSelectedPreview(null);
                      setMenuOpen(false);
                    }}
                  >
                    <span>
                      <strong>{multiItemScenario.name}</strong>
                      <small>Interactive secondary scenario · route-local preview</small>
                    </span>
                    <span className={`scenario-badge ${multiItemActive ? "scenario-badge-selected" : ""}`}>
                      {multiItemActive ? "Viewing" : "Open"}
                    </span>
                  </Link>
                  <p className="scenario-menu-note">Disruption previews</p>
                  {scenarioPreviews.map((preview) => (
                    <button
                      className={`scenario-option scenario-option-preview ${selectedPreview === preview ? "scenario-option-selected" : ""}`}
                      type="button"
                      key={preview}
                      aria-pressed={selectedPreview === preview}
                      title="Select this scenario preview"
                      onClick={() => setSelectedPreview(preview)}
                    >
                      <span><strong>{preview}</strong><small>Selectable preview · primary data remains seeded</small></span>
                      <span className={`scenario-badge ${selectedPreview === preview ? "scenario-badge-selected" : ""}`}>
                        {selectedPreview === preview ? "Selected" : "Preview"}
                      </span>
                    </button>
                  ))}
                  <p className="scenario-menu-note">Strawberry Inventory Release remains the judged executable fixture. The multi-item route never changes its state.</p>
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
