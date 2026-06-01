import { Activity, ChevronRight, Clock3, ShieldAlert } from "lucide-react";

import type { AuditLog } from "../lib/admin";

type RiskFilter = "ALL" | AuditLog["risk_level"];
type AdminSecurityTimelineProps = {
  items: AuditLog[];
  riskFilter: RiskFilter;
  onRiskFilterChange: (risk: RiskFilter) => void;
  selectedEvent: AuditLog | null;
  onSelectEvent: (item: AuditLog | null) => void;
  onInvestigateEvent?: (item: AuditLog) => void;
};

const riskStyle = {
  LOW: "border-[#b7ebcd] bg-[#ecfdf3] text-[#087443]",
  MEDIUM: "border-[#fedf89] bg-[#fffaeb] text-[#b54708]",
  HIGH: "border-[#fecdca] bg-[#fef3f2] text-[#b42318]",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function AdminSecurityTimeline({ items, riskFilter, onRiskFilterChange, selectedEvent, onSelectEvent, onInvestigateEvent }: AdminSecurityTimelineProps) {
  const filteredItems = riskFilter === "ALL" ? items : items.filter((item) => item.risk_level === riskFilter);
  return (
    <section id="security-timeline" className="rounded-2xl border border-[#dce4ee] bg-white shadow-sm">
      <div className="flex flex-col justify-between gap-3 border-b border-[#e4eaf1] p-5 sm:flex-row sm:items-center">
        <div><h2 className="flex items-center gap-2 font-black"><Activity size={19} className="text-[#246bfd]" />Dòng thời gian hoạt động bảo mật</h2><p className="mt-1 text-sm text-[#667085]">Dòng sự kiện mới nhất, ưu tiên theo mức độ rủi ro.</p></div>
        <div className="flex gap-2">{(["ALL", "LOW", "MEDIUM", "HIGH"] as const).map((risk) => <button key={risk} onClick={() => onRiskFilterChange(risk)} className={`rounded-full px-3 py-1.5 text-xs font-black ${riskFilter === risk ? "bg-[#172b4d] text-white" : "bg-[#f2f5f9] text-[#667085]"}`}>{risk === "ALL" ? "Tất cả" : risk}</button>)}</div>
      </div>
      <div className="max-h-[610px] overflow-y-auto p-5">
        {filteredItems.length === 0 ? <div className="rounded-xl border border-dashed border-[#d0d8e4] p-8 text-center text-sm text-[#667085]">Không có sự kiện phù hợp bộ lọc.</div> : <div className="relative space-y-1 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-[#dce4ee]">{filteredItems.map((item) => <button key={item.id} onClick={() => { onSelectEvent(selectedEvent?.id === item.id ? null : item); onInvestigateEvent?.(item); }} className="relative flex w-full gap-4 rounded-xl p-3 text-left transition hover:bg-[#f8fafc]"><span className={`relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${riskStyle[item.risk_level]}`}>{item.risk_level === "HIGH" ? <ShieldAlert size={15} /> : <Activity size={15} />}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2"><span className="text-sm font-black text-[#344054]">{item.action}</span><span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${riskStyle[item.risk_level]}`}>{item.risk_level}</span><span className="rounded-full bg-[#eef2f6] px-2 py-0.5 text-[10px] font-black text-[#475467]">{item.result}</span></span><span className="mt-1 block truncate text-xs text-[#667085]">{item.actor_email ?? "Ẩn danh"} · {item.actor_role ?? "N/A"} · {item.ip_address ?? "Không có IP"}</span><span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-[#98a2b3]"><Clock3 size={12} />{formatDateTime(item.occurred_at)}{item.request_path ? ` · ${item.request_path}` : ""}</span>{selectedEvent?.id === item.id && <span className="mt-3 grid gap-2 rounded-lg border border-[#dce4ee] bg-white p-3 text-xs text-[#475467] sm:grid-cols-2"><span>Danh mục: <strong>{item.category}</strong></span><span>Tài nguyên: <strong>{item.resource_type ?? "N/A"}</strong></span><span className="sm:col-span-2">ID tài nguyên: <strong>{item.resource_id ?? "N/A"}</strong></span></span>}</span><ChevronRight size={16} className="mt-2 shrink-0 text-[#98a2b3]" /></button>)}</div>}
      </div>
    </section>
  );
}
