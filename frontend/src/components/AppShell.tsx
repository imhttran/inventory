"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { API_BASE, callApi } from "@/lib/api";
import { hasRole, type Role } from "@/lib/roles";
import { Logo } from "./Logo";

const COLLAPSE_KEY = "sidebar-collapsed";

// Persistent operations nav. Auth pages (login, profile, password flows)
// keep the centered-card layout and don't use this shell. A section with
// minRole is hidden from users below that role — the backend rejects their
// writes there anyway (counter sales are staff-only), so clients just get
// a link to a page that tells them no.
const NAV_SECTIONS: {
  label: string;
  minRole?: Role;
  items: { href: string; label: string; icon: ReactNode }[];
}[] = [
  {
    label: "Counter",
    minRole: "staff",
    items: [
      {
        href: "/sale",
        label: "New Sale",
        icon: (
          <svg viewBox="0 0 24 24" strokeWidth="1.8" aria-hidden="true">
            <path d="M3 3h2l2.6 12.4a1 1 0 0 0 1 .8h9.7a1 1 0 0 0 1-.8L21 7H6" />
            <circle cx="10" cy="20" r="1.4" />
            <circle cx="17" cy="20" r="1.4" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: (
          <svg viewBox="0 0 24 24" strokeWidth="1.8" aria-hidden="true">
            <rect x="3" y="3" width="7" height="9" rx="1" />
            <rect x="14" y="3" width="7" height="5" rx="1" />
            <rect x="14" y="10" width="7" height="11" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
      },
      {
        href: "/inventory",
        label: "Inventory",
        icon: (
          <svg viewBox="0 0 24 24" strokeWidth="1.8" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h10" />
            <rect x="17.5" y="15" width="3.5" height="4" rx="0.5" />
          </svg>
        ),
      },
      {
        href: "/products",
        label: "Products",
        icon: (
          <svg viewBox="0 0 24 24" strokeWidth="1.8" aria-hidden="true">
            <path d="M21 8 12 3 3 8v8l9 5 9-5z" />
            <path d="M3 8l9 5 9-5M12 13v8" />
          </svg>
        ),
      },
      {
        href: "/search",
        label: "Search",
        icon: (
          <svg viewBox="0 0 24 24" strokeWidth="1.8" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        ),
      },
      {
        href: "/suppliers",
        label: "Suppliers",
        icon: (
          <svg viewBox="0 0 24 24" strokeWidth="1.8" aria-hidden="true">
            <path d="M20 7H4m16 5H4m16 5H4" />
          </svg>
        ),
      },
    ],
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const [collapsed, setCollapsed] = useState(false);
  // Role gate for minRole nav sections. Null until /api/me answers — sections
  // stay hidden while unknown, matching how pages treat isStaff before me loads.
  const [role, setRole] = useState<string | null>(null);

  // Read the saved preference after mount so server and first client render
  // match (avoids a hydration mismatch from reading localStorage eagerly).
  useEffect(() => {
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  // Same auth-on-mount call the pages make, used only to filter the nav.
  // On failure role stays null and gated sections stay hidden (the page
  // content redirects to login on its own failed auth check).
  useEffect(() => {
    (async () => {
      const stored = localStorage.getItem("auth_token");
      if (!stored) return;
      const result = await callApi<{ user: { role: string } }>(
        stored,
        "/api/me",
        "GET",
        undefined,
        false,
      );
      if (result) setRole(result.user.role);
    })();
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  };

  return (
    <div className={`app-shell ${collapsed ? "collapsed" : ""}`}>
      <aside className="app-sidebar">
        <div className="side-brand">
          <Logo size={34} />
          <div className="side-wordmark">
            HTT Tiers
            <small>Parts &amp; Supply</small>
          </div>
        </div>
        <button
          type="button"
          className="side-collapse-btn"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg viewBox="0 0 24 24" strokeWidth="1.8" aria-hidden="true">
            <path d="M15 5 8 12l7 7" />
          </svg>
          <span>Collapse</span>
        </button>
        {NAV_SECTIONS.map((section) => {
          if (
            section.minRole &&
            (role === null || !hasRole(role, section.minRole))
          ) {
            return null;
          }
          return (
            <div key={section.label}>
              <div className="side-nav-label">{section.label}</div>
              {section.items.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`side-link ${isActive(item.href) ? "active" : ""}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          );
        })}
        <div className="side-foot">AUS · Austin Main</div>
      </aside>
      <div className="app-main">{children}</div>
    </div>
  );
}
