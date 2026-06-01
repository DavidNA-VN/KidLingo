import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { AdminDashboardData } from "../lib/admin";

export function AdminFeatureOperations({ data }: { data: AdminDashboardData }) {
  const assignmentTotal = data.feature_operations.assignment_statuses.reduce((sum, item) => sum + item.count, 0);
  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-gradient-to-r from-[#12382d] via-[#176447] to-[#16835e] p-6 text-white shadow-lg">
        <h2 className="text-2xl font-black">Vận hành tính năng</h2>
        <p className="mt-2 text-sm text-white/80">Quan sát mức sử dụng bài tập và bài nộp theo lớp học.</p>
      </section>
      <section className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <article className="rounded-2xl border border-[#dce4ee] bg-white p-5 shadow-sm">
          <h2 className="font-black">Bài nộp theo lớp</h2><p className="mt-1 text-sm text-[#667085]">Phân bố bài nộp trên các lớp có hoạt động.</p>
          <div className="mt-5 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.feature_operations.submissions_by_class}><CartesianGrid strokeDasharray="4 4" stroke="#e4eaf1" /><XAxis dataKey="class_name" stroke="#98a2b3" fontSize={11} /><YAxis stroke="#98a2b3" fontSize={12} allowDecimals={false} /><Tooltip /><Bar dataKey="submission_count" name="Bài nộp" fill="#12b76a" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </article>
        <article className="rounded-2xl border border-[#dce4ee] bg-white p-5 shadow-sm">
          <h2 className="font-black">Trạng thái bài tập</h2><p className="mt-1 text-sm text-[#667085]">Tình trạng phát hành bài tập hiện tại.</p>
          <div className="mt-6 space-y-4">{data.feature_operations.assignment_statuses.length === 0 ? <div className="text-sm text-[#667085]">Chưa có bài tập.</div> : data.feature_operations.assignment_statuses.map((item) => <div key={item.status}><div className="flex justify-between text-sm"><span className="font-bold text-[#475467]">{item.status}</span><span className="font-black">{item.count}</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eef2f6]"><div className="h-full rounded-full bg-[#12b76a]" style={{ width: `${assignmentTotal ? (item.count / assignmentTotal) * 100 : 0}%` }} /></div></div>)}</div>
        </article>
      </section>
    </div>
  );
}
