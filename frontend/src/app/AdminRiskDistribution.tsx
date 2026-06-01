import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { AdminDashboardData, AuditLog } from "../lib/admin";

type AdminRiskDistributionProps = {
  items: AdminDashboardData["risk_distribution"];
  onSelectRisk: (risk: AuditLog["risk_level"]) => void;
};

const colors = { LOW: "#12b76a", MEDIUM: "#f79009", HIGH: "#f04438" };

export function AdminRiskDistribution({ items, onSelectRisk }: AdminRiskDistributionProps) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="rounded-2xl border border-[#dce4ee] bg-white p-5 shadow-sm">
      <h2 className="font-black text-[#172033]">Phân bố mức độ rủi ro</h2>
      <p className="mt-1 text-sm text-[#667085]">Phân bố rủi ro audit trong kỳ theo dõi.</p>
      <div className="relative mt-3 h-52">
        {total === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-[#667085]">Chưa có sự kiện audit.</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={items} dataKey="count" nameKey="risk_level" innerRadius={62} outerRadius={88} paddingAngle={3}>
                  {items.map((item) => (
                    <Cell key={item.risk_level} fill={colors[item.risk_level]} onClick={() => onSelectRisk(item.risk_level)} className="cursor-pointer" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-[#172033]">{total}</span>
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-[#98a2b3]">sự kiện</span>
            </div>
          </>
        )}
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <button key={item.risk_level} onClick={() => onSelectRisk(item.risk_level)} className="flex w-full items-center justify-between rounded-lg px-2 py-1 text-sm hover:bg-[#f8fafc]">
            <span className="flex items-center gap-2 font-bold text-[#475467]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colors[item.risk_level] }} />
              {item.risk_level}
            </span>
            <span className="font-black text-[#344054]">{item.count} <span className="ml-1 text-xs font-semibold text-[#98a2b3]">{item.percentage}%</span></span>
          </button>
        ))}
      </div>
    </section>
  );
}
