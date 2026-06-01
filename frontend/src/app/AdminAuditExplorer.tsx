import { ChevronLeft, ChevronRight, FileSearch, FilterX, Search, ShieldAlert, X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  getAuditLogs,
  getRelatedAuditLogs,
  type AuditLog,
  type AuditLogFilters,
  type AuditLogPage,
} from "../lib/admin";
import { getStoredToken } from "../lib/auth";

type AdminAuditExplorerProps = {
  initialFilters?: AuditLogFilters;
  initialEvent?: AuditLog | null;
};

const actions = [
  "AUTH.LOGIN_SUCCESS", "AUTH.LOGIN_FAILED", "AUTH.ACCESS_DENIED", "AUTH.REGISTER_REJECTED",
  "CLASS.CREATED", "CLASS.UPDATED", "ASSIGNMENT.CREATED", "ASSIGNMENT.UPDATED",
  "SUBMISSION.UPLOADED", "SUBMISSION.GRADED", "CHAT.MESSAGE_SENT",
  "AI.PREDICTION_REQUESTED", "AI.PREDICTION_FAILED", "UPLOAD.INVALID",
];
const risks = ["", "LOW", "MEDIUM", "HIGH"] as const;
const results = ["", "SUCCESS", "FAILURE", "DENIED"];

