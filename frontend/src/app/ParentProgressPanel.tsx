import { Award, CheckCircle2, Coins, MessageSquareText, TrendingUp, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { getChildProgress, getParentDashboard, type ParentDashboardSummary, type ParentProgressSummary } from "../lib/parentProgress";
import type { ParentChild } from "../lib/parent";

type ParentProgressPanelProps = {
  token: string;
  child: ParentChild;
};

function formatDateTime(value: string | null) {
  if (!value) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function percent(done: number, total: number) {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

export function ParentProgressPanel({ token, child }: ParentProgressPanelProps) {
  const [dashboard, setDashboard] = useState<ParentDashboardSummary | null>(null);
  const [progress, setProgress] = useState<ParentProgressSummary | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    setShowAllHistory(false);
    Promise.all([getParentDashboard(token), getChildProgress(token, child.id)])
      .then(([dashboardResult, progressResult]) => {
        setDashboard(dashboardResult);
        setProgress(progressResult);
      })
      .catch((requestError) =>
        setError(requestError instanceof Error ? requestError.message : "Không tải được tiến độ học tập"),
      );
  }, [token, child.id]);

  const completion = progress
    ? percent(progress.submitted_assignment_count, progress.published_assignment_count)
    : 0;
  const accuracy = progress ? percent(progress.correct_submissions, progress.total_submissions) : 0;
  const pdfHistory = progress?.recent_submissions.filter((submission) => submission.submission_type === "PDF_ANSWER") ?? [];
  const visibleHistory = showAllHistory ? pdfHistory : pdfHistory.slice(0, 5);

  return (
    <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold">
            <TrendingUp size={20} className="text-[#12b76a]" />
            Tiến độ học tập
          </h3>
          <p className="mt-1 text-sm text-[#667085]">Theo dõi bài PDF đã nộp, điểm số và feedback giáo viên.</p>
        </div>
        {dashboard && (
          <span className="rounded-full bg-[#edf4ff] px-3 py-1.5 text-xs font-bold text-[#155dcc]">
            {dashboard.class_count} lớp
          </span>
        )}
      </div>

      {error && <div className="mb-4 rounded-lg bg-[#fff4f3] p-3 text-sm font-semibold text-[#b42318]">{error}</div>}

      {progress ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg bg-[#f8fafc] p-4">
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-[#667085]">Hoàn thành</div>
              <div className="mt-2 text-2xl font-black">{completion}%</div>
              <div className="mt-1 text-xs font-semibold text-[#667085]">
                {progress.submitted_assignment_count}/{progress.published_assignment_count} bài
              </div>
            </div>
            <div className="rounded-lg bg-[#f8fafc] p-4">
              <div className="text-xs font-bold uppercase tracking-[0.12em] text-[#667085]">Đúng</div>
              <div className="mt-2 text-2xl font-black">{accuracy}%</div>
              <div className="mt-1 text-xs font-semibold text-[#667085]">
                {progress.correct_submissions}/{progress.total_submissions} lượt nộp
              </div>
            </div>
            <div className="rounded-lg bg-[#f8fafc] p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#667085]">
                <Award size={14} />
                Sao
              </div>
              <div className="mt-2 text-2xl font-black">{progress.total_stars}</div>
              <div className="mt-1 text-xs font-semibold text-[#667085]">Tổng thưởng</div>
            </div>
            <div className="rounded-lg bg-[#f8fafc] p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#667085]">
                <Coins size={14} />
                Xu
              </div>
              <div className="mt-2 text-2xl font-black">{progress.total_coins}</div>
              <div className="mt-1 text-xs font-semibold text-[#667085]">Lần gần nhất {formatDateTime(progress.latest_submission_at)}</div>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-bold">Lịch sử bài PDF gần đây</h4>
              <span className="text-xs font-semibold text-[#667085]">{progress.pending_assignment_count} bài chưa nộp</span>
            </div>
            <div className="space-y-3">
              {visibleHistory.map((submission) => (
                <article key={submission.id} className="rounded-lg border border-[#e4eaf2] bg-[#fbfcfe] p-4">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 font-bold">
                        {submission.score != null ? (
                          <CheckCircle2 size={17} className="text-[#12b76a]" />
                        ) : (
                          <XCircle size={17} className="text-[#f79009]" />
                        )}
                        {submission.assignment_title}
                      </div>
                      <div className="mt-1 text-sm text-[#667085]">
                        {submission.class_name} - {submission.lesson_title}
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-[#98a2b3]">{formatDateTime(submission.created_at)}</div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[#344054]">
                    <span className="rounded-full bg-white px-2.5 py-1">{submission.grading_status ?? "Đã nộp"}</span>
                    <span className="rounded-full bg-white px-2.5 py-1">
                      {submission.score != null ? `Điểm ${submission.score}/${submission.max_score ?? 10}` : "Chưa chấm"}
                    </span>
                  </div>
                  {submission.teacher_feedback && (
                    <div className="mt-3 rounded-lg border border-[#d0e4ff] bg-[#f2f7ff] p-3 text-sm leading-6 text-[#344054]">
                      <div className="mb-1 flex items-center gap-2 font-bold text-[#155dcc]">
                        <MessageSquareText size={15} />
                        Feedback của giáo viên
                      </div>
                      {submission.teacher_feedback}
                    </div>
                  )}
                </article>
              ))}
              {pdfHistory.length > 5 && (
                <button
                  onClick={() => setShowAllHistory((current) => !current)}
                  className="w-full rounded-lg border border-[#12b76a] px-4 py-2.5 text-sm font-bold text-[#087443] hover:bg-[#ecfdf3]"
                >
                  {showAllHistory ? "Thu gọn" : "Xem tất cả"}
                </button>
              )}
              {!pdfHistory.length && (
                <div className="rounded-lg bg-[#f8fafc] p-4 text-sm text-[#667085]">
                  Chưa có bài PDF nào được nộp. Khi bé nộp bài tập PDF, lịch sử sẽ xuất hiện ở đây.
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-lg bg-[#f8fafc] p-4 text-sm text-[#667085]">Đang tải tiến độ...</div>
      )}
    </section>
  );
}
