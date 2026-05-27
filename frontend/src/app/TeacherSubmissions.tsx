import { AlertTriangle, CheckCircle2, FileText, MessageSquareText, Save, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getStoredToken } from "../lib/auth";
import type { TeacherClassSummary } from "../lib/teacher";
import {
  getTeacherSubmissionDetail,
  listTeacherSubmissions,
  updateTeacherSubmissionReview,
  type TeacherSubmissionDetail,
  type TeacherSubmissionListItem,
} from "../lib/teacherSubmissions";

type TeacherSubmissionsProps = {
  classes: TeacherClassSummary[];
  selectedClassId?: string | null;
  selectedAssignmentId?: string | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function ResultBadge({ item }: { item: TeacherSubmissionListItem }) {
  if (item.submission_type === "PDF_ANSWER") {
    const color =
      item.grading_status === "GRADED" || item.grading_status === "RETURNED"
        ? "bg-[#e8f7ef] text-[#067647]"
        : "bg-[#fff3e6] text-[#b54708]";
    return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${color}`}>{item.grading_status}</span>;
  }
  if (!item.is_correct) {
    return <span className="rounded-full bg-[#fff3e6] px-2.5 py-1 text-xs font-bold text-[#b54708]">Sai</span>;
  }
  if ((item.confidence ?? 0) < 0.7) {
    return <span className="rounded-full bg-[#fff8db] px-2.5 py-1 text-xs font-bold text-[#946800]">Confidence thấp</span>;
  }
  return <span className="rounded-full bg-[#e8f7ef] px-2.5 py-1 text-xs font-bold text-[#067647]">Đúng</span>;
}

function SubmissionDetailPanel({
  detail,
  onSave,
  isSaving,
}: {
  detail: TeacherSubmissionDetail;
  onSave: (payload: { feedback: string; reviewed: boolean; score: string; maxScore: string; gradingStatus: string }) => Promise<void>;
  isSaving: boolean;
}) {
  const [feedback, setFeedback] = useState(detail.teacher_feedback ?? "");
  const [reviewed, setReviewed] = useState(Boolean(detail.reviewed_at));
  const [score, setScore] = useState(detail.score != null ? String(detail.score) : "");
  const [maxScore, setMaxScore] = useState(String(detail.max_score ?? 10));
  const [gradingStatus, setGradingStatus] = useState(detail.grading_status ?? "SUBMITTED");

  useEffect(() => {
    setFeedback(detail.teacher_feedback ?? "");
    setReviewed(Boolean(detail.reviewed_at));
    setScore(detail.score != null ? String(detail.score) : "");
    setMaxScore(String(detail.max_score ?? 10));
    setGradingStatus(detail.grading_status ?? "SUBMITTED");
  }, [detail.id, detail.teacher_feedback, detail.reviewed_at]);

  return (
    <div className="min-w-0 space-y-4">
      <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold">{detail.child_name}</h2>
              <ResultBadge item={detail} />
              {detail.reviewed_at ? (
                <span className="rounded-full bg-[#eaf3ff] px-2.5 py-1 text-xs font-bold text-[#155dcc]">Đã review</span>
              ) : (
                <span className="rounded-full bg-[#f2f4f7] px-2.5 py-1 text-xs font-bold text-[#667085]">Chưa review</span>
              )}
            </div>
            <p className="text-sm text-[#667085]">
              {detail.class_name} · {detail.assignment_title}
            </p>
            <p className="mt-1 text-sm text-[#667085]">Phụ huynh: {detail.parent_name} · {detail.parent_email}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-[#f5f9ff] px-4 py-3">
              <div className="text-2xl font-bold">{detail.score != null ? detail.score : "-"}</div>
              <div className="text-xs text-[#667085]">Điểm</div>
            </div>
            <div className="rounded-lg bg-[#f8fafc] px-4 py-3">
              <div className="text-2xl font-bold">{detail.max_score ?? 10}</div>
              <div className="text-xs text-[#667085]">Thang điểm</div>
            </div>
            <div className="rounded-lg bg-[#f8fafc] px-4 py-3">
              <div className="text-2xl font-bold">{detail.grading_status}</div>
              <div className="text-xs text-[#667085]">Trạng thái</div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold">
            <FileText size={18} />
            File bài làm
          </h3>
          <div className="mt-4 grid gap-3 text-sm">
            <div className="rounded-lg bg-[#f8fafc] p-3">
              <div className="text-xs font-bold uppercase text-[#667085]">File trả lời</div>
              {detail.answer_file_url ? (
                <a href={`http://localhost:8000${detail.answer_file_url}`} target="_blank" rel="noreferrer" className="mt-2 inline-flex rounded-lg border border-[#d0d8e4] px-3 py-2 text-xs font-bold text-[#344054] hover:bg-white">
                  Mở file đã nộp
                </a>
              ) : (
                <div className="mt-1 font-semibold">Chưa có file</div>
              )}
            </div>
            <div className="rounded-lg bg-[#f8fafc] p-3">
              <div className="text-xs font-bold uppercase text-[#667085]">Thời điểm nộp</div>
              <div className="mt-1 font-semibold">{detail.submitted_at ? formatDate(detail.submitted_at) : formatDate(detail.created_at)}</div>
            </div>
            <div className="rounded-lg bg-[#f8fafc] p-3">
              <div className="text-xs font-bold uppercase text-[#667085]">Bài giao</div>
              <div className="mt-1 font-semibold">{detail.assignment_title}</div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <h3 className="flex items-center gap-2 font-bold">
            <Save size={18} />
            Chấm điểm và phản hồi
          </h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input value={score} onChange={(event) => setScore(event.target.value)} type="number" min="0" max="100" step="0.5" className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]" placeholder="Điểm" />
            <input value={maxScore} onChange={(event) => setMaxScore(event.target.value)} type="number" min="1" max="100" step="0.5" className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]" placeholder="Thang điểm" />
            <select value={gradingStatus} onChange={(event) => setGradingStatus(event.target.value)} className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]">
              <option value="SUBMITTED">Chưa chấm</option>
              <option value="GRADED">Đã chấm</option>
              <option value="RETURNED">Đã trả bài</option>
              <option value="NEEDS_REVISION">Cần sửa</option>
            </select>
          </div>
          <textarea
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            className="mt-4 min-h-32 w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
            placeholder="Nhận xét cho phụ huynh và học sinh..."
          />
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-[#344054]">
            <input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} />
            Đánh dấu đã review
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => onSave({ feedback, reviewed, score, maxScore, gradingStatus })}
              disabled={isSaving}
              className="rounded-lg bg-[#1d73e8] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              Lưu feedback
            </button>
            <button
              disabled
              className="inline-flex items-center gap-2 rounded-lg border border-[#d0d8e4] px-4 py-2.5 text-sm font-bold text-[#667085] disabled:opacity-60"
              title="Sẽ nối ở Phase 08"
            >
              <MessageSquareText size={16} />
              Mở trao đổi
            </button>
          </div>
          <div className="mt-4 rounded-lg bg-[#f8fafc] p-3 text-sm text-[#667085]">
            Tài liệu lesson: {detail.lesson_materials.length ? detail.lesson_materials.join(", ") : "Chưa có tài liệu"}
          </div>
        </section>
      </div>
    </div>
  );
}

