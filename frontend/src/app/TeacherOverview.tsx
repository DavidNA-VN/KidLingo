import {
  AlertTriangle,
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  FileWarning,
  Trophy,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { getStoredToken } from "../lib/auth";
import { getTeacherDashboard, type TeacherDashboardData } from "../lib/dashboard";

type TeacherOverviewProps = {
  selectedClassId: string | null;
  selectedClassName?: string | null;
  onOpenSection?: (section: string, classId?: string) => void;
  onOpenStudentProfile?: (classId: string | null | undefined, childId: string) => void;
};

const statusLabels: Record<string, string> = {
  PUBLISHED: "Đã giao",
  CLOSED: "Đã đóng",
};

const chartColors = ["#1d73e8", "#12b76a", "#f79009", "#d92d20"];

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatDate(value: string | null) {
  if (!value) return "Chưa có hạn";
  return new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(value),
  );
}

function SummaryCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: typeof UsersRound;
}) {
  return (
    <div className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[#667085]">{label}</div>
          <div className="mt-2 text-3xl font-bold text-[#172033]">{value}</div>
        </div>
        <div className="rounded-lg bg-[#eaf3ff] p-2 text-[#155dcc]">
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-3 text-xs font-medium text-[#667085]">{helper}</div>
    </div>
  );
}

export function TeacherOverview({ selectedClassId, selectedClassName, onOpenSection, onOpenStudentProfile }: TeacherOverviewProps) {
  const token = getStoredToken();
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token || !selectedClassId) return;
    setIsLoading(true);
    setError("");
    getTeacherDashboard(token, selectedClassId)
      .then(setData)
      .catch((requestError) =>
        setError(requestError instanceof Error ? requestError.message : "Không tải được dashboard"),
      )
      .finally(() => setIsLoading(false));
  }, [token, selectedClassId]);

  const classChartData = useMemo(
    () =>
      data?.assignment_stats_by_class.map((item) => ({
        name: item.class_name,
        "Đã nộp": item.submitted_count,
        "Còn thiếu": item.missing_count,
        "Chưa chấm": item.ungraded_submission_count,
      })) ?? [],
    [data],
  );

  const statusChartData = useMemo(
    () => data?.status_breakdown.map((item) => ({ name: statusLabels[item.status], value: item.count })) ?? [],
    [data],
  );

  if (!selectedClassId) {
    return (
      <div className="rounded-xl border border-[#dfe6ef] bg-white p-8 text-center text-[#667085]">
        Chọn lớp để xem thống kê dashboard.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-[#dfe6ef] bg-white p-8 text-center text-[#667085]">
        Đang tải dashboard...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-[#fecdca] bg-[#fff4f3] p-5 text-sm font-semibold text-[#b42318]">
        {error || "Không có dữ liệu dashboard"}
      </div>
    );
  }

  return (
    <section className="min-w-0 space-y-5">
      {error && (
        <div className="rounded-xl border border-[#fecdca] bg-[#fff4f3] px-4 py-3 text-sm font-semibold text-[#b42318]">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Lớp đang xem" value={selectedClassName ?? data.class_progress[0]?.class_name ?? "Lớp"} helper="Dashboard đang lọc theo lớp đã chọn" icon={UsersRound} />
        <SummaryCard label="Học sinh active" value={data.summary.active_child_count} helper="Tính theo roster đang học" icon={BookOpenCheck} />
        <SummaryCard label="Bài đang mở" value={data.summary.open_assignment_count} helper="Bài tập đã giao" icon={ClipboardList} />
        <SummaryCard
          label="Bài chưa chấm"
          value={data.summary.ungraded_submission_count}
          helper={`Điểm TB ${data.summary.average_score ?? "N/A"}`}
          icon={FileWarning}
        />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <section className="min-w-0 rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold">Điều phối bài giao theo lớp</h2>
              <p className="text-sm text-[#667085]">Chỉ đọc: số đã nộp, còn thiếu và chưa chấm theo lớp.</p>
            </div>
            <BarChart3 className="text-[#1d73e8]" size={20} />
          </div>
          <div className="h-[300px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Đã nộp" fill="#1d73e8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Còn thiếu" fill="#f79009" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Chưa chấm" fill="#d92d20" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="min-w-0 rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <h2 className="font-bold">Trạng thái bài giao</h2>
          <p className="text-sm text-[#667085]">Tỉ lệ bản nháp, đã giao và đã đóng.</p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusChartData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={3}>
                  {statusChartData.map((_, index) => (
                    <Cell key={index} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <h2 className="font-bold">Chất lượng học tập gần đây</h2>
          <p className="text-sm text-[#667085]">Dựa trên điểm PDF và phát âm đạt/chưa đạt, không tính doodle game.</p>
          <div className="mt-4 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.submission_quality} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis dataKey="label" type="category" width={130} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#12b76a" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 text-sm font-semibold text-[#667085]">
            Tỉ lệ phát âm đạt: {percent(data.pronunciation_pass_rate)}
          </div>
        </section>

        <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="text-[#f79009]" size={20} />
            <h2 className="font-bold">Bài chưa chấm theo lớp</h2>
          </div>
          <div className="space-y-3">
            {data.ungraded_by_class.slice(0, 5).map((item) => (
              <div key={item.class_id} className="flex items-center justify-between gap-3 rounded-lg bg-[#f8fafc] p-4">
                <div>
                  <div className="font-bold">{item.class_name}</div>
                  <div className="text-sm text-[#667085]">
                    {item.submitted_count} đã nộp · {item.missing_count} còn thiếu
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-[#fff3e6] px-2.5 py-1 text-xs font-bold text-[#b54708]">
                    {item.ungraded_submission_count} chưa chấm
                  </span>
                  <button
                    onClick={() => onOpenSection?.("Bài nộp", item.class_id)}
                    className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-xs font-bold text-[#344054] hover:bg-white"
                  >
                    Xem bài nộp
                  </button>
                </div>
              </div>
            ))}
            {!data.ungraded_by_class.length && (
              <div className="rounded-lg bg-[#f0fdf4] p-4 text-sm font-semibold text-[#067647]">
                Hiện không có bài tập nào đang chờ chấm.
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Trophy className="text-[#f79009]" size={20} />
            <h2 className="font-bold">Học sinh điểm cao</h2>
          </div>
          <div className="space-y-3">
            {data.top_students.slice(0, 5).map((item, index) => (
              <div key={`${item.class_id}-${item.child_id}`} className="flex items-center justify-between gap-3 rounded-lg bg-[#f8fafc] p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-[#155dcc]">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <button
                      onClick={() => onOpenStudentProfile?.(item.class_id, item.child_id)}
                      className="truncate font-bold text-[#155dcc] hover:underline"
                    >
                      {item.child_name}
                    </button>
                    <div className="text-sm text-[#667085]">{item.class_name}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-[#067647]">{item.average_score}/10</div>
                  <div className="text-xs font-semibold text-[#667085]">{item.graded_submission_count} bài đã chấm</div>
                </div>
              </div>
            ))}
            {!data.top_students.length && (
              <div className="rounded-lg bg-[#f8fafc] p-4 text-sm text-[#667085]">
                Chưa có bài tập đã chấm để xếp hạng học sinh.
              </div>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <CalendarClock className="text-[#1d73e8]" size={20} />
            <h2 className="font-bold">Bài giao gần đây</h2>
          </div>
          <div className="space-y-3">
            {data.assignment_progress.slice(0, 5).map((item) => (
              <div key={item.assignment_id} className="rounded-lg border border-[#e4eaf2] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-bold text-[#172033]">{item.title}</div>
                    <div className="mt-1 text-sm text-[#667085]">{item.class_name} · {item.lesson_title}</div>
                  </div>
                  <span className="rounded-full bg-[#eaf3ff] px-2.5 py-1 text-xs font-bold text-[#155dcc]">
                    {statusLabels[item.status]}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-[#667085]">
                  <span>Hạn: {formatDate(item.due_at)}</span>
                  <span>{item.submitted_child_count}/{item.assigned_child_count} đã nộp</span>
                  <span>{item.ungraded_submission_count} chưa chấm</span>
                  <span>Điểm TB: {item.average_score ?? "N/A"}</span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => onOpenSection?.("Bài giao")}
            className="mt-4 rounded-lg border border-[#1d73e8] px-3 py-2 text-xs font-bold text-[#155dcc] hover:bg-[#f2f7ff]"
          >
            Xem tất cả bài giao
          </button>
        </section>

        <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm xl:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <CheckCircle2 className="text-[#12b76a]" size={20} />
            <h2 className="font-bold">Bài nộp gần đây</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-sm">
              <thead className="bg-[#f8fafc] text-xs uppercase tracking-wide text-[#667085]">
                <tr>
                  <th className="px-4 py-3">Học sinh</th>
                  <th className="px-4 py-3">Lớp</th>
                  <th className="px-4 py-3">Bài giao</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Điểm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1f5]">
                {data.recent_submissions.slice(0, 5).map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onOpenStudentProfile?.(item.class_id, item.child_id)}
                        className="font-bold text-[#155dcc] hover:underline"
                      >
                        {item.child_name}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-[#667085]">{item.class_name}</td>
                    <td className="px-4 py-3 text-[#667085]">{item.assignment_title}</td>
                    <td className="px-4 py-3 text-[#667085]">{item.grading_status}</td>
                    <td className="px-4 py-3 text-[#667085]">
                      {item.score != null ? `${item.score}/${item.max_score ?? 10}` : "Chưa chấm"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={() => onOpenSection?.("Bài nộp")}
            className="mt-4 rounded-lg border border-[#1d73e8] px-3 py-2 text-xs font-bold text-[#155dcc] hover:bg-[#f2f7ff]"
          >
            Xem tất cả bài nộp
          </button>
        </section>
      </div>
    </section>
  );
}
