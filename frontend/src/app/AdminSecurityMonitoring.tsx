import { ShieldAlert } from "lucide-react";
import { useState } from "react";

import type { AdminDashboardData, AuditLog, AuditLogFilters, SuspiciousActivity } from "../lib/admin";
import { AdminRiskDistribution } from "./AdminRiskDistribution";
import { AdminSecurityTimeline } from "./AdminSecurityTimeline";
import { AdminSuspiciousActivities } from "./AdminSuspiciousActivities";

type AdminSecurityMonitoringProps = {
  data: AdminDashboardData;
  onOpenAuditExplorer: (filters: AuditLogFilters, event?: AuditLog) => void;
};

export function AdminSecurityMonitoring({ data, onOpenAuditExplorer }: AdminSecurityMonitoringProps) {
  const [riskFilter, setRiskFilter] = useState<"ALL" | AuditLog["risk_level"]>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<AuditLog | null>(null);

  function investigate(item: SuspiciousActivity) {
    onOpenAuditExplorer({
      risk_level: item.risk_level,
      action: item.action === "ACTIVITY.HIGH_VOLUME" ? "" : item.action,
      actor_query: item.actor_email ?? "",
      request_path: item.request_path ?? "",
    });
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-gradient-to-r from-[#3b1520] via-[#70262b] to-[#a83b2f] p-6 text-white shadow-lg">
        <ShieldAlert size={28} />
        <h2 className="mt-4 text-2xl font-black">Trung tâm giám sát bảo mật</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
          Theo dõi sự kiện rủi ro, cảnh báo đáng ngờ và mở ngữ cảnh điều tra trong Audit Explorer.
        </p>
      </section>
      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <AdminSecurityTimeline items={data.timeline} riskFilter={riskFilter} onRiskFilterChange={setRiskFilter} selectedEvent={selectedEvent} onSelectEvent={setSelectedEvent} onInvestigateEvent={(item) => onOpenAuditExplorer({}, item)} />
        <div className="space-y-5">
          <AdminSuspiciousActivities items={data.suspicious_activities} onInvestigate={investigate} />
          <AdminRiskDistribution items={data.risk_distribution} onSelectRisk={(risk) => onOpenAuditExplorer({ risk_level: risk })} />
        </div>
      </section>
    </div>
  );
}