const riskStyle = {
  LOW: "bg-[#ecfdf3] text-[#087443]",
  MEDIUM: "bg-[#fffaeb] text-[#b54708]",
  HIGH: "bg-[#fef3f2] text-[#b42318]",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function AdminAuditExplorer({ initialFilters = {}, initialEvent = null }: AdminAuditExplorerProps) {
  const [filters, setFilters] = useState<AuditLogFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AuditLogPage | null>(null);
  const [selected, setSelected] = useState<AuditLog | null>(initialEvent);
  const [related, setRelated] = useState<AuditLog[]>([]);
  const [error, setError] = useState("");
  const token = getStoredToken();

  useEffect(() => {
    if (!token) return;
    setError("");
    getAuditLogs(token, filters, page)
      .then(setData)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Không tải được nhật ký audit."));
  }, [filters, page, token]);

  useEffect(() => {
    if (!token || !selected) {
      setRelated([]);
      return;
    }
    getRelatedAuditLogs(token, selected.id).then(setRelated).catch(() => setRelated([]));
  }, [selected, token]);

  function updateFilter(key: keyof AuditLogFilters, value: string) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function clearFilters() {
    setPage(1);
    setFilters({});
  }

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-[#dce4ee] bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black"><FileSearch className="text-[#246bfd]" size={22} />Audit Explorer</h2>
            <p className="mt-1 text-sm text-[#667085]">Truy vết ai đã làm gì, lúc nào và trên tài nguyên nào.</p>
          </div>
          <button onClick={clearFilters} className="inline-flex items-center gap-2 self-start rounded-lg border border-[#d0d8e4] px-3 py-2 text-xs font-black text-[#475467] hover:bg-[#f8fafc]">
            <FilterX size={15} />Xóa bộ lọc
          </button>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="relative">
            <Search className="absolute left-3 top-3 text-[#98a2b3]" size={16} />
            <input value={filters.actor_query ?? ""} onChange={(event) => updateFilter("actor_query", event.target.value)} placeholder="Email hoặc tên người dùng" className="w-full rounded-lg border border-[#d0d8e4] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#246bfd]" />
          </label>
          <select value={filters.actor_role ?? ""} onChange={(event) => updateFilter("actor_role", event.target.value)} className="rounded-lg border border-[#d0d8e4] px-3 py-2.5 text-sm outline-none focus:border-[#246bfd]">
            <option value="">Tất cả vai trò</option><option>ADMIN</option><option>TEACHER</option><option>PARENT</option>
          </select>
          <select value={filters.action ?? ""} onChange={(event) => updateFilter("action", event.target.value)} className="rounded-lg border border-[#d0d8e4] px-3 py-2.5 text-sm outline-none focus:border-[#246bfd]">
            <option value="">Tất cả hành động</option>{actions.map((action) => <option key={action}>{action}</option>)}
          </select>
          <input value={filters.request_id ?? ""} onChange={(event) => updateFilter("request_id", event.target.value)} placeholder="Request / correlation ID" className="rounded-lg border border-[#d0d8e4] px-3 py-2.5 text-sm outline-none focus:border-[#246bfd]" />
          <input type="date" value={filters.date_from ?? ""} onChange={(event) => updateFilter("date_from", event.target.value)} className="rounded-lg border border-[#d0d8e4] px-3 py-2.5 text-sm outline-none focus:border-[#246bfd]" />
          <input type="date" value={filters.date_to ?? ""} onChange={(event) => updateFilter("date_to", event.target.value)} className="rounded-lg border border-[#d0d8e4] px-3 py-2.5 text-sm outline-none focus:border-[#246bfd]" />
          <input value={filters.resource_type ?? ""} onChange={(event) => updateFilter("resource_type", event.target.value)} placeholder="Resource type" className="rounded-lg border border-[#d0d8e4] px-3 py-2.5 text-sm outline-none focus:border-[#246bfd]" />
          <input value={filters.request_path ?? ""} onChange={(event) => updateFilter("request_path", event.target.value)} placeholder="Request path" className="rounded-lg border border-[#d0d8e4] px-3 py-2.5 text-sm outline-none focus:border-[#246bfd]" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {risks.map((risk) => <button key={risk || "ALL"} onClick={() => updateFilter("risk_level", risk)} className={`rounded-full px-3 py-1.5 text-xs font-black ${filters.risk_level === risk || (!filters.risk_level && !risk) ? "bg-[#172b4d] text-white" : "bg-[#eef2f6] text-[#667085]"}`}>{risk || "TẤT CẢ RỦI RO"}</button>)}
          <span className="mx-1 w-px bg-[#d0d8e4]" />
          {results.map((result) => <button key={result || "ALL"} onClick={() => updateFilter("result", result)} className={`rounded-full px-3 py-1.5 text-xs font-black ${filters.result === result || (!filters.result && !result) ? "bg-[#246bfd] text-white" : "bg-[#edf4ff] text-[#155dcc]"}`}>{result || "TẤT CẢ KẾT QUẢ"}</button>)}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#dce4ee] bg-white shadow-sm">
        {error ? <div className="p-8 text-center text-sm font-bold text-[#b42318]">{error}</div> : !data ? <div className="p-8 text-center text-sm text-[#667085]">Đang tải nhật ký audit...</div> : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-[#f8fafc] text-xs uppercase tracking-wide text-[#667085]"><tr><th className="px-4 py-3">Thời gian</th><th className="px-4 py-3">Người thực hiện</th><th className="px-4 py-3">Hành động</th><th className="px-4 py-3">Tài nguyên</th><th className="px-4 py-3">Kết quả</th><th className="px-4 py-3">Rủi ro</th></tr></thead>
                <tbody className="divide-y divide-[#e4eaf1]">
                  {data.items.map((item) => <tr key={item.id} onClick={() => setSelected(item)} className="cursor-pointer hover:bg-[#f8fafc]"><td className="whitespace-nowrap px-4 py-3 text-xs text-[#667085]">{formatDateTime(item.occurred_at)}</td><td className="px-4 py-3"><div className="font-bold text-[#344054]">{item.actor_email ?? "Ẩn danh"}</div><div className="text-xs text-[#98a2b3]">{item.actor_role ?? "N/A"}</div></td><td className="whitespace-nowrap px-4 py-3 font-bold text-[#344054]">{item.action}</td><td className="px-4 py-3 text-xs text-[#667085]">{item.resource_type ?? "N/A"}<div className="max-w-[180px] truncate">{item.resource_id}</div></td><td className="px-4 py-3 font-bold text-[#475467]">{item.result}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-black ${riskStyle[item.risk_level]}`}>{item.risk_level}</span></td></tr>)}
                </tbody>
              </table>
              {data.items.length === 0 && <div className="p-8 text-center text-sm text-[#667085]">Không có sự kiện audit phù hợp.</div>}
            </div>
            <div className="flex items-center justify-between border-t border-[#e4eaf1] px-4 py-3 text-sm text-[#667085]">
              <span>{data.total} events · trang {data.page}/{Math.max(data.pages, 1)}</span>
              <div className="flex gap-2"><button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border p-2 disabled:opacity-40"><ChevronLeft size={16} /></button><button disabled={page >= data.pages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border p-2 disabled:opacity-40"><ChevronRight size={16} /></button></div>
            </div>
          </>
        )}
      </div>

      {selected && <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setSelected(null)}><aside className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-3"><div><div className={`inline-flex rounded-full px-2 py-1 text-xs font-black ${riskStyle[selected.risk_level]}`}>{selected.risk_level}</div><h3 className="mt-3 text-lg font-black">{selected.action}</h3><p className="mt-1 text-sm text-[#667085]">{formatDateTime(selected.occurred_at)}</p></div><button onClick={() => setSelected(null)} className="rounded-lg border p-2"><X size={17} /></button></div><div className="mt-6 grid gap-3 rounded-xl bg-[#f8fafc] p-4 text-sm"><div>Người thực hiện: <strong>{selected.actor_email ?? "Ẩn danh"}</strong></div><div>Vai trò: <strong>{selected.actor_role ?? "N/A"}</strong></div><div>Kết quả: <strong>{selected.result}</strong></div><div>Tài nguyên: <strong>{selected.resource_type ?? "N/A"} / {selected.resource_id ?? "N/A"}</strong></div><div>Yêu cầu: <strong>{selected.http_method ?? "N/A"} {selected.request_path ?? "N/A"}</strong></div><div>Request ID: <strong>{selected.request_id ?? "N/A"}</strong></div><div>IP: <strong>{selected.ip_address ?? "N/A"}</strong></div><div className="break-all">Trình duyệt: <strong>{selected.user_agent ?? "N/A"}</strong></div></div><h4 className="mt-6 font-black">Metadata đã làm sạch</h4><pre className="mt-2 overflow-x-auto rounded-xl bg-[#111c2e] p-4 text-xs text-[#d4e2fa]">{JSON.stringify(selected.metadata, null, 2)}</pre><h4 className="mt-6 flex items-center gap-2 font-black"><ShieldAlert size={17} className="text-[#246bfd]" />Sự kiện liên quan</h4><div className="mt-2 space-y-2">{related.map((item) => <button key={item.id} onClick={() => setSelected(item)} className="w-full rounded-lg border border-[#dce4ee] p-3 text-left text-xs hover:bg-[#f8fafc]"><strong>{item.action}</strong><span className="mt-1 block text-[#667085]">{formatDateTime(item.occurred_at)} · {item.result}</span></button>)}</div></aside></div>}
    </section>
  );
}
