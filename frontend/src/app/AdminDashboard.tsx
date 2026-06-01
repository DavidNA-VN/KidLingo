import {
  ChartNoAxesCombined,
  FileSearch,
  LayoutDashboard,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";

import type { AdminDashboardData, AuditLog, AuditLogFilters } from "../lib/admin";
import { getAdminDashboard } from "../lib/admin";
import type { AuthUser } from "../lib/auth";
import { getStoredToken } from "../lib/auth";
import { AdminOverview } from "./AdminOverview";
import { AdminAuditExplorer } from "./AdminAuditExplorer";
import { AdminFeatureOperations } from "./AdminFeatureOperations";
import { AdminSecurityMonitoring } from "./AdminSecurityMonitoring";
import { AdminUsersOverview } from "./AdminUsersOverview";

type AdminDashboardProps = {
  user: AuthUser;
  onLogout: () => void;
};

const navItems = [
  { id: "overview", label: "Tổng quan hệ thống", icon: LayoutDashboard },
  { id: "security", label: "Giám sát bảo mật", icon: ShieldAlert },
  { id: "audit", label: "Audit Explorer", icon: FileSearch },
  { id: "users", label: "Người dùng", icon: UsersRound },
  { id: "features", label: "Vận hành tính năng", icon: ChartNoAxesCombined },
];

function DashboardSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-40 rounded-2xl bg-[#dce4ee]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => <div key={index} className="h-36 rounded-xl bg-[#e4eaf1]" />)}
      </div>
      <div className="h-72 rounded-2xl bg-[#e4eaf1]" />
    </div>
  );
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeSection, setActiveSection] = useState("overview");
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [auditFilters, setAuditFilters] = useState<AuditLogFilters>({});
  const [auditEvent, setAuditEvent] = useState<AuditLog | null>(null);
  const [auditExplorerKey, setAuditExplorerKey] = useState(0);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setError("Không tìm thấy phiên đăng nhập quản trị.");
      return;
    }
    setError("");
    getAdminDashboard(token)
      .then(setDashboard)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Không tải được dashboard."));
  }, [reloadKey]);

  const activeLabel = navItems.find((item) => item.id === activeSection)?.label ?? "Admin Console";

  function openAuditExplorer(filters: AuditLogFilters, event?: AuditLog) {
    setAuditFilters(filters);
    setAuditEvent(event ?? null);
    setAuditExplorerKey((value) => value + 1);
    setActiveSection("audit");
  }

  return (
    <main className="min-h-screen bg-[#eef3f8] text-[#172033]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] border-r border-[#27364d] bg-[#111c2e] p-5 text-white lg:block">
        <div className="flex items-center gap-3 border-b border-white/10 pb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#246bfd]"><ShieldCheck size={23} /></div>
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#91b5ff]">Doodle English</div>
            <div className="mt-1 font-bold">Admin Console</div>
          </div>
        </div>
        <nav className="mt-6 space-y-1">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveSection(id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition ${activeSection === id ? "bg-[#246bfd] text-white" : "text-[#b9c7dc] hover:bg-white/10 hover:text-white"}`}>
              <Icon size={17} />{label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#91b5ff]">Quản trị viên</div>
          <div className="mt-2 truncate text-sm font-bold">{user.full_name}</div>
          <div className="mt-1 truncate text-xs text-[#b9c7dc]">{user.email}</div>
        </div>
      </aside>
      <section className="min-h-screen lg:pl-[280px]">
        <header className="sticky top-0 z-20 border-b border-[#d7e0eb] bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs font-bold uppercase tracking-[0.16em] text-[#246bfd]">Quản trị hệ thống</div>
              <h1 className="mt-1 text-xl font-black">{activeLabel}</h1>
            </div>
            <button onClick={onLogout} className="inline-flex items-center gap-2 rounded-lg border border-[#d0d8e4] bg-white px-4 py-2 text-sm font-bold text-[#344054] hover:bg-[#f8fafc]">
              <LogOut size={16} />Đăng xuất
            </button>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => setActiveSection(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${activeSection === id ? "bg-[#246bfd] text-white" : "border border-[#d0d8e4] bg-white text-[#475467]"}`}>
                <Icon size={15} />{label}
              </button>
            ))}
          </nav>
        </header>
        <div className="p-5 sm:p-7">
          {error ? (
            <section className="rounded-2xl border border-[#fecdca] bg-white p-8 text-center shadow-sm">
              <ShieldAlert className="mx-auto text-[#d92d20]" size={32} />
              <h2 className="mt-3 font-black">Không tải được dashboard giám sát</h2>
              <p className="mt-2 text-sm text-[#667085]">{error}</p>
              <button onClick={() => setReloadKey((value) => value + 1)} className="mt-4 rounded-lg bg-[#246bfd] px-4 py-2 text-sm font-bold text-white">Thử lại</button>
            </section>
          ) : !dashboard ? (
            <DashboardSkeleton />
          ) : activeSection === "audit" ? (
            <AdminAuditExplorer key={auditExplorerKey} initialFilters={auditFilters} initialEvent={auditEvent} />
          ) : activeSection === "security" ? (
            <AdminSecurityMonitoring data={dashboard} onOpenAuditExplorer={openAuditExplorer} />
          ) : activeSection === "features" ? (
            <AdminFeatureOperations data={dashboard} />
          ) : activeSection === "users" ? (
            <AdminUsersOverview data={dashboard} />
          ) : (
            <AdminOverview data={dashboard} onOpenAuditExplorer={openAuditExplorer} />
          )}
        </div>
      </section>
    </main>
  );
}
