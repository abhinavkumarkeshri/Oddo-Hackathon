"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Building2,
  Package,
  GitBranch,
  CalendarCheck,
  Wrench,
  ClipboardList,
  BarChart2,
  Activity,
  ChevronRight,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Nav Structure ────────────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href:  string;
  icon:  React.ElementType;
  adminOnly?: boolean;
}

interface NavSection {
  title?: string;
  items:  NavItem[];
}

const NAV: NavSection[] = [
  {
    items: [
      { label: "Dashboard",   href: "/dashboard",             icon: LayoutDashboard },
    ],
  },
  {
    title: "Organization",
    items: [
      { label: "Org Setup",   href: "/dashboard/org-setup",   icon: Building2, adminOnly: true },
    ],
  },
  {
    title: "Asset Management",
    items: [
      { label: "Assets",      href: "/dashboard/assets",      icon: Package },
      { label: "Allocations", href: "/dashboard/allocations", icon: GitBranch },
      { label: "Bookings",    href: "/dashboard/bookings",    icon: CalendarCheck },
      { label: "Maintenance", href: "/dashboard/maintenance", icon: Wrench },
    ],
  },
  {
    title: "Governance",
    items: [
      { label: "Audits",       href: "/dashboard/audits",       icon: ClipboardList },
      { label: "Reports",      href: "/dashboard/reports",      icon: BarChart2 },
      { label: "Activity Log", href: "/dashboard/activity-log", icon: Activity },
    ],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface SidebarProps {
  isAdmin?: boolean;
}

export function Sidebar({ isAdmin = false }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  return (
    <aside className="sidebar scrollbar-hide">
      {/* Logo */}
      <div className="sidebar-logo">
        <Link href="/dashboard" className="flex items-center gap-2.5 no-underline">
          <div className="w-7 h-7 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
            <Boxes className="w-4 h-4 text-white" />
          </div>
          <span className="text-[15px] font-semibold text-[#111827] tracking-tight">
            AssetFlow
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="sidebar-section flex-1 py-2">
        {NAV.map((section, si) => {
          // Filter admin-only items if not admin
          const items = section.items.filter(
            (item) => !item.adminOnly || isAdmin
          );
          if (!items.length) return null;

          return (
            <div key={si} className="mb-1">
              {section.title && (
                <p className="sidebar-section-label">{section.title}</p>
              )}
              {items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn("sidebar-item", active && "active")}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 flex-shrink-0",
                        active ? "text-accent" : "text-[#9CA3AF]"
                      )}
                    />
                    <span>{item.label}</span>
                    {active && (
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-accent opacity-60" />
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Bottom: version */}
      <div className="px-4 py-3 border-t border-[#E5E7EB]">
        <p className="text-[11px] text-[#9CA3AF]">AssetFlow v0.1</p>
      </div>
    </aside>
  );
}