export function TeacherSubmissions({ classes, selectedClassId, selectedAssignmentId }: TeacherSubmissionsProps) {
  const token = getStoredToken();
  const [items, setItems] = useState<TeacherSubmissionListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TeacherSubmissionDetail | null>(null);
  const [classFilter, setClassFilter] = useState(selectedClassId ?? "ALL");
  const [assignmentFilter, setAssignmentFilter] = useState(selectedAssignmentId ?? "ALL");
  const [correctFilter, setCorrectFilter] = useState("ALL");
  const [speechFilter, setSpeechFilter] = useState("ALL");
  const [reviewedFilter, setReviewedFilter] = useState("ALL");
  const [gradingFilter, setGradingFilter] = useState("ALL");
  const [lateFilter, setLateFilter] = useState("ALL");
  const [scoreMin, setScoreMin] = useState("");
  const [scoreMax, setScoreMax] = useState("");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (item) =>
        item.child_name.toLowerCase().includes(query) ||
        item.assignment_title.toLowerCase().includes(query) ||
        item.parent_email.toLowerCase().includes(query),
    );
  }, [items, search]);

  async function loadSubmissions(selectFirst = false) {
    if (!token) return;
    setIsLoading(true);
    setError("");
    try {
      const result = await listTeacherSubmissions(token, {
        class_id: classFilter,
        assignment_id: assignmentFilter,
        is_correct: correctFilter,
        speech_passed: speechFilter,
        reviewed: reviewedFilter,
        grading_status: gradingFilter,
        late: lateFilter,
        score_min: scoreMin,
        score_max: scoreMax,
      });
      setItems(result);
      const nextId = selectFirst ? result[0]?.id ?? null : selectedId;
      if (nextId) setSelectedId(nextId);
      if (!nextId) setDetail(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không tải được bài nộp");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadDetail(submissionId: string) {
    if (!token) return;
    try {
      setDetail(await getTeacherSubmissionDetail(token, submissionId));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không tải được chi tiết bài nộp");
    }
  }

  useEffect(() => {
    loadSubmissions(true);
  }, [token, classFilter, assignmentFilter, correctFilter, speechFilter, reviewedFilter, gradingFilter, lateFilter, scoreMin, scoreMax]);

  useEffect(() => {
    if (!selectedClassId || selectedClassId === classFilter) return;
    setClassFilter(selectedClassId);
    setSelectedId(null);
    setDetail(null);
  }, [selectedClassId, classFilter]);

  useEffect(() => {
    if (!selectedAssignmentId || selectedAssignmentId === assignmentFilter) return;
    setAssignmentFilter(selectedAssignmentId);
    setSelectedId(null);
    setDetail(null);
  }, [selectedAssignmentId, assignmentFilter]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId]);

  async function handleSaveFeedback(payload: { feedback: string; reviewed: boolean; score: string; maxScore: string; gradingStatus: string }) {
    if (!token || !selectedId) return;
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateTeacherSubmissionReview(token, selectedId, {
        teacher_feedback: payload.feedback,
        reviewed: payload.reviewed,
        score: payload.score ? Number.parseFloat(payload.score) : null,
        max_score: payload.maxScore ? Number.parseFloat(payload.maxScore) : null,
        grading_status: payload.gradingStatus,
      });
      setDetail(updated);
      setMessage("Đã lưu feedback.");
      await loadSubmissions();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Không lưu được feedback");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="grid min-w-0 gap-5 xl:grid-cols-[390px_minmax(0,1fr)]">
      <div className="space-y-4">
        <div className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Bài nộp</h2>
              <p className="text-sm text-[#667085]">Lọc, review và phản hồi kết quả học tập.</p>
            </div>
            <CheckCircle2 className="text-[#1d73e8]" size={22} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2 rounded-lg border border-[#d0d8e4] px-3 py-2">
              <Search size={16} className="text-[#667085]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                placeholder="Tìm học sinh, bài giao, email"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)} className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm">
                <option value="ALL">Tất cả lớp</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <select value={assignmentFilter} onChange={(event) => setAssignmentFilter(event.target.value)} className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm">
                <option value="ALL">Mọi bài giao</option>
                {items
                  .filter((item, index, array) => array.findIndex((other) => other.assignment_id === item.assignment_id) === index)
                  .map((item) => (
                    <option key={item.assignment_id} value={item.assignment_id}>
                      {item.assignment_title}
                    </option>
                  ))}
              </select>
              <select value={gradingFilter} onChange={(event) => setGradingFilter(event.target.value)} className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm">
                <option value="ALL">Mọi trạng thái chấm</option>
                <option value="SUBMITTED">Chưa chấm</option>
                <option value="GRADED">Đã chấm</option>
                <option value="RETURNED">Đã trả bài</option>
                <option value="NEEDS_REVISION">Cần sửa</option>
              </select>
              <select value={reviewedFilter} onChange={(event) => setReviewedFilter(event.target.value)} className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm">
                <option value="ALL">Review</option>
                <option value="true">Đã review</option>
                <option value="false">Chưa review</option>
              </select>
              <select value={lateFilter} onChange={(event) => setLateFilter(event.target.value)} className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm">
                <option value="ALL">Đúng hạn/muộn</option>
                <option value="false">Đúng hạn</option>
                <option value="true">Nộp muộn</option>
              </select>
              <input value={scoreMin} onChange={(event) => setScoreMin(event.target.value)} type="number" min="0" max="100" step="0.5" className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm" placeholder="Điểm từ" />
              <input value={scoreMax} onChange={(event) => setScoreMax(event.target.value)} type="number" min="0" max="100" step="0.5" className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm" placeholder="Điểm đến" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm transition ${
                selectedId === item.id ? "border-[#1d73e8] bg-[#f2f7ff]" : "border-[#e4eaf2] hover:bg-[#f8fafc]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-bold">{item.child_name}</div>
                  <div className="mt-1 text-sm text-[#667085]">{item.assignment_title}</div>
                </div>
                <ResultBadge item={item} />
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-[#667085]">
                <span>{item.class_name}</span>
                <span>{item.score != null ? `${item.score}/${item.max_score ?? 10}` : item.grading_status}</span>
                <span>{item.reviewed_at ? "Đã review" : "Chưa review"}</span>
                <span>{formatDate(item.created_at)}</span>
              </div>
              {item.review_reason && (
                <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#fff3e6] px-2.5 py-1 text-xs font-bold text-[#b54708]">
                  <AlertTriangle size={13} />
                  {item.review_reason}
                </div>
              )}
            </button>
          ))}
          {isLoading && <div className="rounded-xl bg-white p-5 text-sm text-[#667085]">Đang tải bài nộp...</div>}
          {!isLoading && !filteredItems.length && (
            <div className="rounded-xl border border-[#dfe6ef] bg-white p-5 text-sm text-[#667085]">
              Không có bài nộp phù hợp với bộ lọc.
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0 space-y-4">
        {(error || message) && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
              error ? "border-[#fecdca] bg-[#fff4f3] text-[#b42318]" : "border-[#abefc6] bg-[#f0fdf4] text-[#067647]"
            }`}
          >
            {error || message}
          </div>
        )}
        {detail ? (
          <SubmissionDetailPanel detail={detail} onSave={handleSaveFeedback} isSaving={isSaving} />
        ) : (
          <div className="rounded-xl border border-[#dfe6ef] bg-white p-8 text-center text-[#667085] shadow-sm">
            Chọn một bài nộp để xem chi tiết.
          </div>
        )}
      </div>
    </section>
  );
}
