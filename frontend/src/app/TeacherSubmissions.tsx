import { AlertTriangle, CheckCircle2, FileText, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getStoredToken } from "../lib/auth";
import { getTeacherClassDetail, type TeacherClassDetail, type TeacherClassSummary } from "../lib/teacher";
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

const GRADING_STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Chưa chấm",
  GRADED: "Đã chấm",
  RETURNED: "Đã trả bài",
  NEEDS_REVISION: "Cần sửa",
};

function gradingStatusLabel(status: string) {
  return GRADING_STATUS_LABELS[status] ?? status;
}

function ResultBadge({ item }: { item: TeacherSubmissionListItem }) {
  if (item.submission_type === "PDF_ANSWER") {
    const color =
      item.grading_status === "GRADED" || item.grading_status === "RETURNED"
        ? "bg-[#e8f7ef] text-[#067647]"
        : "bg-[#fff3e6] text-[#b54708]";
    return <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${color}`}>{gradingStatusLabel(item.grading_status)}</span>;
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
  onSave: (payload: { feedback: string; score: string }) => Promise<void>;
  isSaving: boolean;
}) {
  const [feedback, setFeedback] = useState(detail.teacher_feedback ?? "");
  const [score, setScore] = useState(detail.score != null ? String(detail.score) : "");
  const maxScore = detail.max_score ?? 10;
  const scoreValue = score === "" ? null : Number.parseFloat(score);
  const isScoreInvalid = scoreValue == null || Number.isNaN(scoreValue) || scoreValue < 0 || scoreValue > maxScore;

  useEffect(() => {
    setFeedback(detail.teacher_feedback ?? "");
    setScore(detail.score != null ? String(detail.score) : "");
  }, [detail.id, detail.teacher_feedback, detail.score]);

  function handleScoreChange(value: string) {
    if (!value) {
      setScore("");
      return;
    }
    const nextScore = Number.parseFloat(value);
    if (Number.isNaN(nextScore)) return;
    setScore(String(Math.min(nextScore, maxScore)));
  }

  return (
    <div className="min-w-0 space-y-4">
      <section className="rounded-xl border border-[#dfe6ef] bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold">{detail.child_name}</h2>
              <ResultBadge item={detail} />
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
              <div className="text-2xl font-bold">{maxScore}</div>
              <div className="text-xs text-[#667085]">Thang điểm</div>
            </div>
            <div className="flex min-h-[72px] flex-col items-center justify-center rounded-lg bg-[#f8fafc] px-3 py-3">
              <div className="text-center text-sm font-bold leading-tight">{gradingStatusLabel(detail.grading_status)}</div>
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
          <div className="mt-4 grid gap-2">
            <label className="text-xs font-bold uppercase text-[#667085]">Điểm</label>
            <input value={score} onChange={(event) => handleScoreChange(event.target.value)} type="number" min="0" max={maxScore} step="0.5" className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]" placeholder={`Tối đa ${maxScore}`} />
            <div className="text-xs text-[#667085]">Điểm phải nhỏ hơn hoặc bằng {maxScore}.</div>
          </div>
          <textarea
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            className="mt-4 min-h-32 w-full rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm outline-none focus:border-[#1d73e8]"
            placeholder="Nhận xét cho phụ huynh và học sinh..."
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => onSave({ feedback, score })}
              disabled={isSaving || isScoreInvalid}
              className="rounded-lg bg-[#1d73e8] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              Lưu
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
  const [childFilter, setChildFilter] = useState("ALL");
  const [classDetail, setClassDetail] = useState<TeacherClassDetail | null>(null);
  const [correctFilter, setCorrectFilter] = useState("ALL");
  const [speechFilter, setSpeechFilter] = useState("ALL");
  const [reviewedFilter, setReviewedFilter] = useState("ALL");
  const [gradingFilter, setGradingFilter] = useState("ALL");
  const [lateFilter, setLateFilter] = useState("ALL");
  const [scoreMin, setScoreMin] = useState("");
  const [scoreMax, setScoreMax] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const activeRoster = useMemo(
    () => classDetail?.roster.filter((child) => child.status === "ACTIVE" && child.membership_status === "ACTIVE") ?? [],
    [classDetail],
  );
  const classAssignments = classDetail?.assignments ?? [];
  const isClassContextReady = classDetail?.id === classFilter;
  const isClassLocked = Boolean(selectedClassId);
  const selectedAssignmentMaxScore = classAssignments.find((item) => item.id === assignmentFilter)?.max_score ?? 100;
  const selectedClassName = classes.find((item) => item.id === classFilter)?.name ?? "lớp đã chọn";

  function handleScoreMaxFilterChange(value: string) {
    if (!value) {
      setScoreMax("");
      return;
    }
    const nextScore = Number.parseFloat(value);
    if (Number.isNaN(nextScore)) return;
    setScoreMax(String(Math.min(nextScore, selectedAssignmentMaxScore)));
  }

  async function loadSubmissions(selectFirst = false) {
    if (!token || classFilter === "ALL" || !isClassContextReady) return;
    setIsLoading(true);
    setError("");
    try {
      const result = await listTeacherSubmissions(token, {
        class_id: classFilter,
        assignment_id: assignmentFilter,
        child_id: childFilter,
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

  async function loadClassContext(classId: string) {
    if (!token || classId === "ALL") {
      setClassDetail(null);
      return;
    }
    setError("");
    try {
      setClassDetail(await getTeacherClassDetail(token, classId));
    } catch (requestError) {
      setClassDetail(null);
      setError(requestError instanceof Error ? requestError.message : "Không tải được dữ liệu lớp");
    }
  }

  useEffect(() => {
    loadSubmissions(true);
  }, [token, classFilter, isClassContextReady, assignmentFilter, childFilter, correctFilter, speechFilter, reviewedFilter, gradingFilter, lateFilter, scoreMin, scoreMax]);

  useEffect(() => {
    if (scoreMax && Number.parseFloat(scoreMax) > selectedAssignmentMaxScore) {
      setScoreMax(String(selectedAssignmentMaxScore));
    }
  }, [scoreMax, selectedAssignmentMaxScore]);

  useEffect(() => {
    if (classFilter !== "ALL") return;
    const nextClassId = selectedClassId ?? classes[0]?.id;
    if (nextClassId) setClassFilter(nextClassId);
  }, [classes, selectedClassId, classFilter]);

  useEffect(() => {
    setAssignmentFilter("ALL");
    setChildFilter("ALL");
    setSelectedId(null);
    setDetail(null);
    loadClassContext(classFilter);
  }, [token, classFilter]);

  useEffect(() => {
    if (!selectedClassId || selectedClassId === classFilter) return;
    setClassFilter(selectedClassId);
  }, [selectedClassId, classFilter]);

  useEffect(() => {
    if (!selectedAssignmentId || selectedAssignmentId === assignmentFilter) return;
    if (classAssignments.length && !classAssignments.some((item) => item.id === selectedAssignmentId)) return;
    setAssignmentFilter(selectedAssignmentId);
    setSelectedId(null);
    setDetail(null);
  }, [selectedAssignmentId, assignmentFilter, classAssignments]);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
  }, [selectedId]);

  async function handleSaveFeedback(payload: { feedback: string; score: string }) {
    if (!token || !selectedId) return;
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateTeacherSubmissionReview(token, selectedId, {
        teacher_feedback: payload.feedback,
        reviewed: true,
        score: payload.score ? Number.parseFloat(payload.score) : null,
        grading_status: "RETURNED",
      });
      setDetail(updated);
      setMessage("Đã lưu.");
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
            <div className="grid grid-cols-1 gap-2">
              {isClassLocked ? (
                <div className="rounded-lg border border-[#d0d8e4] bg-[#f8fafc] px-3 py-2 text-sm font-semibold text-[#344054]">
                  {selectedClassName}
                </div>
              ) : (
                <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)} className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm">
                  {!classes.length && <option value="ALL">Chưa có lớp</option>}
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select value={childFilter} onChange={(event) => setChildFilter(event.target.value)} className="min-w-0 rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm">
                <option value="ALL">Học sinh</option>
                {activeRoster.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.display_name} - {child.parent.full_name}
                  </option>
                ))}
              </select>
              <select value={assignmentFilter} onChange={(event) => setAssignmentFilter(event.target.value)} className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm">
                <option value="ALL">Bài giao</option>
                {classAssignments.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
              </select>
              <select value={gradingFilter} onChange={(event) => setGradingFilter(event.target.value)} className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm">
                <option value="ALL">Trạng thái</option>
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
              <input value={scoreMin} onChange={(event) => setScoreMin(event.target.value)} type="number" min="0" max={selectedAssignmentMaxScore} step="0.5" className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm" placeholder="Điểm từ" />
              <input value={scoreMax} onChange={(event) => handleScoreMaxFilterChange(event.target.value)} type="number" min="0" max={selectedAssignmentMaxScore} step="0.5" className="rounded-lg border border-[#d0d8e4] px-3 py-2 text-sm" placeholder={`Điểm đến (≤ ${selectedAssignmentMaxScore})`} />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {items.map((item) => (
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
                <span>{item.score != null ? `${item.score}/${item.max_score ?? 10}` : gradingStatusLabel(item.grading_status)}</span>
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
          {!isLoading && !items.length && (
            <div className="rounded-xl border border-[#dfe6ef] bg-white p-5 text-sm text-[#667085]">
              Không có bài nộp phù hợp trong {selectedClassName}.
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
