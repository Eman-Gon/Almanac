"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Box,
  ChevronDown,
  ClipboardList,
  Gauge,
  MapPinned,
  Menu,
  RefreshCcw,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { BrandMark } from "@/components/layout/brand-mark";
import { useDemoState } from "@/state/demo-state";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: Gauge },
  { href: "/donations/DON-104", label: "Donations", icon: Box },
  { href: "/plans/PLN-104", label: "Plans", icon: ClipboardList },
  { href: "/map", label: "Map", icon: MapPinned },
  { href: "/missions/MSN-104", label: "Missions", icon: Truck },
  { href: "/impact", label: "Impact", icon: BarChart3 },
] as const;

function routeIsActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  const root = href.split("/")[1];
  return pathname.startsWith(`/${root}`);
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { resetScenario } = useDemoState();
  const [menuOpen, setMenuOpen] = useState(false);

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
            const active = routeIsActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
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
          <div className="demo-mode-row">
            <span>Demo mode</span>
            <span className="toggle-on" aria-label="Demo mode enabled">
              <span />
            </span>
          </div>
          <div className="scenario-label">Scenario</div>
          <div className="scenario-select" aria-label="Current scenario">
            <span>Strawberry Rescue</span>
            <ChevronDown size={16} aria-hidden="true" />
          </div>
          <button className="reset-button" type="button" onClick={reset}>
            <RefreshCcw size={16} aria-hidden="true" />
            Reset scenario
          </button>
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
