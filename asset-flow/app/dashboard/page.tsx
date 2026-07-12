import { auth } from "@/lib/auth";
import {
  Package,
  GitBranch,
  CalendarCheck,
  Wrench,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";

// ─── Placeholder stat cards data ────────────────────────────────────────────

const STATS = [
  {
    label: "Total Assets",
    value: "—",
    icon: Package,
    iconBg: "#EFF6FF",
    iconColor: "#2563EB",
    delta: null,
  },
  {
    label: "Allocated",
    value: "—",
    icon: GitBranch,
    iconBg: "#F0FDF4",
    iconColor: "#16A34A",
    delta: null,
  },
  {
    label: "Active Bookings",
    value: "—",
    icon: CalendarCheck,
    iconBg: "#FFFBEB",
    iconColor: "#D97706",
    delta: null,
  },
  {
    label: "Under Maintenance",
    value: "—",
    icon: Wrench,
    iconBg: "#FEF2F2",
    iconColor: "#DC2626",
    delta: null,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-semibold text-[#111827] mb-0.5">
          Good morning, {firstName} 👋
        </h1>
        <p className="text-sm text-[#6B7280]">
          Here&apos;s a quick overview of your organization&apos;s assets.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="card">
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: stat.iconBg }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: stat.iconColor }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#111827] mb-1">{stat.value}</p>
              <p className="text-[13px] text-[#6B7280]">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Two-column placeholder section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity placeholder */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[14px] font-semibold text-[#111827]">Recent Activity</h2>
            <a href="/dashboard/activity-log" className="text-[12px] text-[#2563EB] hover:underline">
              View all →
            </a>
          </div>
          <EmptyState icon={TrendingUp} text="No activity yet — start by adding assets." />
        </div>

        {/* Quick stats placeholder */}
        <div className="card">
          <h2 className="text-[14px] font-semibold text-[#111827] mb-4">Asset Health</h2>
          <div className="space-y-3">
            <HealthRow icon={CheckCircle} color="#16A34A" label="Available" value="—" />
            <HealthRow icon={Clock}       color="#D97706" label="Pending"   value="—" />
            <HealthRow icon={AlertTriangle} color="#DC2626" label="Overdue" value="—" />
          </div>
        </div>
      </div>

      {/* Setup prompt if org not configured */}
      <div className="card border-dashed border-[#2563EB]/30 bg-[#EFF6FF]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#2563EB] flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-[#1D4ED8] mb-0.5">
              Complete your organization setup
            </p>
            <p className="text-[12px] text-[#3B82F6]">
              Add asset categories, locations, and invite your team to get started.
            </p>
          </div>
          <a
            href="/dashboard/org-setup"
            className="btn-primary text-[12px] px-4 py-2 flex-shrink-0"
          >
            Set up now
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Mini-components ─────────────────────────────────────────────────────────

function EmptyState({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-[#9CA3AF]" />
      </div>
      <p className="text-[13px] text-[#9CA3AF]">{text}</p>
    </div>
  );
}

function HealthRow({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" style={{ color }} />
        <span className="text-[13px] text-[#4B5563]">{label}</span>
      </div>
      <span className="text-[13px] font-semibold text-[#111827]">{value}</span>
    </div>
  );
}
