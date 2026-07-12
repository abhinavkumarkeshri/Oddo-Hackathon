"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import { Bell, ChevronDown, User, Settings, LogOut, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopbarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
  pageTitle?: string;
}

export function Topbar({ user, pageTitle }: TopbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "U";

  return (
    <header className="topbar">
      {/* Left: page title / breadcrumb slot */}
      <div className="flex items-center gap-3">
        {pageTitle && (
          <h1 className="text-sm font-semibold text-[#111827] m-0">{pageTitle}</h1>
        )}
      </div>

      {/* Right: search · notifications · user menu */}
      <div className="flex items-center gap-2">
        {/* Search trigger */}
        <button
          id="topbar-search"
          className="flex items-center gap-2 text-[13px] text-[#9CA3AF] bg-[#F8F9FB] border border-[#E5E7EB] rounded-md px-3 py-1.5 hover:border-[#D1D5DB] transition-colors cursor-pointer"
          style={{ minWidth: 180 }}
          onClick={() => {/* future: open command palette */}}
        >
          <Search className="w-3.5 h-3.5" />
          Search…
          <kbd className="ml-auto text-[10px] bg-white border border-[#E5E7EB] rounded px-1 py-0.5 font-mono text-[#9CA3AF]">
            ⌘K
          </kbd>
        </button>

        {/* Notification Bell */}
        <div ref={notifRef} className="relative">
          <button
            id="topbar-notifications"
            onClick={() => { setNotifOpen(!notifOpen); setMenuOpen(false); }}
            className="relative w-9 h-9 flex items-center justify-center rounded-md hover:bg-[#F3F4F6] transition-colors text-[#6B7280]"
          >
            <Bell className="w-4.5 h-4.5" />
            {/* Unread dot */}
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-[#2563EB] rounded-full" />
          </button>

          {notifOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-72 bg-white border border-[#E5E7EB] rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] z-50 overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
                <span className="text-[13px] font-semibold text-[#111827]">Notifications</span>
                <button className="text-[11px] text-[#2563EB] font-medium hover:underline">
                  Mark all read
                </button>
              </div>
              <div className="py-2">
                <NotifItem
                  title="Asset #A-004 is overdue"
                  desc="Laptop — John Doe · 2 days ago"
                  unread
                />
                <NotifItem
                  title="Maintenance request approved"
                  desc="Projector #P-011 · 1 day ago"
                />
              </div>
              <div className="px-4 py-2.5 border-t border-[#E5E7EB]">
                <button className="text-[12px] text-[#2563EB] font-medium hover:underline">
                  View all activity →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-[#E5E7EB] mx-1" />

        {/* User Menu */}
        <div ref={menuRef} className="relative">
          <button
            id="topbar-user-menu"
            onClick={() => { setMenuOpen(!menuOpen); setNotifOpen(false); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#F3F4F6] transition-colors"
          >
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-[12px] font-semibold text-[#111827] leading-none mb-0.5">
                {user?.name ?? "User"}
              </p>
              <p className="text-[11px] text-[#9CA3AF] leading-none">
                {user?.role?.replace("_", " ").toLowerCase() ?? "member"}
              </p>
            </div>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 text-[#9CA3AF] transition-transform",
                menuOpen && "rotate-180"
              )}
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#E5E7EB] rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.08)] z-50 overflow-hidden py-1">
              {/* User info header */}
              <div className="px-3 py-2.5 border-b border-[#E5E7EB]">
                <p className="text-[12px] font-semibold text-[#111827] truncate">
                  {user?.name ?? "User"}
                </p>
                <p className="text-[11px] text-[#9CA3AF] truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <MenuAction icon={User} label="Profile" href="/dashboard/profile" />
                <MenuAction icon={Settings} label="Settings" href="/dashboard/settings" />
              </div>

              <div className="border-t border-[#E5E7EB] py-1">
                <button
                  id="topbar-signout"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-[13px] text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function NotifItem({
  title,
  desc,
  unread,
}: {
  title: string;
  desc: string;
  unread?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-2.5 hover:bg-[#F8F9FB] cursor-pointer",
        unread && "bg-[#EFF6FF] hover:bg-[#EFF6FF]"
      )}
    >
      {unread && (
        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#2563EB] flex-shrink-0" />
      )}
      {!unread && <span className="mt-1.5 w-1.5 h-1.5 flex-shrink-0" />}
      <div>
        <p className="text-[12px] font-medium text-[#111827] leading-snug">{title}</p>
        <p className="text-[11px] text-[#9CA3AF] mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function MenuAction({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-[#374151] hover:bg-[#F8F9FB] transition-colors no-underline"
    >
      <Icon className="w-3.5 h-3.5 text-[#9CA3AF]" />
      {label}
    </a>
  );
}
