import {
  Activity,
  AlertTriangle,
  Bot,
  BookOpenCheck,
  GraduationCap,
  MessageSquareText,
  Send,
  UsersRound,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { AdminDashboardData } from "../lib/admin";
import type { AuditLogFilters } from "../lib/admin";

type AdminOverviewProps = {
  data: AdminDashboardData;
  onOpenAuditExplorer: (filters: AuditLogFilters, event?: AuditLog) => void;
};

const metricIcons = {
  users: UsersRound,
  active_users: Activity,
  classes: GraduationCap,
  assignments: BookOpenCheck,
  submissions: Send,
  ai_predictions: Bot,
  messages: MessageSquareText,
  security_alerts: AlertTriangle,
};

export function AdminOverview({ data, onOpenAuditExplorer }: AdminOverviewProps) {
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#101c30] via-[#172b4d] to-[#1f4d91] p-6 text-white shadow-lg">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.18em] text-[#91b5ff]">Giám sát doanh nghiệp</div>
            <h2 className="mt-3 text-2xl font-black">Tổng quan sức khỏe hệ thống</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#d4e2fa]">
              Theo dõi nhanh người dùng, lớp học, bài tập và lưu lượng vận hành trên toàn hệ thống.
            </p>
          </div>
          <div className="rounded-xl border border-white/15 bg-black/15 px-5 py-4">
            <div className="text-xs font-bold uppercase tracking-[0.14em] text-[#b8cdf2]">API được bảo vệ</div>
            <div className="mt-2 flex items-center gap-2 font-black">
              <span className="h-2.5 w-2.5 rounded-full bg-[#32d583]" />
              Đã kết nối dữ liệu trực tiếp
            </div>
            <div className="mt-1 text-xs text-[#b8cdf2]">Cửa sổ theo dõi: {data.days} ngày</div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => {
          const Icon = metricIcons[metric.key as keyof typeof metricIcons] ?? Activity;
          const isAlert = metric.key === "security_alerts";
          return (
            <article key={metric.key} className={`rounded-xl border bg-white p-4 shadow-sm ${isAlert ? "border-[#fecdca]" : "border-[#dce4ee]"}`}>
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isAlert ? "bg-[#fef3f2] text-[#d92d20]" : "bg-[#edf4ff] text-[#155dcc]"}`}>
                  <Icon size={19} />
                </div>
                <span className={`text-xs font-black ${metric.delta >= 0 ? "text-[#087443]" : "text-[#b42318]"}`}>
                  {metric.delta >= 0 ? "+" : ""}{metric.delta}
                </span>
              </div>
              <div className="mt-4 text-2xl font-black text-[#172033]">{metric.value.toLocaleString("vi-VN")}</div>
              <div className="mt-1 text-sm font-bold text-[#475467]">{metric.label}</div>
              <div className="mt-2 text-xs text-[#98a2b3]">{metric.delta_label}</div>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-[#dce4ee] bg-white p-5 shadow-sm">
        <div>
          <h2 className="font-black text-[#172033]">Xu hướng hoạt động</h2>
          <p className="mt-1 text-sm text-[#667085]">Lưu lượng audit và mức sử dụng tính năng theo ngày.</p>
        </div>
        <div className="mt-5 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.activity_trend}>
              <defs>
                <linearGradient id="auditFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#246bfd" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#246bfd" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#e4eaf1" />
              <XAxis dataKey="label" stroke="#98a2b3" fontSize={12} />
              <YAxis stroke="#98a2b3" fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Area type="monotone" dataKey="audit_events" name="Sự kiện audit" stroke="#246bfd" fill="url(#auditFill)" strokeWidth={3} />
              <Area type="monotone" dataKey="submissions" name="Bài nộp" stroke="#12b76a" fill="transparent" strokeWidth={2} />
              <Area type="monotone" dataKey="messages" name="Tin nhắn" stroke="#f79009" fill="transparent" strokeWidth={2} />
              <Area type="monotone" dataKey="ai_predictions" name="Dự đoán AI" stroke="#7a5af8" fill="transparent" strokeWidth={2} />
              <Area type="monotone" dataKey="login_failures" name="Đăng nhập thất bại" stroke="#f04438" fill="transparent" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <button onClick={() => onOpenAuditExplorer({})} className="rounded-lg bg-[#172b4d] px-4 py-2 text-sm font-bold text-white hover:bg-[#20395f]">
        Mở Audit Explorer
      </button>
    </div>
  );
}
