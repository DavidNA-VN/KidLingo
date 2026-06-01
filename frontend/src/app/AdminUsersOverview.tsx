import { Activity, ShieldCheck, UsersRound } from "lucide-react";

import type { AdminDashboardData } from "../lib/admin";

export function AdminUsersOverview({ data }: { data: AdminDashboardData }) {
  const users = data.metrics.find((item) => item.key === "users")?.value ?? 0;
  const activeUsers = data.metrics.find((item) => item.key === "active_users")?.value ?? 0;
  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-gradient-to-r from-[#18284a] via-[#254f91] to-[#246bfd] p-6 text-white shadow-lg">
        <UsersRound size={28} /><h2 className="mt-4 text-2xl font-black">Người dùng hệ thống</h2><p className="mt-2 text-sm text-white/80">Theo dõi quy mô tài khoản và người dùng hoạt động gần đây.</p>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-[#dce4ee] bg-white p-5 shadow-sm"><UsersRound className="text-[#246bfd]" /><div className="mt-4 text-3xl font-black">{users}</div><div className="mt-1 font-bold text-[#475467]">Tổng người dùng</div></article>
        <article className="rounded-2xl border border-[#dce4ee] bg-white p-5 shadow-sm"><Activity className="text-[#12b76a]" /><div className="mt-4 text-3xl font-black">{activeUsers}</div><div className="mt-1 font-bold text-[#475467]">Hoạt động trong {data.days} ngày</div></article>
        <article className="rounded-2xl border border-[#dce4ee] bg-white p-5 shadow-sm"><ShieldCheck className="text-[#7a5af8]" /><div className="mt-4 text-3xl font-black">1</div><div className="mt-1 font-bold text-[#475467]">Tài khoản quản trị</div></article>
      </section>
      <section className="rounded-2xl border border-[#dce4ee] bg-white p-5 text-sm text-[#667085] shadow-sm">Danh sách quản lý tài khoản chi tiết sẽ được mở rộng khi có yêu cầu khóa, mở khóa hoặc thay đổi trạng thái người dùng.</section>
    </div>
  );
}
